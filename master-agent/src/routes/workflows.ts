import { FastifyInstance } from 'fastify';
import { db } from '../services/database';
import { orchestrator } from '../services/orchestrator';
import { CreateWorkflowRequest, CreateWorkflowResponse, WorkflowStatusResponse } from '../types';

export async function workflowRoutes(fastify: FastifyInstance) {
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
        const project = await db.getOrCreateProject(projectName);

        const workflow = await db.createWorkflow(project.id);

        orchestrator.startWorkflow(workflow.id);

        fastify.log.info(`Workflow ${workflow.id} created and started for project: ${projectName}`);

        const response: CreateWorkflowResponse = {
          workflowId: workflow.id,
          projectId: project.id,
          projectName: project.name,
          status: workflow.status,
          message: 'Workflow created and started successfully',
        };

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
        const workflow = await db.getWorkflow(id);

        if (!workflow) {
          reply.code(404);
          return {
            error: 'Workflow not found',
          };
        }

        const response: WorkflowStatusResponse = {
          id: workflow.id,
          projectName: workflow.project.name,
          status: workflow.status,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
          jobs: workflow.jobs.map((job) => ({
            id: job.id,
            toolName: job.toolName,
            status: job.status,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            error: job.error,
            output: job.output,
          })),
        };

        return response;
      } catch (error) {
        fastify.log.error(error);
        reply.code(500);
        return {
          error: error instanceof Error ? error.message : 'Failed to fetch workflow',
        };
      }
    }
  );
}
