import Fastify from 'fastify';
import dotenv from 'dotenv';
import { InvokeRequest, InvokeResponse } from './types';
import { dispatchTool, getAvailableTools } from './tools/dispatcher';

dotenv.config({ path: '../.env' });

const server = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

server.get('/health', async () => {
  return {
    status: 'healthy',
    service: 'mcp-server',
    timestamp: new Date().toISOString(),
  };
});

server.get('/tools', async () => {
  return {
    tools: getAvailableTools(),
    count: getAvailableTools().length,
  };
});

server.post<{ Body: InvokeRequest }>('/invoke', async (request, reply) => {
  const { toolName, input } = request.body;
  const startTime = Date.now();

  try {
    if (!toolName) {
      reply.code(400);
      return {
        success: false,
        error: 'toolName is required',
        toolName: '',
        executionTime: 0,
      };
    }

    if (!input || typeof input !== 'object') {
      reply.code(400);
      return {
        success: false,
        error: 'input must be a valid object',
        toolName,
        executionTime: 0,
      };
    }

    server.log.info(`Invoking tool: ${toolName}`);

    const result = await dispatchTool(toolName, input);
    const executionTime = Date.now() - startTime;

    server.log.info(`Tool ${toolName} completed in ${executionTime}ms`);

    const response: InvokeResponse = {
      success: true,
      data: result,
      toolName,
      executionTime,
    };

    return response;
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    server.log.error(`Tool ${toolName} failed: ${errorMessage}`);

    reply.code(500);
    const response: InvokeResponse = {
      success: false,
      error: errorMessage,
      toolName,
      executionTime,
    };

    return response;
  }
});

const start = async () => {
  try {
    const port = parseInt(process.env.MCP_SERVER_PORT || '3001', 10);
    const host = '0.0.0.0';

    await server.listen({ port, host });

    console.log(`🚀 MCP Server running on http://localhost:${port}`);
    console.log(`📋 Available tools: ${getAvailableTools().length}`);
    console.log(`   - ${getAvailableTools().join('\n   - ')}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
