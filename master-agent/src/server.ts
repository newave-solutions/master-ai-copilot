import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { workflowRoutes } from './routes/workflows';
import { marketplaceRoutes } from './routes/marketplace';
import { analyticsRoutes } from './routes/analytics';
import { delegationRoutes } from './routes/delegation';
import { db } from './services/database';
import { mcpClient } from './services/mcp-client';
import { initializeGenkit } from './services/genkit-config';

dotenv.config({ path: '../.env' });

if (process.env.GOOGLE_API_KEY) {
  initializeGenkit();
  console.log('✨ Genkit AI initialized');
} else {
  console.warn('⚠️  GOOGLE_API_KEY not set. AI features will be unavailable.');
}

const server = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

server.register(cors, {
  origin: true,
});

server.get('/health', async () => {
  const mcpHealthy = await mcpClient.healthCheck();

  return {
    status: 'healthy',
    service: 'master-agent',
    mcpServer: mcpHealthy ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  };
});

server.register(workflowRoutes);
server.register(marketplaceRoutes);
server.register(analyticsRoutes);
server.register(delegationRoutes);

const start = async () => {
  try {
    const port = parseInt(process.env.MASTER_AGENT_PORT || '3000', 10);
    const host = '0.0.0.0';

    await server.listen({ port, host });

    console.log(`🤖 Master Agent running on http://localhost:${port}`);

    const mcpHealthy = await mcpClient.healthCheck();
    if (mcpHealthy) {
      console.log(`✅ Connected to MCP Server`);
      const tools = await mcpClient.getAvailableTools();
      console.log(`📋 Available tools: ${tools.length}`);
      if (tools.length > 0) {
        console.log(`   - ${tools.join('\n   - ')}`);
      }
    } else {
      console.warn(`⚠️  MCP Server not reachable. Make sure it's running on ${process.env.MCP_SERVER_URL || 'http://localhost:3001'}`);
    }
  } catch (err) {
    server.log.error(err);
    await db.disconnect();
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing gracefully...');
  await db.disconnect();
  await server.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing gracefully...');
  await db.disconnect();
  await server.close();
  process.exit(0);
});

start();
