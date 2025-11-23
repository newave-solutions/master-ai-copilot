import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { analyticsService } from '../services/AnalyticsService';

async function verifyAdminKey(request: FastifyRequest, reply: FastifyReply) {
  const adminKey = request.headers['x-admin-api-key'] as string;

  if (!adminKey) {
    reply.code(401);
    return reply.send({
      error: 'Unauthorized. Admin API key required in X-Admin-API-Key header.',
    });
  }

  if (adminKey !== process.env.ADMIN_API_KEY) {
    reply.code(403);
    return reply.send({
      error: 'Forbidden. Invalid admin API key.',
    });
  }
}

export async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', verifyAdminKey);

  fastify.get('/analytics/overview', async (_request, reply) => {
    try {
      const overview = await analyticsService.getPlatformOverview();

      return {
        platform: 'AI Co-Pilot',
        timestamp: new Date().toISOString(),
        data: overview,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch platform overview',
      };
    }
  });

  fastify.get('/analytics/most-used-tools', async (_request, reply) => {
    try {
      const tools = await analyticsService.getMostFrequentlyUsedTools();

      return {
        timestamp: new Date().toISOString(),
        data: tools,
        count: tools.length,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch most used tools',
      };
    }
  });

  fastify.get('/analytics/failure-rates', async (_request, reply) => {
    try {
      const rates = await analyticsService.getAllToolsFailureRates();

      return {
        timestamp: new Date().toISOString(),
        data: rates,
        count: rates.length,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch failure rates',
      };
    }
  });

  fastify.get<{ Params: { toolName: string } }>(
    '/analytics/tool/:toolName/failure-rate',
    async (request, reply) => {
      const { toolName } = request.params;

      try {
        const rate = await analyticsService.getToolFailureRate(toolName);

        return {
          timestamp: new Date().toISOString(),
          data: rate,
        };
      } catch (error) {
        fastify.log.error(error);
        reply.code(500);
        return {
          error: error instanceof Error ? error.message : `Failed to fetch failure rate for ${toolName}`,
        };
      }
    }
  );

  fastify.get<{ Params: { toolName: string } }>(
    '/analytics/tool/:toolName/performance',
    async (request, reply) => {
      const { toolName } = request.params;

      try {
        const metrics = await analyticsService.getToolPerformanceMetrics(toolName);

        return {
          timestamp: new Date().toISOString(),
          data: metrics,
        };
      } catch (error) {
        fastify.log.error(error);
        reply.code(500);
        return {
          error: error instanceof Error ? error.message : `Failed to fetch performance metrics for ${toolName}`,
        };
      }
    }
  );

  fastify.get('/analytics/workflow-duration', async (_request, reply) => {
    try {
      const duration = await analyticsService.getAverageWorkflowDuration();

      return {
        timestamp: new Date().toISOString(),
        data: duration,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch workflow duration',
      };
    }
  });

  fastify.get('/analytics/workflow-status-distribution', async (_request, reply) => {
    try {
      const distribution = await analyticsService.getWorkflowStatusDistribution();

      return {
        timestamp: new Date().toISOString(),
        data: distribution,
        count: distribution.length,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch workflow status distribution',
      };
    }
  });

  fastify.get('/analytics/job-status-distribution', async (_request, reply) => {
    try {
      const distribution = await analyticsService.getJobStatusDistribution();

      return {
        timestamp: new Date().toISOString(),
        data: distribution,
        count: distribution.length,
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch job status distribution',
      };
    }
  });

  fastify.get<{ Querystring: { limit?: string } }>(
    '/analytics/recent-activity',
    async (request, reply) => {
      const limit = request.query.limit ? parseInt(request.query.limit, 10) : 10;

      try {
        const activity = await analyticsService.getRecentActivity(limit);

        return {
          timestamp: new Date().toISOString(),
          data: activity,
          count: activity.length,
        };
      } catch (error) {
        fastify.log.error(error);
        reply.code(500);
        return {
          error: error instanceof Error ? error.message : 'Failed to fetch recent activity',
        };
      }
    }
  );
}
