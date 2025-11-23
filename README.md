# AI Co-Pilot Backend

A production-ready AI orchestration platform built with TypeScript, Node.js, and microservices architecture. The system consists of two primary services that work together to orchestrate complex AI workflows.

## 🏗️ Architecture

```
ai-copilot-backend/
├── master-agent/         # Main orchestration service (Port 3000)
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic & database
│   │   └── types/        # TypeScript interfaces
│   └── prisma/           # Database schema & migrations
│
├── mcp-server/           # Universal tool adapter (Port 3001)
│   └── src/
│       ├── tools/        # Internal & external tool handlers
│       └── types/        # TypeScript interfaces
│
└── shared configuration
```

### Services

1. **Master Agent** (`:3000`) - The public-facing orchestration API
   - Manages projects, workflows, and jobs
   - Provides REST API for workflow creation and status tracking
   - Orchestrates complex multi-step AI workflows
   - Persists all data to PostgreSQL via Prisma

2. **MCP Server** (`:3001`) - Universal tool adapter
   - Provides unified interface for all AI tools
   - Supports internal mock tools and external API integrations
   - Handles tool discovery and invocation
   - Extensible dispatcher pattern for adding new tools

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL database (Supabase provided)
- npm or yarn

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

This will install all dependencies for both services.

2. **Configure environment variables:**

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Key variables:
- `DATABASE_URL` - PostgreSQL connection string (already configured for Supabase)
- `MASTER_AGENT_PORT` - Master agent service port (default: 3000)
- `MCP_SERVER_PORT` - MCP server port (default: 3001)
- `MCP_SERVER_URL` - MCP server URL for master agent to connect
- `EMBRACE_API_KEY` - (Optional) External API key for embrace-io tool

3. **Generate Prisma client:**

```bash
npm run prisma:generate
```

The database schema has already been applied to Supabase.

4. **Start both services:**

```bash
npm run dev
```

This starts both services concurrently:
- Master Agent: http://localhost:3000
- MCP Server: http://localhost:3001

## 📖 API Documentation

### Master Agent API

#### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "master-agent",
  "mcpServer": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Create Workflow
```bash
POST /workflows
Content-Type: application/json

{
  "projectName": "my-awesome-app"
}
```

Response:
```json
{
  "workflowId": "550e8400-e29b-41d4-a716-446655440000",
  "projectId": "660e8400-e29b-41d4-a716-446655440000",
  "projectName": "my-awesome-app",
  "status": "PENDING",
  "message": "Workflow created and started successfully"
}
```

#### Get Workflow Status
```bash
GET /workflows/:id
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "projectName": "my-awesome-app",
  "status": "RUNNING",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:15.000Z",
  "jobs": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "toolName": "lovable-ai/design-ui",
      "status": "COMPLETED",
      "startedAt": "2024-01-15T10:30:05.000Z",
      "completedAt": "2024-01-15T10:30:10.000Z",
      "error": null,
      "output": { "components": [...], "designSystem": {...} }
    }
  ]
}
```

### MCP Server API

#### Health Check
```bash
GET /health
```

#### List Available Tools
```bash
GET /tools
```

Response:
```json
{
  "tools": [
    "lovable-ai/design-ui",
    "bolt-new-ai/develop-logic",
    "embrace-io/stage-and-test"
  ],
  "count": 3
}
```

#### Invoke Tool
```bash
POST /invoke
Content-Type: application/json

{
  "toolName": "lovable-ai/design-ui",
  "input": {
    "projectName": "my-app",
    "requirements": "Modern dashboard"
  }
}
```

## 🔧 Development

### Project Scripts

```bash
# Install all dependencies
npm install

# Run both services in development mode (with hot-reload)
npm run dev

# Build both services for production
npm run build

# Start both services in production mode
npm start

# Run specific service
npm run dev:master    # Master agent only
npm run dev:mcp       # MCP server only

# Database operations
npm run prisma:migrate   # Run migrations
npm run prisma:generate  # Generate Prisma client
npm run prisma:studio    # Open Prisma Studio GUI
```

### Adding New Tools

See [mcp-server/README.md](./mcp-server/README.md) for detailed instructions on adding internal mock tools or external API integrations.

Quick example:

```typescript
// In mcp-server/src/tools/internal.ts
export const myNewTool: ToolHandler = async (input) => {
  return {
    toolName: 'my-namespace/my-tool',
    status: 'completed',
    result: { /* your data */ }
  };
};

// Register in mcp-server/src/tools/dispatcher.ts
import { myNewTool } from './internal';

export const toolRegistry = {
  // ... existing tools
  'my-namespace/my-tool': myNewTool,
};
```

## 🔄 Workflow Lifecycle

1. **Create Workflow** - Client calls `POST /workflows` with project name
2. **Workflow Initialization** - Master agent creates project and workflow records
3. **Orchestration Start** - Orchestrator begins executing workflow steps asynchronously
4. **Tool Invocation** - For each step, master agent calls MCP server with tool name and input
5. **Tool Execution** - MCP server dispatches to appropriate handler (internal or external)
6. **Result Processing** - Master agent stores results and updates job status
7. **Next Step** - Output from previous step feeds into next step's input
8. **Completion** - Workflow marked as COMPLETED or FAILED based on results
9. **Status Check** - Client polls `GET /workflows/:id` for current status

## 📊 Database Schema

### Projects
- Stores unique project definitions
- One project can have multiple workflows

### Workflows
- Represents a complete AI orchestration lifecycle
- Links to parent project
- Tracks overall workflow status

### Jobs
- Individual tool invocations within a workflow
- Stores input, output, errors, and timing data
- Sequential execution with dependency on previous steps

## 🛠️ Technology Stack

- **Language:** TypeScript
- **Runtime:** Node.js 18+
- **Web Framework:** Fastify
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **HTTP Client:** Axios
- **Logging:** Pino
- **Process Manager:** npm-run-all

## 🧪 Testing Workflow

Test the complete workflow with curl:

```bash
# 1. Create a workflow
curl -X POST http://localhost:3000/workflows \
  -H "Content-Type: application/json" \
  -d '{"projectName": "test-project"}'

# Response includes workflowId: "abc-123-def"

# 2. Check workflow status (use workflowId from step 1)
curl http://localhost:3000/workflows/abc-123-def

# 3. Monitor until status is COMPLETED or FAILED
```

## 🔒 Security Considerations

- RLS (Row Level Security) enabled on all database tables
- Environment variables for sensitive configuration
- CORS enabled on master agent for cross-origin requests
- Input validation on all API endpoints
- Error messages sanitized to prevent information leakage

## 🐛 Troubleshooting

### MCP Server not reachable
- Ensure MCP server is running: `npm run dev:mcp`
- Check `MCP_SERVER_URL` in `.env` matches actual port
- Verify no firewall blocking local connections

### Database connection errors
- Verify `DATABASE_URL` is correct in `.env`
- Ensure Supabase database is accessible
- Check network connectivity

### Workflow stuck in RUNNING state
- Check master-agent logs for errors
- Verify MCP server is responding
- Check individual job errors in workflow status response

### Tool not found errors
- Verify tool name is registered in `mcp-server/src/tools/dispatcher.ts`
- Check tool name spelling matches exactly
- Use `GET /tools` to see available tools

## 📝 Example Use Cases

1. **Full Stack App Generation**
   - Design UI with lovable-ai
   - Generate code with bolt-new-ai
   - Deploy and test with embrace-io

2. **Iterative Development**
   - Create multiple workflows for same project
   - Track history of all attempts
   - Compare outputs across workflows

3. **External API Integration**
   - Configure API keys for external tools
   - Fallback to mock responses when API unavailable
   - Centralized error handling and retry logic

## 🚢 Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database URL
3. Set proper API keys for external services
4. Build: `npm run build`
5. Start: `npm start`
6. Use process manager (PM2, systemd) for reliability
7. Set up monitoring and logging aggregation
8. Configure reverse proxy (nginx) for SSL/TLS

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

See individual service READMEs for contribution guidelines:
- [master-agent/README.md](./master-agent/README.md)
- [mcp-server/README.md](./mcp-server/README.md)
