# Master Agent Service

The Master Agent is the primary orchestration service in the AI Co-Pilot platform. It provides a REST API for creating and managing workflows, and coordinates the execution of multi-step AI tasks through the MCP Server.

## Responsibilities

- **Workflow Management:** Create, track, and manage AI workflow lifecycles
- **Project Organization:** Group workflows by project for better organization
- **Job Tracking:** Monitor individual tool invocations within workflows
- **Data Persistence:** Store all workflow state and results in PostgreSQL
- **Orchestration:** Coordinate sequential execution of AI tools via MCP Server
- **API Gateway:** Provide public-facing REST API for clients

## Architecture

### Database Layer (Prisma + PostgreSQL)

The service uses Prisma ORM to interact with a PostgreSQL database with the following schema:

- **Projects:** Top-level containers for workflows
- **Workflows:** Orchestration instances with status tracking
- **Jobs:** Individual tool invocations with input/output/error storage

### Service Layer

- **database.ts:** Abstraction over Prisma for CRUD operations
- **mcp-client.ts:** HTTP client for invoking MCP Server tools
- **orchestrator.ts:** Core workflow execution logic

### API Layer

- **routes/workflows.ts:** HTTP endpoints for workflow management
- **server.ts:** Fastify application setup and startup

## API Endpoints

### POST /workflows

Create and start a new workflow for a project.

**Request:**
```json
{
  "projectName": "my-app"
}
```

**Response (201):**
```json
{
  "workflowId": "uuid",
  "projectId": "uuid",
  "projectName": "my-app",
  "status": "PENDING",
  "message": "Workflow created and started successfully"
}
```

### GET /workflows/:id

Retrieve current status of a workflow and all its jobs.

**Response (200):**
```json
{
  "id": "uuid",
  "projectName": "my-app",
  "status": "RUNNING",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:05:00Z",
  "jobs": [
    {
      "id": "uuid",
      "toolName": "lovable-ai/design-ui",
      "status": "COMPLETED",
      "startedAt": "2024-01-15T10:00:05Z",
      "completedAt": "2024-01-15T10:00:15Z",
      "error": null,
      "output": { /* tool output */ }
    }
  ]
}
```

### GET /health

Health check endpoint that also verifies MCP Server connectivity.

**Response (200):**
```json
{
  "status": "healthy",
  "service": "master-agent",
  "mcpServer": "connected",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

## Workflow Orchestration

The orchestrator follows this pattern:

1. Retrieve workflow and project details
2. Update workflow status to RUNNING
3. For each workflow step:
   - Create a Job record
   - Mark job as RUNNING
   - Invoke MCP Server with tool name and input
   - Store output or error
   - Mark job as COMPLETED or FAILED
   - If failed, halt workflow and mark as FAILED
   - If successful, pass output to next step
4. Mark workflow as COMPLETED if all steps succeed

### Workflow Steps

Default workflow includes three steps:

1. **Design UI** - `lovable-ai/design-ui`
   - Generate UI components and design system

2. **Develop Logic** - `bolt-new-ai/develop-logic`
   - Generate application code based on design

3. **Stage & Test** - `embrace-io/stage-and-test`
   - Deploy to staging and run tests

Steps are defined in `src/services/orchestrator.ts` and can be customized.

## Database Operations

The `database.ts` service provides these operations:

### Project Management
- `createProject(name)` - Create new project
- `findProjectByName(name)` - Lookup by name
- `getOrCreateProject(name)` - Idempotent project creation

### Workflow Management
- `createWorkflow(projectId)` - Create new workflow
- `getWorkflow(workflowId)` - Fetch with jobs
- `updateWorkflowStatus(workflowId, status)` - Update status

### Job Management
- `createJob(workflowId, toolName, input)` - Create job
- `startJob(jobId)` - Mark as running
- `completeJob(jobId, output)` - Mark as completed with output
- `failJob(jobId, error)` - Mark as failed with error

## Configuration

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `MASTER_AGENT_PORT` - Service port (default: 3000)
- `MCP_SERVER_URL` - MCP Server endpoint (default: http://localhost:3001)

### Database Migrations

Run migrations:
```bash
npm run prisma:migrate
```

Generate Prisma client:
```bash
npm run prisma:generate
```

Open Prisma Studio:
```bash
npm run prisma:studio
```

## Development

### Running Locally

```bash
# Development mode with hot-reload
npm run dev

# Build for production
npm run build

# Production mode
npm start
```

### Adding New Workflow Steps

Edit `src/services/orchestrator.ts`:

```typescript
const defineWorkflowSteps = (projectName: string): WorkflowStep[] => {
  return [
    // ... existing steps
    {
      toolName: 'my-namespace/my-tool',
      input: {
        projectName,
        customParam: 'value'
      }
    }
  ];
};
```

Make sure the tool is registered in MCP Server first.

### Error Handling

The orchestrator stops execution on the first error:
- Job marked as FAILED with error message
- Workflow marked as FAILED
- Remaining steps are not executed

This ensures data consistency and prevents cascading failures.

## Logging

Uses Pino for structured logging with pretty printing in development:

```typescript
fastify.log.info('Message');
fastify.log.error(error);
fastify.log.warn('Warning');
```

## Testing

Test the API with curl:

```bash
# Create workflow
curl -X POST http://localhost:3000/workflows \
  -H "Content-Type: application/json" \
  -d '{"projectName": "test"}'

# Get status
curl http://localhost:3000/workflows/{workflowId}
```

## Production Considerations

1. **Database Connection Pooling:** Prisma handles this automatically
2. **Graceful Shutdown:** SIGTERM and SIGINT handlers disconnect database
3. **Error Recovery:** Failed workflows can be retried by creating new workflow
4. **Monitoring:** Log aggregation recommended for production
5. **Rate Limiting:** Consider adding rate limiting middleware
6. **Authentication:** Add auth middleware if exposing publicly

## Troubleshooting

### Workflow not starting
- Check master-agent logs for errors
- Verify MCP Server is reachable
- Check database connectivity

### Jobs stuck in RUNNING
- MCP Server may have crashed during execution
- Check MCP Server logs
- Restart MCP Server and create new workflow

### Database errors
- Verify DATABASE_URL is correct
- Check Prisma migrations are applied
- Ensure database is accessible from service
