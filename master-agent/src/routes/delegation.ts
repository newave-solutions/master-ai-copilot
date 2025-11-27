import { FastifyInstance } from 'fastify';
import { DelegationService } from '../services/DelegationService';

export async function delegationRoutes(fastify: FastifyInstance) {
  const delegationService = new DelegationService();

  // Delegate a task to an external service
  fastify.post('/api/delegate', async (request, reply) => {
    const { task, preferences } = request.body as {
      task: {
        title: string;
        description: string;
        type: string;
        requirements?: string[];
        context?: any;
      };
      preferences?: {
        preferredService?: string;
        priority?: string;
        deadline?: string;
      };
    };

    try {
      const result = await delegationService.delegateTask(task, preferences);
      return {
        success: true,
        delegation: result,
        message: `Task delegated to ${result.service.name}`,
      };
    } catch (error: any) {
      fastify.log.error(error);
      reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Get status of a delegated task
  fastify.get('/api/delegate/status/:delegationId', async (request, reply) => {
    const { delegationId } = request.params as { delegationId: string };

    try {
      const status = await delegationService.getTaskStatus(delegationId);
      return {
        success: true,
        status,
      };
    } catch (error: any) {
      fastify.log.error(error);
      reply.status(404).send({
        success: false,
        error: error.message,
      });
    }
  });

  // List all available delegation services
  fastify.get('/api/delegate/services', async () => {
    try {
      const services = await delegationService.getAvailableServices();
      return {
        success: true,
        services,
      };
    } catch (error: any) {
      fastify.log.error(error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Get delegation recommendations
  fastify.post('/api/delegate/recommend', async (request, reply) => {
    const { task } = request.body as {
      task: {
        description: string;
        type: string;
        requirements?: string[];
      };
    };

    try {
      const recommendations = await delegationService.recommendService(task);
      return {
        success: true,
        recommendations,
      };
    } catch (error: any) {
      fastify.log.error(error);
      reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Cancel a delegated task
  fastify.delete('/api/delegate/:delegationId', async (request, reply) => {
    const { delegationId } = request.params as { delegationId: string };

    try {
      await delegationService.cancelDelegation(delegationId);
      return {
        success: true,
        message: 'Delegation cancelled',
      };
    } catch (error: any) {
      fastify.log.error(error);
      reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // List all delegations
  fastify.get('/api/delegate', async (request) => {
    const { status, service } = request.query as {
      status?: string;
      service?: string;
    };

    try {
      const delegations = await delegationService.listDelegations({
        status,
        service,
      });
      return {
        success: true,
        delegations,
      };
    } catch (error: any) {
      fastify.log.error(error);
      return {
        success: false,
        error: error.message,
      };
    }
  });
}
