import { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Node,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';
import './WorkflowCanvas.css';

interface Tool {
  name: string;
  description?: string;
}

const WorkflowCanvas: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await axios.get<{ tools: string[]; count: number }>(
          'http://localhost:3001/tools'
        );
        setTools(response.data.tools.map((name) => ({ name })));
      } catch (error) {
        console.error('Failed to fetch tools:', error);
        setTools([
          { name: 'lovable-ai/design-ui' },
          { name: 'bolt-new-ai/develop-logic' },
          { name: 'embrace-io/stage-and-test' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const toolName = event.dataTransfer.getData('application/reactflow');
      const reactFlowBounds = (event.target as HTMLElement)
        .closest('.react-flow')
        ?.getBoundingClientRect();

      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 25,
      };

      const newNode: Node = {
        id: `${toolName.replace(/\//g, '-')}-${Date.now()}`,
        type: 'default',
        position,
        data: { label: toolName },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onDragStart = (event: React.DragEvent, toolName: string) => {
    event.dataTransfer.setData('application/reactflow', toolName);
    event.dataTransfer.effectAllowed = 'move';
  };

  const saveWorkflow = () => {
    const workflow = {
      nodes: nodes.map((node) => ({
        id: node.id,
        tool: node.data.label,
        position: node.position,
      })),
      edges: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
      })),
      steps: nodes.map((node, index) => ({
        order: index + 1,
        toolName: node.data.label as string,
        nodeId: node.id,
      })),
    };

    console.log('Workflow saved:', workflow);
    setSaveMessage('Workflow saved! Check console for details.');

    setTimeout(() => {
      setSaveMessage(null);
    }, 3000);
  };

  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
  };

  return (
    <div className="workflow-canvas-container">
      <div className="canvas-sidebar">
        <div className="sidebar-header">
          <h3>Available Tools</h3>
          <span className="tool-count">{tools.length} tools</span>
        </div>

        {loading ? (
          <div className="sidebar-loading">
            <div className="spinner-small"></div>
            <p>Loading tools...</p>
          </div>
        ) : (
          <div className="tools-list">
            {tools.map((tool) => (
              <div
                key={tool.name}
                draggable
                onDragStart={(e) => onDragStart(e, tool.name)}
                className="tool-card"
              >
                <span className="tool-icon">🔧</span>
                <span className="tool-name">{tool.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="sidebar-instructions">
          <h4>How to use:</h4>
          <ol>
            <li>Drag tools from the list onto the canvas</li>
            <li>Connect tools by dragging from one node to another</li>
            <li>Save your workflow when ready</li>
          </ol>
        </div>
      </div>

      <div className="canvas-main">
        <div className="canvas-toolbar">
          <div className="toolbar-info">
            <span className="node-count">
              Nodes: {nodes.length}
            </span>
            <span className="edge-count">
              Connections: {edges.length}
            </span>
          </div>
          <div className="toolbar-actions">
            <button
              onClick={clearCanvas}
              className="toolbar-button clear-button"
              disabled={nodes.length === 0}
            >
              Clear Canvas
            </button>
            <button
              onClick={saveWorkflow}
              className="toolbar-button save-button"
              disabled={nodes.length === 0}
            >
              Save Workflow
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className="save-message">
            ✓ {saveMessage}
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>

        {nodes.length === 0 && (
          <div className="canvas-empty-state">
            <div className="empty-icon">🎨</div>
            <h3>Your canvas is empty</h3>
            <p>Drag tools from the sidebar to start building your workflow</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowCanvas;
