# Task Delegation Agent

A GitHub Copilot agent that intelligently delegates development tasks to specialized AI-powered development services.

## Overview

The Task Delegation Agent analyzes development tasks and routes them to the most appropriate service based on the task requirements and each service's specialties.

## Supported Services

### 🚀 bolt.new
- **Specialties**: Full-stack apps, rapid prototyping, web applications
- **Best for**: Complete web app development, React/Vue projects, Node.js backends

### 💖 lovable.dev
- **Specialties**: UI design, frontend development, React, Tailwind CSS
- **Best for**: Beautiful UIs, responsive designs, modern frontend applications

### ⚡ v0.dev
- **Specialties**: UI components, Next.js, shadcn/ui
- **Best for**: Component libraries, Next.js projects, design systems

### 🎯 cursor.sh
- **Specialties**: Code editing, refactoring, bug fixing
- **Best for**: Code improvements, debugging, code reviews

## API Endpoints

### Delegate a Task
```http
POST /api/delegate
Content-Type: application/json

{
  "task": {
    "title": "Build a landing page",
    "description": "Create a responsive landing page with hero section and contact form",
    "type": "frontend",
    "requirements": [
      "React",
      "Tailwind CSS",
      "Mobile responsive",
      "Contact form with validation"
    ]
  },
  "preferences": {
    "preferredService": "lovable",
    "priority": "high"
  }
}
```

### Get Task Status
```http
GET /api/delegate/status/:delegationId
```

### List Available Services
```http
GET /api/delegate/services
```

### Get Service Recommendations
```http
POST /api/delegate/recommend
Content-Type: application/json

{
  "task": {
    "description": "Need to build a dashboard with charts",
    "type": "full-stack",
    "requirements": ["React", "charts", "real-time data"]
  }
}
```

### List All Delegations
```http
GET /api/delegate?status=completed&service=bolt
```

### Cancel a Delegation
```http
DELETE /api/delegate/:delegationId
```

## Usage Example

```typescript
// Delegate a task
const response = await fetch('http://localhost:3000/api/delegate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task: {
      title: 'E-commerce Product Page',
      description: 'Build a product detail page with image gallery, reviews, and add to cart',
      type: 'frontend',
      requirements: [
        'React',
        'Image carousel',
        'Star rating system',
        'Shopping cart integration'
      ]
    }
  })
});

const { delegation } = await response.json();
console.log(`Task delegated to ${delegation.service.name}`);
console.log(`Delegation ID: ${delegation.id}`);

// Check status
const statusResponse = await fetch(
  `http://localhost:3000/api/delegate/status/${delegation.id}`
);
const { status } = await statusResponse.json();
console.log(`Status: ${status.status}`);
```

## How It Works

1. **Task Analysis**: The agent analyzes the task description, type, and requirements
2. **Service Selection**: Based on specialties, it selects the most suitable service
3. **Delegation**: Creates a delegation record with detailed instructions
4. **Instructions Generation**: Generates step-by-step instructions for the selected service
5. **Status Tracking**: Monitors the delegation status (pending → in_progress → completed)

## Integration with GitHub Copilot

The agent is configured in `.github/copilot/agent.json` and can be invoked through:

- GitHub Copilot Chat
- VS Code Copilot interface
- API endpoints
- CLI commands

## Configuration

Update `.github/copilot/agent.json` to customize:
- Available services
- Service specialties
- API endpoints
- Timeout and retry settings

## Development

```bash
# Install dependencies
npm install --workspace=master-agent

# Run in development mode
npm run dev:master

# Build
npm run build --workspace=master-agent

# Start production server
npm run start:master
```

## Future Enhancements

- [ ] Real API integration with services (OAuth, API keys)
- [ ] Webhook support for status updates
- [ ] Result retrieval and integration
- [ ] Multi-service task splitting
- [ ] Cost estimation and tracking
- [ ] Performance analytics
- [ ] Custom service plugins
