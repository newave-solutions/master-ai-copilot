
import { WorkflowService } from '../src/services/WorkflowService';
import { db } from '../src/services/database';

// Mock database
jest.mock('../src/services/database', () => ({
  db: {
    getOrCreateProject: jest.fn(),
    createWorkflow: jest.fn(),
    getWorkflow: jest.fn(),
    getAllWorkflows: jest.fn(),
    updateWorkflowStatus: jest.fn(),
    createJob: jest.fn(),
    startJob: jest.fn(),
    completeJob: jest.fn(),
    failJob: jest.fn(),
  },
  WorkflowStatus: {
    PENDING: 'PENDING',
    RUNNING: 'RUNNING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
  },
}));

describe('WorkflowService', () => {
  let workflowService: WorkflowService;

  beforeEach(() => {
    workflowService = new WorkflowService();
    jest.clearAllMocks();
  });

  it('should create a workflow', async () => {
    const mockProject = { id: 'p1', name: 'test-project' };
    const mockWorkflow = { id: 'w1', status: 'PENDING' };

    (db.getOrCreateProject as jest.Mock).mockResolvedValue(mockProject);
    (db.createWorkflow as jest.Mock).mockResolvedValue(mockWorkflow);

    const result = await workflowService.createWorkflow('test-project');

    expect(db.getOrCreateProject).toHaveBeenCalledWith('test-project');
    expect(db.createWorkflow).toHaveBeenCalledWith('p1');
    expect(result).toEqual({
      workflowId: 'w1',
      projectId: 'p1',
      projectName: 'test-project',
      status: 'PENDING',
      message: 'Workflow created and started successfully',
    });
  });

  it('should get steps', () => {
      const steps = workflowService.defineWorkflowSteps("test");
      expect(steps.length).toBe(3);
      expect(steps[0].input.projectName).toBe("test");
  })
});
