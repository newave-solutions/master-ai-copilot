import { generate } from '@genkit-ai/ai';
import { gemini15Flash } from '@genkit-ai/googleai';
import axios from 'axios';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3001';

interface ToolInfo {
  name: string;
  description?: string;
}

interface WorkflowGenerationOutput {
  tools: string[];
  reasoning: string;
}

async function fetchAvailableTools(): Promise<ToolInfo[]> {
  try {
    const response = await axios.get(`${MCP_SERVER_URL}/tools`);
    const tools = response.data.tools || [];
    return tools.map((name: string) => ({ name }));
  } catch (error) {
    console.error('Failed to fetch tools from MCP server:', error);
    return [
      { name: 'lovable-ai/design-ui', description: 'Design user interface' },
      { name: 'bolt-new-ai/develop-logic', description: 'Develop application logic' },
      { name: 'embrace-io/stage-and-test', description: 'Stage and test application' },
    ];
  }
}

export async function generateWorkflow(goal: string): Promise<WorkflowGenerationOutput> {
  const availableTools = await fetchAvailableTools();
  const toolsList = availableTools.map(t => `- ${t.name}${t.description ? `: ${t.description}` : ''}`).join('\n');

  const prompt = `You are an expert software development workflow architect. Your task is to analyze a user's high-level goal and construct an optimal workflow by selecting the most appropriate tools in the correct sequence.

Available Tools:
${toolsList}

User's Goal: ${goal}

Instructions:
1. Analyze the user's goal carefully
2. Determine which tools are needed to accomplish this goal
3. Order the tools in a logical sequence (e.g., design before development, development before testing)
4. Only select tools that are necessary for the goal
5. Provide clear reasoning for your tool selection and ordering

Respond in the following JSON format:
{
  "tools": ["tool-name-1", "tool-name-2", ...],
  "reasoning": "Explanation of why these tools were selected and in this order"
}

Requirements:
- Use only tools from the available tools list above
- Tools must be in a logical execution order
- Include 1-5 tools (don't over-complicate)
- Provide specific reasoning`;

  try {
    const result = await generate({
      model: gemini15Flash,
      prompt: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    const parsed = JSON.parse(result.text());

    const validTools = parsed.tools.filter((tool: string) =>
      availableTools.some(t => t.name === tool)
    );

    return {
      tools: validTools.length > 0 ? validTools : availableTools.map(t => t.name).slice(0, 3),
      reasoning: parsed.reasoning || 'AI-generated workflow based on goal analysis',
    };
  } catch (error) {
    console.error('Failed to generate workflow:', error);
    return {
      tools: availableTools.map(t => t.name).slice(0, 3),
      reasoning: 'Using default workflow due to error',
    };
  }
}
