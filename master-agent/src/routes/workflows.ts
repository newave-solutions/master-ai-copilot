import { FastifyInstance } from 'fastify';
import { orchestrator } from '../services/orchestrator';
import { CreateWorkflowRequest } from '../types';
import { generateWorkflow } from '../services/ai-workflow-generator';
import { analysisService } from '../services/AnalysisService';
import { workflowService } from '../services/WorkflowService';

export async function workflowRoutes(fastify: FastifyInstance) {
  fastify.get('/workflows', async (_request, reply) => {
    try {
      const workflows = await workflowService.getAllWorkflows();
      return workflows;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch workflows',
      };
    }
  });

  fastify.post<{ Body: CreateWorkflowRequest }>(
    '/workflows',
    async (request, reply) => {
      const { projectName } = request.body;

      if (!projectName || typeof projectName !== 'string') {
        reply.code(400);
        return {
          error: 'projectName is required and must be a string',
        };
      }

      try {
        const response = await workflowService.createWorkflow(projectName);

        orchestrator.startWorkflow(response.workflowId);

        fastify.log.info(`Workflow ${response.workflowId} created and started for project: ${projectName}`);

        reply.code(201);
        return response;
      } catch (error) {
        fastify.log.error(error);
        reply.code(500);
        return {
          error: error instanceof Error ? error.message : 'Failed to create workflow',
        };
      }
    }
  );

  fastify.get<{ Params: { id: string } }>(
    '/workflows/:id',
    async (request, reply) => {
      const { id } = request.params;

      try {
        const workflow = await workflowService.getWorkflow(id);

        if (!workflow) {
          reply.code(404);
          return {
            error: 'Workflow not found',
          };
        }

        return workflow;
      } catch (error) {
        fastify.log.error(error);
        reply.code(500);
        return {
          error: error instanceof Error ? error.message : 'Failed to fetch workflow',
        };
      }
    }
  );

  fastify.post<{ Body: { goal: string } }>(
    '/workflows/generate',
    async (request, reply) => {
      const { goal } = request.body;

      if (!goal || typeof goal !== 'string') {
        reply.code(400);
        return {
          error: 'goal is required and must be a string',
        };
      }

      try {
        if (!process.env.GOOGLE_API_KEY) {
          reply.code(503);
          return {
            error: 'AI service not configured. Please set GOOGLE_API_KEY environment variable.',
          };
        }

        fastify.log.info(`Generating workflow for goal: ${goal}`);

        const result = await generateWorkflow(goal);

        fastify.log.info(`Generated workflow with ${result.tools.length} tools`);

        return {
          tools: result.tools,
          reasoning: result.reasoning,
          goal: goal,
        };
      } catch (error) {
        fastify.log.error(error);
        reply.code(500);
        return {
          error: error instanceof Error ? error.message : 'Failed to generate workflow',
        };
      }
    }
  );

  fastify.post<{ Body: { jobId: string } }>(
    '/jobs/analyze',
    async (request, reply) => {
      const { jobId } = request.body;

      if (!jobId || typeof jobId !== 'string') {
        reply.code(400);
        return {
          error: 'jobId is required and must be a string',
        };
      }

      try {
        if (!process.env.GOOGLE_API_KEY) {
          reply.code(503);
          return {
            error: 'AI service not configured. Please set GOOGLE_API_KEY environment variable.',
          };
        }

        fastify.log.info(`Analyzing failed job: ${jobId}`);

        const analysis = await analysisService.analyzeJobFailure(jobId);

        if (!analysis) {
          reply.code(404);
          return {
            error: 'Job not found or job is not in failed state',
          };
        }

        fastify.log.info(`Analysis completed for job: ${jobId}`);

        return {
          jobId,
          analysis,
        };
      } catch (error) {
        fastify.log.error(error);
        reply.code(500);
        return {
          error: error instanceof Error ? error.message : 'Failed to analyze job',
        };
      }
    }
  );
}
