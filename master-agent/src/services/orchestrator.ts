import { WorkflowStatus } from './database';
import { mcpClient } from './mcp-client';
import { workflowService } from './WorkflowService';

export class Orchestrator {
  async runFullLifecycle(workflowId: string): Promise<void> {
    const workflow = await workflowService.getWorkflow(workflowId);

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const projectName = workflow.projectName;

    console.log(`🚀 Starting workflow ${workflowId} for project: ${projectName}`);

    await workflowService.updateWorkflowStatus(workflowId, WorkflowStatus.RUNNING);

    const steps = workflowService.defineWorkflowSteps(projectName);
    const stepResults: any[] = [];

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        console.log(`📝 Step ${i + 1}/${steps.length}: ${step.toolName}`);

        let enhancedInput = { ...step.input };
        if (i > 0 && stepResults[i - 1]) {
          enhancedInput.previousStepOutput = stepResults[i - 1];
        }

        const job = await workflowService.createJob(workflowId, step.toolName, enhancedInput);

        await workflowService.startJob(job.id);

        const result = await mcpClient.invoke(step.toolName, enhancedInput);

        if (!result.success) {
          console.error(`❌ Step ${i + 1} failed: ${result.error}`);
          await workflowService.failJob(job.id, result.error || 'Unknown error');
          await workflowService.updateWorkflowStatus(workflowId, WorkflowStatus.FAILED);
          return;
        }

        console.log(`✅ Step ${i + 1} completed in ${result.executionTime}ms`);
        await workflowService.completeJob(job.id, result.data);
        stepResults.push(result.data);
      }

      console.log(`🎉 Workflow ${workflowId} completed successfully`);
      await workflowService.updateWorkflowStatus(workflowId, WorkflowStatus.COMPLETED);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Workflow ${workflowId} failed: ${errorMessage}`);
      await workflowService.updateWorkflowStatus(workflowId, WorkflowStatus.FAILED);
      throw error;
    }
  }

  async startWorkflow(workflowId: string): Promise<void> {
    this.runFullLifecycle(workflowId).catch((error) => {
      console.error(`Workflow ${workflowId} execution error:`, error);
    });
  }
}

export const orchestrator = new Orchestrator();
