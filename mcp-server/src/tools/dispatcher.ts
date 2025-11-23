import { toolRegistry } from './registry';
import { lovableDesignUI, boltDevelopLogic } from './internal';
import { embraceStageAndTest } from './external';

// Register default tools
toolRegistry.register('lovable-ai/design-ui', lovableDesignUI);
toolRegistry.register('bolt-new-ai/develop-logic', boltDevelopLogic);
toolRegistry.register('embrace-io/stage-and-test', embraceStageAndTest);

export const dispatchTool = async (
  toolName: string,
  input: Record<string, any>
): Promise<any> => {
  const handler = toolRegistry.get(toolName);

  if (!handler) {
    throw new Error(
      `Tool '${toolName}' not found. Available tools: ${toolRegistry.getAll().join(', ')}`
    );
  }

  return handler(input);
};

export const getAvailableTools = (): string[] => {
  return toolRegistry.getAll();
};
