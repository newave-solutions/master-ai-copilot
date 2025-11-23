import axios, { AxiosError } from 'axios';
import { ToolHandler, ExternalAPIConfig } from '../types';

export const createExternalToolHandler = (config: ExternalAPIConfig): ToolHandler => {
  return async (input: Record<string, any>) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const response = await axios.post(
        config.url,
        { input },
        {
          headers,
          timeout: config.timeout || 30000,
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        throw new Error(
          `External API call failed: ${axiosError.message} - ${
            axiosError.response?.status || 'No status'
          }`
        );
      }
      throw error;
    }
  };
};

export const embraceStageAndTest: ToolHandler = async (input) => {
  const apiUrl = process.env.EMBRACE_API_URL || 'https://api.embrace.io/mcp/invoke';
  const apiKey = process.env.EMBRACE_API_KEY;

  if (!apiKey) {
    console.warn('EMBRACE_API_KEY not set, returning mock response');
    return {
      toolName: 'embrace-io/stage-and-test',
      status: 'completed',
      result: {
        environment: 'staging',
        deploymentUrl: 'https://staging-example.com',
        testResults: {
          total: 15,
          passed: 14,
          failed: 1,
          skipped: 0,
          duration: 45000,
        },
        tests: [
          {
            name: 'Homepage loads correctly',
            status: 'passed',
            duration: 1200,
          },
          {
            name: 'User authentication works',
            status: 'passed',
            duration: 2500,
          },
          {
            name: 'Dashboard renders data',
            status: 'failed',
            duration: 3000,
            error: 'Expected 10 items, got 9',
          },
        ],
        coverage: {
          lines: 85.5,
          branches: 78.2,
          functions: 90.1,
          statements: 84.8,
        },
        timestamp: new Date().toISOString(),
      },
    };
  }

  const externalHandler = createExternalToolHandler({
    url: apiUrl,
    apiKey,
    timeout: 60000,
  });

  return externalHandler(input);
};
