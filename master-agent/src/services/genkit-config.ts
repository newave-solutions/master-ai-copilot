import { configureGenkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';

export function initializeGenkit() {
  configureGenkit({
    plugins: [
      googleAI({
        apiKey: process.env.GOOGLE_API_KEY,
      }),
    ],
    logLevel: 'info',
    enableTracingAndMetrics: false,
  });
}
