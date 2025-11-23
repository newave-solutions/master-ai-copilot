import { FastifyInstance } from 'fastify';
import { db } from '../services/database';
import axios from 'axios';
import { randomBytes } from 'crypto';

interface DeveloperRegistration {
  name: string;
  email: string;
}

interface ToolSubmission {
  name: string;
  description?: string;
  mcpServerUrl: string;
  developerId: string;
}

function generateApiKey(): string {
  return `dev_${randomBytes(32).toString('hex')}`;
}

async function validateMcpServer(url: string): Promise<boolean> {
  try {
    const response = await axios.get(`${url}/tools`, {
      timeout: 5000,
      validateStatus: (status) => status < 500,
    });

    return response.status === 200 && response.data && typeof response.data === 'object';
  } catch (error) {
    console.error(`Failed to validate MCP server at ${url}:`, error);
    return false;
  }
}

export async function marketplaceRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: DeveloperRegistration }>(
    '/developers',
    async (request, reply) => {
      const { name, email } = request.body;

      if (!name || typeof name !== 'string') {
        reply.code(400);
        return {
          error: 'name is required and must be a string',
        };
      }

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        reply.code(400);
        return {
          error: 'email is required and must be a valid email address',
        };
      }

      try {
        const existingDeveloper = await db.findDeveloperByEmail(email);

        if (existingDeveloper) {
          reply.code(409);
          return {
            error: 'Developer with this email already exists',
          };
        }

        const apiKey = generateApiKey();

        const developer = await db.createDeveloper(name, email, apiKey);

        fastify.log.info(`New developer registered: ${email}`);

        reply.code(201);
        return {
          id: developer.id,
          name: developer.name,
          email: developer.email,
          apiKey: developer.apiKey,
          createdAt: developer.createdAt,
          message: 'Developer registered successfully. Save your API key securely!',
        };
      } catch (error) {
        fastify.log.error(error);
        reply.code(500);
        return {
          error: error instanceof Error ? error.message : 'Failed to register developer',
        };
      }
    }
  );

  fastify.get('/developers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const developer = await db.getDeveloperById(id);

      if (!developer) {
        reply.code(404);
        return {
          error: 'Developer not found',
        };
      }

      return {
        id: developer.id,
        name: developer.name,
        email: developer.email,
        createdAt: developer.createdAt,
        toolCount: developer.tools?.length || 0,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch developer',
      };
    }
  });

  fastify.post<{ Body: ToolSubmission }>(
    '/tools',
    async (request, reply) => {
      const { name, description, mcpServerUrl, developerId } = request.body;

      if (!name || typeof name !== 'string') {
        reply.code(400);
        return {
          error: 'name is required and must be a string',
        };
      }

      if (!mcpServerUrl || typeof mcpServerUrl !== 'string' || !mcpServerUrl.startsWith('http')) {
        reply.code(400);
        return {
          error: 'mcpServerUrl is required and must be a valid HTTP(S) URL',
        };
      }

      if (!developerId || typeof developerId !== 'string') {
        reply.code(400);
        return {
          error: 'developerId is required and must be a string',
        };
      }

      const apiKey = request.headers['x-api-key'] as string;

      if (!apiKey) {
        reply.code(401);
        return {
          error: 'API key is required. Include X-API-Key header.',
        };
      }

      try {
        const developer = await db.getDeveloperById(developerId);

        if (!developer) {
          reply.code(404);
          return {
            error: 'Developer not found',
          };
        }

        if (developer.apiKey !== apiKey) {
          reply.code(403);
          return {
            error: 'Invalid API key for this developer',
          };
        }

        fastify.log.info(`Validating MCP server at: ${mcpServerUrl}`);

        const isValid = await validateMcpServer(mcpServerUrl);

        if (!isValid) {
          reply.code(400);
          return {
            error: 'MCP server validation failed. Ensure the server is running and responds to GET /tools',
          };
        }

        const tool = await db.submitThirdPartyTool({
          name,
          description,
          mcpServerUrl,
          developerId,
        });

        fastify.log.info(`New tool submitted: ${name} by developer ${developerId}`);

        reply.code(201);
        return {
          id: tool.id,
          name: tool.name,
          description: tool.description,
          mcpServerUrl: tool.mcpServerUrl,
          status: tool.status,
          createdAt: tool.createdAt,
          message: 'Tool submitted successfully. It is pending review.',
        };
      } catch (error) {
        fastify.log.error(error);
        reply.code(500);
        return {
          error: error instanceof Error ? error.message : 'Failed to submit tool',
        };
      }
    }
  );

  fastify.get('/tools', async (_request, reply) => {
    try {
      const tools = await db.getAllThirdPartyTools();

      return tools.map((tool) => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        mcpServerUrl: tool.mcpServerUrl,
        status: tool.status,
        developerId: tool.developerId,
        developerName: tool.developer?.name,
        createdAt: tool.createdAt,
        reviewedAt: tool.reviewedAt,
      }));
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch tools',
      };
    }
  });

  fastify.get('/tools/approved', async (_request, reply) => {
    try {
      const tools = await db.getApprovedThirdPartyTools();

      return tools.map((tool) => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        mcpServerUrl: tool.mcpServerUrl,
        developerName: tool.developer?.name,
        createdAt: tool.createdAt,
        reviewedAt: tool.reviewedAt,
      }));
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch approved tools',
      };
    }
  });

  fastify.patch<{ Params: { id: string }; Body: { status: string; reviewNotes?: string } }>(
    '/tools/:id/review',
    async (request, reply) => {
      const { id } = request.params;
      const { status, reviewNotes } = request.body;

      const adminKey = request.headers['x-admin-api-key'] as string;

      if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
        reply.code(403);
        return {
          error: 'Unauthorized. Admin API key required.',
        };
      }

      if (!['APPROVED', 'REJECTED'].includes(status)) {
        reply.code(400);
        return {
          error: 'status must be either APPROVED or REJECTED',
        };
      }

      try {
        const tool = await db.reviewThirdPartyTool(
          id,
          status as 'APPROVED' | 'REJECTED',
          reviewNotes
        );

        if (!tool) {
          reply.code(404);
          return {
            error: 'Tool not found',
          };
        }

        fastify.log.info(`Tool ${id} reviewed: ${status}`);

        return {
          id: tool.id,
          name: tool.name,
          status: tool.status,
          reviewedAt: tool.reviewedAt,
          reviewNotes: tool.reviewNotes,
          message: `Tool ${status.toLowerCase()} successfully`,
        };
      } catch (error) {
        fastify.log.error(error);
        reply.code(500);
        return {
          error: error instanceof Error ? error.message : 'Failed to review tool',
        };
      }
    }
  );
}
