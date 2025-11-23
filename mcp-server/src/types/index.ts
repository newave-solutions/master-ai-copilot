export interface InvokeRequest {
  toolName: string;
  input: Record<string, any>;
}

export interface InvokeResponse {
  success: boolean;
  data?: any;
  error?: string;
  toolName: string;
  executionTime: number;
}

export interface ToolHandler {
  (input: Record<string, any>): Promise<any>;
}

export interface ExternalAPIConfig {
  url: string;
  apiKey?: string;
  timeout?: number;
}
