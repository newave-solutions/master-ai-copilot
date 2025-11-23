import { PrismaClient, WorkflowStatus, JobStatus } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

export const db = {
  async createProject(name: string) {
    return prisma.project.create({
      data: { name },
    });
  },

  async findProjectByName(name: string) {
    return prisma.project.findUnique({
      where: { name },
    });
  },

  async getOrCreateProject(name: string) {
    let project = await this.findProjectByName(name);
    if (!project) {
      project = await this.createProject(name);
    }
    return project;
  },

  async createWorkflow(projectId: string) {
    return prisma.workflow.create({
      data: {
        projectId,
        status: WorkflowStatus.PENDING,
      },
      include: {
        project: true,
      },
    });
  },

  async getAllWorkflows() {
    return prisma.workflow.findMany({
      include: {
        project: true,
        jobs: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getWorkflow(workflowId: string) {
    return prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        project: true,
        jobs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },

  async updateWorkflowStatus(workflowId: string, status: WorkflowStatus) {
    return prisma.workflow.update({
      where: { id: workflowId },
      data: { status },
    });
  },

  async createJob(workflowId: string, toolName: string, input: any) {
    return prisma.job.create({
      data: {
        workflowId,
        toolName,
        input,
        status: JobStatus.PENDING,
      },
    });
  },

  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    data?: {
      output?: any;
      error?: string;
      startedAt?: Date;
      completedAt?: Date;
    }
  ) {
    return prisma.job.update({
      where: { id: jobId },
      data: {
        status,
        ...data,
      },
    });
  },

  async startJob(jobId: string) {
    return this.updateJobStatus(jobId, JobStatus.RUNNING, {
      startedAt: new Date(),
    });
  },

  async completeJob(jobId: string, output: any) {
    return this.updateJobStatus(jobId, JobStatus.COMPLETED, {
      output,
      completedAt: new Date(),
    });
  },

  async failJob(jobId: string, error: string) {
    return this.updateJobStatus(jobId, JobStatus.FAILED, {
      error,
      completedAt: new Date(),
    });
  },

  async getJobById(jobId: string) {
    return prisma.job.findUnique({
      where: { id: jobId },
    });
  },

  async saveJobAnalysis(jobId: string, analysis: any) {
    return prisma.job.update({
      where: { id: jobId },
      data: {
        output: {
          ...(typeof analysis === 'object' ? analysis : {}),
          analysis,
        },
      },
    });
  },

  async createDeveloper(name: string, email: string, apiKey: string) {
    return prisma.developer.create({
      data: {
        name,
        email,
        apiKey,
      },
    });
  },

  async findDeveloperByEmail(email: string) {
    return prisma.developer.findUnique({
      where: { email },
    });
  },

  async getDeveloperById(id: string) {
    return prisma.developer.findUnique({
      where: { id },
      include: {
        tools: true,
      },
    });
  },

  async submitThirdPartyTool(toolDetails: {
    name: string;
    description?: string;
    mcpServerUrl: string;
    developerId: string;
  }) {
    return prisma.thirdPartyTool.create({
      data: {
        name: toolDetails.name,
        description: toolDetails.description,
        mcpServerUrl: toolDetails.mcpServerUrl,
        developerId: toolDetails.developerId,
        status: 'PENDING',
      },
    });
  },

  async getAllThirdPartyTools() {
    return prisma.thirdPartyTool.findMany({
      include: {
        developer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  async getApprovedThirdPartyTools() {
    return prisma.thirdPartyTool.findMany({
      where: {
        status: 'APPROVED',
      },
      include: {
        developer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  async reviewThirdPartyTool(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reviewNotes?: string
  ) {
    return prisma.thirdPartyTool.update({
      where: { id },
      data: {
        status,
        reviewNotes,
        reviewedAt: new Date(),
      },
    });
  },

  async disconnect() {
    await prisma.$disconnect();
  },
};

export { WorkflowStatus, JobStatus };
