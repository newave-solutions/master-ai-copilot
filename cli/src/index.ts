#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import axios from 'axios';
import chalk from 'chalk';
import ora from 'ora';

const MASTER_AGENT_URL = process.env.MASTER_AGENT_URL || 'http://localhost:3000';
const POLL_INTERVAL = 2000;

interface WorkflowResponse {
  workflowId: string;
  projectId: string;
  projectName: string;
  status: string;
  message: string;
}

interface JobInfo {
  id: string;
  toolName: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  output: any;
}

interface WorkflowStatus {
  id: string;
  projectName: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  jobs: JobInfo[];
}

function getStatusBadge(status: string): string {
  switch (status) {
    case 'PENDING':
      return chalk.yellow('⏳ PENDING');
    case 'RUNNING':
      return chalk.blue('🔄 RUNNING');
    case 'COMPLETED':
      return chalk.green('✅ COMPLETED');
    case 'FAILED':
      return chalk.red('❌ FAILED');
    default:
      return chalk.gray(`${status}`);
  }
}

function calculateDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return 'N/A';
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const duration = (end - start) / 1000;
  return `${duration.toFixed(2)}s`;
}

async function createWorkflow(projectName: string): Promise<WorkflowResponse> {
  const spinner = ora('Creating workflow...').start();

  try {
    const response = await axios.post<WorkflowResponse>(
      `${MASTER_AGENT_URL}/workflows`,
      { projectName },
      { timeout: 10000 }
    );

    spinner.succeed(chalk.green('Workflow created successfully!'));
    console.log(chalk.cyan('  Workflow ID:'), response.data.workflowId);
    console.log(chalk.cyan('  Project:'), response.data.projectName);
    console.log(chalk.cyan('  Status:'), getStatusBadge(response.data.status));
    console.log('');

    return response.data;
  } catch (error) {
    spinner.fail(chalk.red('Failed to create workflow'));

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        console.error(chalk.red('Error: Cannot connect to master-agent'));
        console.error(chalk.yellow(`Make sure the master-agent is running on ${MASTER_AGENT_URL}`));
      } else if (error.response) {
        console.error(chalk.red(`Error ${error.response.status}:`), error.response.data);
      } else {
        console.error(chalk.red('Error:'), error.message);
      }
    } else {
      console.error(chalk.red('Error:'), error);
    }

    process.exit(1);
  }
}

async function pollWorkflowStatus(workflowId: string): Promise<void> {
  console.log(chalk.gray('Monitoring workflow status...'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log('');

  const seenJobs = new Set<string>();
  let previousStatus = '';

  const poll = async (): Promise<boolean> => {
    try {
      const response = await axios.get<WorkflowStatus>(
        `${MASTER_AGENT_URL}/workflows/${workflowId}`,
        { timeout: 5000 }
      );

      const workflow = response.data;

      for (const job of workflow.jobs) {
        const jobKey = `${job.id}-${job.status}`;

        if (!seenJobs.has(jobKey)) {
          seenJobs.add(jobKey);

          if (job.status === 'COMPLETED') {
            const duration = calculateDuration(job.startedAt, job.completedAt);
            console.log(
              chalk.green('✓'),
              chalk.bold(job.toolName),
              chalk.green('completed'),
              chalk.gray(`in ${duration}`)
            );
          } else if (job.status === 'FAILED') {
            console.log(
              chalk.red('✗'),
              chalk.bold(job.toolName),
              chalk.red('failed')
            );
            if (job.error) {
              console.log(chalk.red('  Error:'), job.error);
            }
          } else if (job.status === 'RUNNING') {
            console.log(
              chalk.blue('▶'),
              chalk.bold(job.toolName),
              chalk.blue('running...')
            );
          }
        }
      }

      if (workflow.status !== previousStatus) {
        previousStatus = workflow.status;
      }

      if (workflow.status === 'COMPLETED') {
        console.log('');
        console.log(chalk.gray('─'.repeat(60)));
        console.log(chalk.green.bold('🎉 Workflow completed successfully!'));

        const totalJobs = workflow.jobs.length;
        const completedJobs = workflow.jobs.filter(j => j.status === 'COMPLETED').length;
        const failedJobs = workflow.jobs.filter(j => j.status === 'FAILED').length;

        console.log(chalk.cyan('  Total jobs:'), totalJobs);
        console.log(chalk.green('  Completed:'), completedJobs);
        if (failedJobs > 0) {
          console.log(chalk.red('  Failed:'), failedJobs);
        }

        return true;
      } else if (workflow.status === 'FAILED') {
        console.log('');
        console.log(chalk.gray('─'.repeat(60)));
        console.log(chalk.red.bold('❌ Workflow failed'));

        const failedJobs = workflow.jobs.filter(j => j.status === 'FAILED');
        if (failedJobs.length > 0) {
          console.log(chalk.red('\nFailed jobs:'));
          failedJobs.forEach(job => {
            console.log(chalk.red('  -'), job.toolName);
            if (job.error) {
              console.log(chalk.gray('    Error:'), job.error);
            }
          });
        }

        return true;
      }

      return false;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(chalk.red('\nError polling workflow status:'), error.message);
      }
      return false;
    }
  };

  return new Promise((resolve) => {
    const intervalId = setInterval(async () => {
      const done = await poll();
      if (done) {
        clearInterval(intervalId);
        resolve();
      }
    }, POLL_INTERVAL);

    poll();
  });
}

yargs(hideBin(process.argv))
  .command(
    'create-workflow',
    'Create and monitor a new workflow',
    (yargs) => {
      return yargs.option('projectName', {
        alias: 'p',
        type: 'string',
        description: 'Name of the project',
        demandOption: true,
      });
    },
    async (argv) => {
      try {
        const workflow = await createWorkflow(argv.projectName);
        await pollWorkflowStatus(workflow.workflowId);
      } catch (error) {
        console.error(chalk.red('Unexpected error:'), error);
        process.exit(1);
      }
    }
  )
  .demandCommand(1, 'You need to specify a command')
  .help()
  .alias('help', 'h')
  .version('1.0.0')
  .alias('version', 'v')
  .parse();
