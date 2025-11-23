import { ToolHandler } from '../types';
import { lovableDesignUI, boltDevelopLogic } from './internal';
import { embraceStageAndTest } from './external';

export const toolRegistry: Record<string, ToolHandler> = {
  'lovable-ai/design-ui': lovableDesignUI,
  'bolt-new-ai/develop-logic': boltDevelopLogic,
  'embrace-io/stage-and-test': embraceStageAndTest,
};

export const dispatchTool = async (
  toolName: string,
  input: Record<string, any>
): Promise<any> => {
  const handler = toolRegistry[toolName];

  if (!handler) {
    throw new Error(
      `Tool '${toolName}' not found. Available tools: ${Object.keys(toolRegistry).join(', ')}`
    );
  }

  return handler(input);
};

export const getAvailableTools = (): string[] => {
  return Object.keys(toolRegistry);
};
