import { db, WorkflowStatus } from './database';
import { mcpClient } from './mcp-client';
import { WorkflowStep } from '../types';

const defineWorkflowSteps = (projectName: string): WorkflowStep[] => {
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
};

export const runFullLifecycle = async (workflowId: string): Promise<void> => {
  const workflow = await db.getWorkflow(workflowId);

  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  const projectName = workflow.project.name;

  console.log(`🚀 Starting workflow ${workflowId} for project: ${projectName}`);

  await db.updateWorkflowStatus(workflowId, WorkflowStatus.RUNNING);

  const steps = defineWorkflowSteps(projectName);
  const stepResults: any[] = [];

  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log(`📝 Step ${i + 1}/${steps.length}: ${step.toolName}`);

      let enhancedInput = { ...step.input };
      if (i > 0 && stepResults[i - 1]) {
        enhancedInput.previousStepOutput = stepResults[i - 1];
      }

      const job = await db.createJob(workflowId, step.toolName, enhancedInput);

      await db.startJob(job.id);

      const result = await mcpClient.invoke(step.toolName, enhancedInput);

      if (!result.success) {
        console.error(`❌ Step ${i + 1} failed: ${result.error}`);
        await db.failJob(job.id, result.error || 'Unknown error');
        await db.updateWorkflowStatus(workflowId, WorkflowStatus.FAILED);
        return;
      }

      console.log(`✅ Step ${i + 1} completed in ${result.executionTime}ms`);
      await db.completeJob(job.id, result.data);
      stepResults.push(result.data);
    }

    console.log(`🎉 Workflow ${workflowId} completed successfully`);
    await db.updateWorkflowStatus(workflowId, WorkflowStatus.COMPLETED);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Workflow ${workflowId} failed: ${errorMessage}`);
    await db.updateWorkflowStatus(workflowId, WorkflowStatus.FAILED);
    throw error;
  }
};

export const orchestrator = {
  async startWorkflow(workflowId: string): Promise<void> {
    runFullLifecycle(workflowId).catch((error) => {
      console.error(`Workflow ${workflowId} execution error:`, error);
    });
  },
};
