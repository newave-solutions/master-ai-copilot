import { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

interface Job {
  id: string;
  toolName: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  input: any;
  output: any;
}

interface Workflow {
  id: string;
  projectName: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  jobs: Job[];
}

function Dashboard() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchWorkflows = async () => {
    try {
      const response = await axios.get<Workflow[]>('/api/workflows');
      setWorkflows(response.data);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.message);
      } else {
        setError('Failed to fetch workflows');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
    const interval = setInterval(fetchWorkflows, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: { emoji: '⏳', class: 'pending', text: 'Pending' },
      RUNNING: { emoji: '🔄', class: 'running', text: 'Running' },
      COMPLETED: { emoji: '✅', class: 'completed', text: 'Completed' },
      FAILED: { emoji: '❌', class: 'failed', text: 'Failed' },
    };
    const badge = badges[status as keyof typeof badges] || { emoji: '❓', class: 'unknown', text: status };
    return (
      <span className={`status-badge status-${badge.class}`}>
        <span className="status-emoji">{badge.emoji}</span>
        {badge.text}
      </span>
    );
  };

  const calculateDuration = (startedAt: string | null, completedAt: string | null): string => {
    if (!startedAt || !completedAt) return 'N/A';
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    const duration = (end - start) / 1000;
    return `${duration.toFixed(2)}s`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const filteredWorkflows = workflows.filter((workflow) =>
    workflow.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          <h2>Workflows</h2>
          {lastUpdate && (
            <span className="last-update">Last updated: {formatDate(lastUpdate.toISOString())}</span>
          )}
        </div>
        <input
          type="text"
          className="search-input"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
          <button className="error-dismiss" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}

      {filteredWorkflows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No workflows found</h3>
          <p>
            {searchTerm
              ? `No workflows match "${searchTerm}"`
              : 'Create your first workflow using the CLI'}
          </p>
          {!searchTerm && (
            <code className="cli-example">
              npm run dev create-workflow --projectName my-app
            </code>
          )}
        </div>
      ) : (
        <div className="workflows-grid">
          {filteredWorkflows.map((workflow) => (
            <div key={workflow.id} className="workflow-card">
              <div className="card-header">
                <h3>{workflow.projectName}</h3>
                {getStatusBadge(workflow.status)}
              </div>

              <div className="card-metadata">
                <div className="metadata-item">
                  <span className="metadata-label">ID:</span>
                  <span className="metadata-value">{workflow.id}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Created:</span>
                  <span className="metadata-value">{formatDate(workflow.createdAt)}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Jobs:</span>
                  <span className="metadata-value">{workflow.jobs.length}</span>
                </div>
              </div>

              <div className="jobs-section">
                <h4>Jobs</h4>
                <div className="jobs-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Tool</th>
                        <th>Status</th>
                        <th>Duration</th>
                        <th>Timing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workflow.jobs.map((job) => (
                        <tr
                          key={job.id}
                          onClick={() => setSelectedJob(job)}
                          className="job-row"
                        >
                          <td className="tool-name">{job.toolName}</td>
                          <td>{getStatusBadge(job.status)}</td>
                          <td>{calculateDuration(job.startedAt, job.completedAt)}</td>
                          <td className="timing-cell">
                            {job.startedAt && (
                              <div className="timing-info">
                                <small>Started: {formatDate(job.startedAt)}</small>
                                {job.completedAt && (
                                  <small>Completed: {formatDate(job.completedAt)}</small>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {workflow.jobs.some((job) => job.error) && (
                <div className="errors-section">
                  <h4>Errors</h4>
                  {workflow.jobs
                    .filter((job) => job.error)
                    .map((job) => (
                      <div key={job.id} className="error-item">
                        <span className="error-job-name">{job.toolName}:</span>
                        <span className="error-job-message">{job.error}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedJob.toolName}</h2>
              {getStatusBadge(selectedJob.status)}
              <button className="modal-close" onClick={() => setSelectedJob(null)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <h3>Input</h3>
                <pre className="json-display">
                  {JSON.stringify(selectedJob.input, null, 2)}
                </pre>
              </div>

              <div className="modal-section">
                <h3>Output</h3>
                <pre className="json-display">
                  {selectedJob.output
                    ? JSON.stringify(selectedJob.output, null, 2)
                    : 'No output yet'}
                </pre>
              </div>

              {selectedJob.error && (
                <div className="modal-section error-section">
                  <h3>Error</h3>
                  <div className="error-display">{selectedJob.error}</div>
                </div>
              )}

              <div className="modal-section">
                <h3>Details</h3>
                <div className="details-grid">
                  <div>
                    <strong>Started:</strong> {selectedJob.startedAt ? formatDate(selectedJob.startedAt) : 'N/A'}
                  </div>
                  <div>
                    <strong>Completed:</strong> {selectedJob.completedAt ? formatDate(selectedJob.completedAt) : 'N/A'}
                  </div>
                  <div>
                    <strong>Duration:</strong> {calculateDuration(selectedJob.startedAt, selectedJob.completedAt)}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-button" onClick={() => setSelectedJob(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
