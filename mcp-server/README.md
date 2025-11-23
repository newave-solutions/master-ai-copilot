# MCP Server - Universal Tool Adapter

The MCP Server is a universal adapter service that provides a unified interface for invoking various AI tools. It supports both internal mock tools and external API integrations.

## Architecture

The MCP Server uses a dispatcher pattern to route tool invocations to the appropriate handler. Each tool is registered in the `toolRegistry` and can be either:

1. **Internal Mock Tools**: Self-contained logic that returns mock data
2. **External API Tools**: Proxy requests to third-party MCP APIs

## Available Endpoints

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "mcp-server",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### `GET /tools`
List all available tools.

**Response:**
```json
{
  "tools": ["lovable-ai/design-ui", "bolt-new-ai/develop-logic", "embrace-io/stage-and-test"],
  "count": 3
}
```

### `POST /invoke`
Invoke a specific tool.

**Request Body:**
```json
{
  "toolName": "lovable-ai/design-ui",
  "input": {
    "projectName": "my-app",
    "requirements": "Modern dashboard"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "toolName": "lovable-ai/design-ui",
  "executionTime": 150
}
```

## Adding New Tools

### Adding an Internal Mock Tool

1. Open `src/tools/internal.ts`
2. Create a new tool handler function:

```typescript
export const myNewTool: ToolHandler = async (input) => {
  const { param1, param2 } = input;

  return {
    toolName: 'my-namespace/my-tool',
    status: 'completed',
    result: {
      // Your mock data here
    },
  };
};
```

3. Register it in `src/tools/dispatcher.ts`:

```typescript
import { myNewTool } from './internal';

export const toolRegistry: Record<string, ToolHandler> = {
  // ... existing tools
  'my-namespace/my-tool': myNewTool,
};
```

### Adding an External API Tool

1. Open `src/tools/external.ts`
2. Create a new tool handler using the `createExternalToolHandler` helper:

```typescript
export const myExternalTool: ToolHandler = async (input) => {
  const apiUrl = process.env.MY_API_URL || 'https://api.example.com/invoke';
  const apiKey = process.env.MY_API_KEY;

  if (!apiKey) {
    console.warn('MY_API_KEY not set, returning mock response');
    return {
      // Mock response when API key is not configured
    };
  }

  const externalHandler = createExternalToolHandler({
    url: apiUrl,
    apiKey,
    timeout: 30000,
  });

  return externalHandler(input);
};
```

3. Register it in `src/tools/dispatcher.ts`:

```typescript
import { myExternalTool } from './external';

export const toolRegistry: Record<string, ToolHandler> = {
  // ... existing tools
  'my-namespace/my-external-tool': myExternalTool,
};
```

4. Add environment variables to `.env`:

```
MY_API_URL=https://api.example.com/invoke
MY_API_KEY=your-api-key-here
```

## Tool Naming Convention

Tools should follow the pattern: `namespace/tool-name`

Examples:
- `lovable-ai/design-ui`
- `bolt-new-ai/develop-logic`
- `embrace-io/stage-and-test`

## Error Handling

All tool handlers should throw errors for failure cases. The dispatcher will catch them and return a standardized error response:

```json
{
  "success": false,
  "error": "Error message",
  "toolName": "the-tool-name",
  "executionTime": 50
}
```

## Development

Start the server in development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Start in production mode:
```bash
npm start
```

## Testing Tools

Use curl to test tool invocation:

```bash
curl -X POST http://localhost:3001/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "toolName": "lovable-ai/design-ui",
    "input": {
      "projectName": "test-app",
      "requirements": "Modern design"
    }
  }'
```
