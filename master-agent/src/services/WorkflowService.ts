import { db, WorkflowStatus } from './database';
import { WorkflowStep, CreateWorkflowResponse, WorkflowStatusResponse } from '../types';

export class WorkflowService {
  async createWorkflow(projectName: string): Promise<CreateWorkflowResponse> {
    const project = await db.getOrCreateProject(projectName);
    const workflow = await db.createWorkflow(project.id);

    return {
      workflowId: workflow.id,
      projectId: project.id,
      projectName: project.name,
      status: workflow.status,
      message: 'Workflow created and started successfully',
    };
  }

  async getWorkflow(workflowId: string): Promise<WorkflowStatusResponse | null> {
    const workflow = await db.getWorkflow(workflowId);

    if (!workflow) {
      return null;
    }

    return {
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
  }

  async getAllWorkflows(): Promise<WorkflowStatusResponse[]> {
    const workflows = await db.getAllWorkflows();

    return workflows.map((workflow) => ({
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
    }));
  }

  defineWorkflowSteps(projectName: string): WorkflowStep[] {
    return [
      {
        toolName: 'lovable-ai/design-ui',
        input: {
          projectName,
          requirements: 'Modern, responsive UI with dashboard',
        },
      },
      {
        toolName: 'bolt-new-ai/develop-logic',
        input: {
          projectName,
          designSpec: 'Design from previous step',
        },
      },
      {
        toolName: 'embrace-io/stage-and-test',
        input: {
          projectName,
          codebase: 'Code from previous step',
        },
      },
    ];
  }

  async updateWorkflowStatus(workflowId: string, status: WorkflowStatus): Promise<void> {
      await db.updateWorkflowStatus(workflowId, status);
  }

  async createJob(workflowId: string, toolName: string, input: any) {
      return await db.createJob(workflowId, toolName, input);
  }

  async startJob(jobId: string) {
      return await db.startJob(jobId);
  }

  async completeJob(jobId: string, output: any) {
      return await db.completeJob(jobId, output);
  }

  async failJob(jobId: string, error: string) {
      return await db.failJob(jobId, error);
  }
}

export const workflowService = new WorkflowService();
