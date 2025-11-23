# AI Co-Pilot CLI

Command-line interface for managing AI Co-Pilot workflows.

## Installation

```bash
cd cli
npm install
npm run build
```

## Usage

### Create and Monitor a Workflow

```bash
npm run dev create-workflow --projectName my-app
```

Or using the built version:

```bash
npm start create-workflow --projectName my-app
```

### Options

- `--projectName, -p`: Name of the project (required)
- `--help, -h`: Show help
- `--version, -v`: Show version

## Features

- ✅ Create workflows via API
- ✅ Real-time status monitoring (2-second polling)
- ✅ Colored terminal output
- ✅ Job status tracking
- ✅ Duration calculation
- ✅ Error handling and user-friendly messages
- ✅ Loading spinners

## Environment Variables

- `MASTER_AGENT_URL`: URL of the master-agent service (default: `http://localhost:3000`)

## Example Output

```
✔ Workflow created successfully!
  Workflow ID: 550e8400-e29b-41d4-a716-446655440000
  Project: my-app
  Status: ⏳ PENDING

Monitoring workflow status...
────────────────────────────────────────────────────────────

▶ lovable-ai/design-ui running...
✓ lovable-ai/design-ui completed in 0.15s
▶ bolt-new-ai/develop-logic running...
✓ bolt-new-ai/develop-logic completed in 0.18s
▶ embrace-io/stage-and-test running...
✓ embrace-io/stage-and-test completed in 0.20s

────────────────────────────────────────────────────────────
🎉 Workflow completed successfully!
  Total jobs: 3
  Completed: 3
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev create-workflow --projectName test

# Build
npm run build

# Run built version
npm start create-workflow --projectName test
```
