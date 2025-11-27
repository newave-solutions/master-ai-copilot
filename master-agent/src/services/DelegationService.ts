import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface DelegationService {
  id: string;
  name: string;
  specialties: string[];
  url: string;
  apiEndpoint?: string;
}

interface Task {
  title?: string;
  description: string;
  type: string;
  requirements?: string[];
  context?: any;
}

interface Delegation {
  id: string;
  taskId: string;
  service: DelegationService;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  task: Task;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  metadata?: any;
}

export class DelegationService {
  private services: DelegationService[] = [
    {
      id: 'bolt',
      name: 'bolt.new',
      specialties: ['full-stack', 'rapid-prototyping', 'web-apps', 'react', 'vue', 'nodejs'],
      url: 'https://bolt.new',
    },
    {
      id: 'lovable',
      name: 'lovable.dev',
      specialties: ['ui-design', 'frontend', 'react', 'tailwind', 'responsive-design'],
      url: 'https://lovable.dev',
    },
    {
      id: 'v0',
      name: 'v0.dev',
      specialties: ['ui-components', 'nextjs', 'shadcn', 'component-library'],
      url: 'https://v0.dev',
    },
    {
      id: 'cursor',
      name: 'cursor.sh',
      specialties: ['code-editing', 'refactoring', 'bug-fixing', 'code-review'],
      url: 'https://cursor.sh',
    },
  ];

  private delegations: Map<string, Delegation> = new Map();

  async delegateTask(
    task: Task,
    preferences?: {
      preferredService?: string;
      priority?: string;
      deadline?: string;
    }
  ): Promise<Delegation> {
    // Select the best service for the task
    const service = preferences?.preferredService
      ? this.services.find((s) => s.id === preferences.preferredService)
      : this.selectBestService(task);

    if (!service) {
      throw new Error('No suitable service found for this task');
    }

    const delegationId = uuidv4();
    const taskId = uuidv4();

    const delegation: Delegation = {
      id: delegationId,
      taskId,
      service,
      status: 'pending',
      task,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        preferences,
      },
    };

    this.delegations.set(delegationId, delegation);

    // Simulate delegation (in production, this would make actual API calls)
    this.processDelegation(delegationId);

    return delegation;
  }

  private selectBestService(task: Task): DelegationService | undefined {
    const taskKeywords = [
      task.type.toLowerCase(),
      task.description.toLowerCase(),
      ...(task.requirements?.map((r) => r.toLowerCase()) || []),
    ].join(' ');

    let bestMatch: { service: DelegationService; score: number } | null = null;

    for (const service of this.services) {
      let score = 0;
      for (const specialty of service.specialties) {
        if (taskKeywords.includes(specialty)) {
          score++;
        }
      }

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { service, score };
      }
    }

    return bestMatch?.service;
  }

  private async processDelegation(delegationId: string): Promise<void> {
    const delegation = this.delegations.get(delegationId);
    if (!delegation) return;

    try {
      // Update status to in_progress
      delegation.status = 'in_progress';
      delegation.updatedAt = new Date();

      // Generate instructions for the external service
      const instructions = this.generateInstructions(delegation);

      // In a real implementation, this would:
      // 1. Open the service URL with the task details
      // 2. Use their API if available
      // 3. Monitor progress through webhooks or polling
      // 4. Retrieve the results when complete

      console.log(`\n🚀 Delegating to ${delegation.service.name}:`);
      console.log(`📋 Task: ${delegation.task.description}`);
      console.log(`🔗 Service URL: ${delegation.service.url}`);
      console.log(`\n📝 Instructions:\n${instructions}\n`);

      // Simulate async processing
      setTimeout(() => {
        delegation.status = 'completed';
        delegation.completedAt = new Date();
        delegation.updatedAt = new Date();
        delegation.result = {
          instructions,
          serviceUrl: delegation.service.url,
          message: `Task ready for implementation in ${delegation.service.name}`,
        };
      }, 2000);
    } catch (error: any) {
      delegation.status = 'failed';
      delegation.error = error.message;
      delegation.updatedAt = new Date();
    }
  }

  private generateInstructions(delegation: Delegation): string {
    const { task, service } = delegation;

    let instructions = `# Task Delegation to ${service.name}\n\n`;
    instructions += `## Task Description\n${task.description}\n\n`;

    if (task.title) {
      instructions += `## Title\n${task.title}\n\n`;
    }

    instructions += `## Type\n${task.type}\n\n`;

    if (task.requirements && task.requirements.length > 0) {
      instructions += `## Requirements\n`;
      task.requirements.forEach((req) => {
        instructions += `- ${req}\n`;
      });
      instructions += `\n`;
    }

    instructions += `## Service Specialties\n`;
    service.specialties.forEach((spec) => {
      instructions += `- ${spec}\n`;
    });
    instructions += `\n`;

    instructions += `## Next Steps\n`;
    instructions += `1. Open ${service.url}\n`;
    instructions += `2. Create a new project with the above specifications\n`;
    instructions += `3. Implement the requirements\n`;
    instructions += `4. Test the implementation\n`;
    instructions += `5. Return the results or share the project link\n`;

    return instructions;
  }

  async getTaskStatus(delegationId: string): Promise<Delegation> {
    const delegation = this.delegations.get(delegationId);
    if (!delegation) {
      throw new Error(`Delegation ${delegationId} not found`);
    }
    return delegation;
  }

  async getAvailableServices(): Promise<DelegationService[]> {
    return this.services;
  }

  async recommendService(task: Task): Promise<{
    recommended: DelegationService;
    alternatives: DelegationService[];
    reasoning: string;
  }> {
    const recommended = this.selectBestService(task);
    if (!recommended) {
      throw new Error('No suitable service found');
    }

    const alternatives = this.services
      .filter((s) => s.id !== recommended.id)
      .slice(0, 2);

    const reasoning = this.generateRecommendationReasoning(task, recommended);

    return {
      recommended,
      alternatives,
      reasoning,
    };
  }

  private generateRecommendationReasoning(task: Task, service: DelegationService): string {
    const matchingSpecialties = service.specialties.filter((spec) =>
      task.description.toLowerCase().includes(spec) ||
      task.type.toLowerCase().includes(spec)
    );

    return `${service.name} is recommended because it specializes in ${matchingSpecialties.join(', ') || 'the required areas'}. This service is ideal for ${task.type} tasks.`;
  }

  async cancelDelegation(delegationId: string): Promise<void> {
    const delegation = this.delegations.get(delegationId);
    if (!delegation) {
      throw new Error(`Delegation ${delegationId} not found`);
    }

    if (delegation.status === 'completed') {
      throw new Error('Cannot cancel a completed delegation');
    }

    delegation.status = 'cancelled';
    delegation.updatedAt = new Date();
  }

  async listDelegations(filters?: {
    status?: string;
    service?: string;
  }): Promise<Delegation[]> {
    let delegations = Array.from(this.delegations.values());

    if (filters?.status) {
      delegations = delegations.filter((d) => d.status === filters.status);
    }

    if (filters?.service) {
      delegations = delegations.filter((d) => d.service.id === filters.service);
    }

    return delegations.sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
}
