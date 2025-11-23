import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AnalyticsService {
  async getMostFrequentlyUsedTools(): Promise<Array<{ toolName: string; count: number }>> {
    try {
      const result = await prisma.job.groupBy({
        by: ['toolName'],
        _count: {
          toolName: true,
        },
        orderBy: {
          _count: {
            toolName: 'desc',
          },
        },
        take: 10,
      });

      return result.map((item) => ({
        toolName: item.toolName,
        count: item._count.toolName,
      }));
    } catch (error) {
      console.error('Error fetching most used tools:', error);
      return [];
    }
  }

  async getToolFailureRate(toolName: string): Promise<{
    toolName: string;
    totalJobs: number;
    failedJobs: number;
    failureRate: number;
  }> {
    try {
      const totalJobs = await prisma.job.count({
        where: {
          toolName,
        },
      });

      const failedJobs = await prisma.job.count({
        where: {
          toolName,
          status: 'FAILED',
        },
      });

      const failureRate = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0;

      return {
        toolName,
        totalJobs,
        failedJobs,
        failureRate: parseFloat(failureRate.toFixed(2)),
      };
    } catch (error) {
      console.error(`Error calculating failure rate for ${toolName}:`, error);
      return {
        toolName,
        totalJobs: 0,
        failedJobs: 0,
        failureRate: 0,
      };
    }
  }

  async getAllToolsFailureRates(): Promise<Array<{
    toolName: string;
    totalJobs: number;
    failedJobs: number;
    successJobs: number;
    failureRate: number;
    successRate: number;
  }>> {
    try {
      const toolStats = await prisma.job.groupBy({
        by: ['toolName'],
        _count: {
          _all: true,
        },
        where: {},
      });

      const results = await Promise.all(
        toolStats.map(async (stat) => {
          const failedJobs = await prisma.job.count({
            where: {
              toolName: stat.toolName,
              status: 'FAILED',
            },
          });

          const successJobs = await prisma.job.count({
            where: {
              toolName: stat.toolName,
              status: 'COMPLETED',
            },
          });

          const totalJobs = stat._count._all;
          const failureRate = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0;
          const successRate = totalJobs > 0 ? (successJobs / totalJobs) * 100 : 0;

          return {
            toolName: stat.toolName,
            totalJobs,
            failedJobs,
            successJobs,
            failureRate: parseFloat(failureRate.toFixed(2)),
            successRate: parseFloat(successRate.toFixed(2)),
          };
        })
      );

      return results.sort((a, b) => b.totalJobs - a.totalJobs);
    } catch (error) {
      console.error('Error calculating tool failure rates:', error);
      return [];
    }
  }

  async getAverageWorkflowDuration(): Promise<{
    averageDurationSeconds: number;
    totalWorkflows: number;
    completedWorkflows: number;
  }> {
    try {
      const completedWorkflows = await prisma.workflow.findMany({
        where: {
          status: 'COMPLETED',
        },
        select: {
          createdAt: true,
          updatedAt: true,
        },
      });

      if (completedWorkflows.length === 0) {
        return {
          averageDurationSeconds: 0,
          totalWorkflows: 0,
          completedWorkflows: 0,
        };
      }

      const totalDuration = completedWorkflows.reduce((sum, workflow) => {
        const duration = workflow.updatedAt.getTime() - workflow.createdAt.getTime();
        return sum + duration;
      }, 0);

      const averageDurationMs = totalDuration / completedWorkflows.length;
      const averageDurationSeconds = parseFloat((averageDurationMs / 1000).toFixed(2));

      const totalWorkflows = await prisma.workflow.count();

      return {
        averageDurationSeconds,
        totalWorkflows,
        completedWorkflows: completedWorkflows.length,
      };
    } catch (error) {
      console.error('Error calculating average workflow duration:', error);
      return {
        averageDurationSeconds: 0,
        totalWorkflows: 0,
        completedWorkflows: 0,
      };
    }
  }

  async getWorkflowStatusDistribution(): Promise<Array<{
    status: string;
    count: number;
    percentage: number;
  }>> {
    try {
      const totalWorkflows = await prisma.workflow.count();

      if (totalWorkflows === 0) {
        return [];
      }

      const statusCounts = await prisma.workflow.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      });

      return statusCounts.map((item) => ({
        status: item.status,
        count: item._count.status,
        percentage: parseFloat(((item._count.status / totalWorkflows) * 100).toFixed(2)),
      }));
    } catch (error) {
      console.error('Error calculating workflow status distribution:', error);
      return [];
    }
  }

  async getJobStatusDistribution(): Promise<Array<{
    status: string;
    count: number;
    percentage: number;
  }>> {
    try {
      const totalJobs = await prisma.job.count();

      if (totalJobs === 0) {
        return [];
      }

      const statusCounts = await prisma.job.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      });

      return statusCounts.map((item) => ({
        status: item.status,
        count: item._count.status,
        percentage: parseFloat(((item._count.status / totalJobs) * 100).toFixed(2)),
      }));
    } catch (error) {
      console.error('Error calculating job status distribution:', error);
      return [];
    }
  }

  async getPlatformOverview(): Promise<{
    totalWorkflows: number;
    totalJobs: number;
    totalDevelopers: number;
    totalThirdPartyTools: number;
    approvedTools: number;
    pendingTools: number;
  }> {
    try {
      const [
        totalWorkflows,
        totalJobs,
        totalDevelopers,
        totalThirdPartyTools,
        approvedTools,
        pendingTools,
      ] = await Promise.all([
        prisma.workflow.count(),
        prisma.job.count(),
        prisma.developer.count(),
        prisma.thirdPartyTool.count(),
        prisma.thirdPartyTool.count({ where: { status: 'APPROVED' } }),
        prisma.thirdPartyTool.count({ where: { status: 'PENDING' } }),
      ]);

      return {
        totalWorkflows,
        totalJobs,
        totalDevelopers,
        totalThirdPartyTools,
        approvedTools,
        pendingTools,
      };
    } catch (error) {
      console.error('Error fetching platform overview:', error);
      return {
        totalWorkflows: 0,
        totalJobs: 0,
        totalDevelopers: 0,
        totalThirdPartyTools: 0,
        approvedTools: 0,
        pendingTools: 0,
      };
    }
  }

  async getRecentActivity(limit: number = 10): Promise<Array<{
    type: string;
    timestamp: Date;
    details: any;
  }>> {
    try {
      const recentWorkflows = await prisma.workflow.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: true,
        },
      });

      const recentJobs = await prisma.job.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      const activity = [
        ...recentWorkflows.map((w) => ({
          type: 'workflow',
          timestamp: w.createdAt,
          details: {
            id: w.id,
            projectName: w.project.name,
            status: w.status,
          },
        })),
        ...recentJobs.map((j) => ({
          type: 'job',
          timestamp: j.createdAt,
          details: {
            id: j.id,
            toolName: j.toolName,
            status: j.status,
          },
        })),
      ];

      return activity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  async getToolPerformanceMetrics(toolName: string): Promise<{
    toolName: string;
    totalExecutions: number;
    averageDurationSeconds: number;
    successRate: number;
    failureRate: number;
    lastUsed: Date | null;
  }> {
    try {
      const jobs = await prisma.job.findMany({
        where: {
          toolName,
          status: { in: ['COMPLETED', 'FAILED'] },
        },
        select: {
          status: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
        },
      });

      if (jobs.length === 0) {
        return {
          toolName,
          totalExecutions: 0,
          averageDurationSeconds: 0,
          successRate: 0,
          failureRate: 0,
          lastUsed: null,
        };
      }

      const completedJobs = jobs.filter((j) => j.status === 'COMPLETED');
      const failedJobs = jobs.filter((j) => j.status === 'FAILED');

      const durationsMs = jobs
        .filter((j) => j.startedAt && j.completedAt)
        .map((j) => j.completedAt!.getTime() - j.startedAt!.getTime());

      const averageDurationMs =
        durationsMs.length > 0 ? durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length : 0;

      const lastUsed = jobs.reduce((latest, job) => {
        return !latest || job.createdAt > latest ? job.createdAt : latest;
      }, null as Date | null);

      return {
        toolName,
        totalExecutions: jobs.length,
        averageDurationSeconds: parseFloat((averageDurationMs / 1000).toFixed(2)),
        successRate: parseFloat(((completedJobs.length / jobs.length) * 100).toFixed(2)),
        failureRate: parseFloat(((failedJobs.length / jobs.length) * 100).toFixed(2)),
        lastUsed,
      };
    } catch (error) {
      console.error(`Error fetching performance metrics for ${toolName}:`, error);
      return {
        toolName,
        totalExecutions: 0,
        averageDurationSeconds: 0,
        successRate: 0,
        failureRate: 0,
        lastUsed: null,
      };
    }
  }
}

export const analyticsService = new AnalyticsService();
