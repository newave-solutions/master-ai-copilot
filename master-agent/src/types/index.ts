export interface CreateWorkflowRequest {
  projectName: string;
}

export interface CreateWorkflowResponse {
  workflowId: string;
  projectId: string;
  projectName: string;
  status: string;
  message: string;
}

export interface WorkflowStatusResponse {
  id: string;
  projectName: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  jobs: JobInfo[];
}

export interface JobInfo {
  id: string;
  toolName: string;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  error: string | null;
  output: any;
}

export interface MCPInvokeRequest {
  toolName: string;
  input: Record<string, any>;
}

export interface MCPInvokeResponse {
  success: boolean;
  data?: any;
  error?: string;
  toolName: string;
  executionTime: number;
}

export interface WorkflowStep {
  toolName: string;
  input: Record<string, any>;
}
