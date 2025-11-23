# Quick Start Guide

Get the AI Co-Pilot backend up and running in minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Supabase already configured)

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

This installs all dependencies for both services.

### 2. Verify Environment Configuration

The `.env` file is already configured with:
- Supabase database connection
- Service ports (3000 for master-agent, 3001 for mcp-server)
- Default configuration values

No changes needed unless you want to customize ports or add external API keys.

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

This generates the Prisma client based on the database schema.

### 4. Build Both Services

```bash
npm run build
```

Compiles TypeScript to JavaScript for both services.

### 5. Start the Platform

```bash
npm run dev
```

This starts both services in development mode with hot-reload:
- Master Agent: http://localhost:3000
- MCP Server: http://localhost:3001

## Test the Platform

### 1. Check Health

```bash
# Master Agent
curl http://localhost:3000/health

# MCP Server
curl http://localhost:3001/health
```

### 2. List Available Tools

```bash
curl http://localhost:3001/tools
```

### 3. Create a Workflow

```bash
curl -X POST http://localhost:3000/workflows \
  -H "Content-Type: application/json" \
  -d '{"projectName": "my-test-app"}'
```

Response will include a `workflowId` like:
```json
{
  "workflowId": "550e8400-e29b-41d4-a716-446655440000",
  "projectId": "...",
  "projectName": "my-test-app",
  "status": "PENDING",
  "message": "Workflow created and started successfully"
}
```

### 4. Check Workflow Status

Use the `workflowId` from step 3:

```bash
curl http://localhost:3000/workflows/550e8400-e29b-41d4-a716-446655440000
```

You'll see:
- Workflow status (PENDING → RUNNING → COMPLETED or FAILED)
- All jobs with their status, input, output, and timing
- Any errors that occurred

### 5. Monitor Progress

Poll the workflow status endpoint every few seconds to see progress:

```bash
watch -n 2 'curl -s http://localhost:3000/workflows/YOUR_WORKFLOW_ID | jq'
```

## Expected Workflow Flow

1. **Design UI** (lovable-ai/design-ui)
   - Generates UI components and design system
   - Takes ~150-200ms

2. **Develop Logic** (bolt-new-ai/develop-logic)
   - Generates application code based on design
   - Takes ~150-200ms

3. **Stage & Test** (embrace-io/stage-and-test)
   - Deploys to staging and runs tests
   - Takes ~150-200ms (mock) or longer (real API)

Total workflow time: ~500ms for all mock tools

## Production Deployment

### 1. Set Environment to Production

```bash
NODE_ENV=production
```

### 2. Build for Production

```bash
npm run build
```

### 3. Start Services

```bash
npm start
```

Both services will start in production mode.

## Troubleshooting

### Port Already in Use

If ports 3000 or 3001 are in use, update `.env`:

```
MASTER_AGENT_PORT=3002
MCP_SERVER_PORT=3003
MCP_SERVER_URL=http://localhost:3003
```

### Database Connection Issues

Verify the `DATABASE_URL` in `.env` is correct and the database is accessible.

### MCP Server Not Reachable

1. Ensure MCP server is running on the correct port
2. Check `MCP_SERVER_URL` in `.env` matches where MCP server is running
3. Look for errors in the MCP server logs

### Workflow Stuck

Check the master-agent logs for errors. You can also query the workflow status to see which job failed and why.

## Next Steps

- Read the full [README.md](./README.md) for architecture details
- Learn how to add new tools in [mcp-server/README.md](./mcp-server/README.md)
- Explore database operations in [master-agent/README.md](./master-agent/README.md)
- Configure external API keys for real tool integrations
- Set up monitoring and logging for production

## Support

For issues or questions:
1. Check the service logs for errors
2. Verify all dependencies are installed
3. Ensure database migrations are applied
4. Review the comprehensive documentation in README.md

Happy orchestrating! 🚀
