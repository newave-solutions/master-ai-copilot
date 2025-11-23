import axios, { AxiosError } from 'axios';
import { MCPInvokeRequest, MCPInvokeResponse } from '../types';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3001';

export const mcpClient = {
  async invoke(toolName: string, input: Record<string, any>): Promise<MCPInvokeResponse> {
    try {
      const request: MCPInvokeRequest = {
        toolName,
        input,
      };

      const response = await axios.post<MCPInvokeResponse>(
        `${MCP_SERVER_URL}/invoke`,
        request,
        {
          timeout: 60000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<MCPInvokeResponse>;

        if (axiosError.response?.data) {
          return axiosError.response.data;
        }

        throw new Error(
          `MCP Server request failed: ${axiosError.message} - ${
            axiosError.response?.status || 'No status'
          }`
        );
      }
      throw error;
    }
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${MCP_SERVER_URL}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  },

  async getAvailableTools(): Promise<string[]> {
    try {
      const response = await axios.get<{ tools: string[] }>(`${MCP_SERVER_URL}/tools`, {
        timeout: 5000,
      });
      return response.data.tools;
    } catch (error) {
      console.error('Failed to fetch available tools:', error);
      return [];
    }
  },
};
