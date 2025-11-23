import { generate } from '@genkit-ai/ai';
import { gemini15Flash } from '@genkit-ai/googleai';
import { db } from './database';

interface AnalysisInput {
  toolName: string;
  inputData: any;
  errorMessage: string;
  toolDescription?: string;
}

interface AnalysisOutput {
  rootCause: string;
  potentialSolution: string;
  recommendations: string[];
}

async function analyzeFailureFlow(input: AnalysisInput): Promise<AnalysisOutput> {
  const prompt = `You are an expert software engineer and debugging specialist. Analyze the following tool failure and provide a comprehensive root cause analysis.

Tool Information:
- Tool Name: ${input.toolName}
- Tool Purpose: ${input.toolDescription || 'Not specified'}

Input Data Provided to Tool:
${JSON.stringify(input.inputData, null, 2)}

Error Produced:
${input.errorMessage}

Instructions:
Based on the tool's purpose, the data it was given, and the error it returned, provide:
1. A probable root cause of the failure
2. A potential solution to fix the issue
3. Recommendations to prevent similar failures in the future

Respond in the following JSON format:
{
  "rootCause": "Clear explanation of what went wrong and why",
  "potentialSolution": "Specific steps to resolve the issue",
  "recommendations": ["Recommendation 1", "Recommendation 2", "..."]
}

Be specific and actionable in your analysis.`;

  try {
    const result = await generate({
      model: gemini15Flash,
      prompt: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 1500,
      },
    });

    const parsed = JSON.parse(result.text());
    return {
      rootCause: parsed.rootCause || 'Unable to determine root cause',
      potentialSolution: parsed.potentialSolution || 'No solution suggested',
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : ['Review tool configuration', 'Check input data format', 'Verify tool availability'],
    };
  } catch (error) {
    console.error('Failed to parse AI analysis response:', error);
    return {
      rootCause: 'Failed to analyze: AI response could not be parsed',
      potentialSolution: 'Manually review the error message and tool documentation',
      recommendations: ['Check tool logs', 'Verify input data format', 'Contact support if issue persists'],
    };
  }
}

export class AnalysisService {
  async analyzeJobFailure(jobId: string): Promise<AnalysisOutput | null> {
    try {
      const job = await db.getJobById(jobId);

      if (!job) {
        console.error(`Job ${jobId} not found`);
        return null;
      }

      if (job.status !== 'FAILED' || !job.error) {
        console.error(`Job ${jobId} is not in a failed state or has no error message`);
        return null;
      }

      const analysis = await analyzeFailureFlow({
        toolName: job.toolName,
        inputData: job.input,
        errorMessage: job.error,
        toolDescription: `Tool: ${job.toolName}`,
      });

      await db.saveJobAnalysis(jobId, analysis);

      return analysis;
    } catch (error) {
      console.error(`Failed to analyze job ${jobId}:`, error);
      return {
        rootCause: 'Analysis service error',
        potentialSolution: 'Check analysis service logs',
        recommendations: ['Retry analysis', 'Check AI service availability'],
      };
    }
  }

  async analyzeFailureWithDetails(
    toolName: string,
    inputData: any,
    errorMessage: string,
    toolDescription?: string
  ): Promise<AnalysisOutput> {
    return await analyzeFailureFlow({
      toolName,
      inputData,
      errorMessage,
      toolDescription,
    });
  }
}

export const analysisService = new AnalysisService();
