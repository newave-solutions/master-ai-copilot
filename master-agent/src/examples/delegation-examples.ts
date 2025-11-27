// Example usage of the Task Delegation Agent

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

// Example 1: Delegate a full-stack application task to bolt.new
async function delegateFullStackApp() {
  const response = await axios.post(`${API_BASE_URL}/api/delegate`, {
    task: {
      title: 'Todo Application',
      description: 'Build a full-stack todo application with user authentication',
      type: 'full-stack',
      requirements: [
        'React frontend',
        'Node.js backend',
        'PostgreSQL database',
        'User authentication',
        'CRUD operations',
        'Responsive design',
      ],
    },
    preferences: {
      priority: 'high',
    },
  });

  console.log('✅ Delegation created:', response.data.delegation);
  return response.data.delegation.id;
}

// Example 2: Delegate UI design to lovable.dev
async function delegateUIDesign() {
  const response = await axios.post(`${API_BASE_URL}/api/delegate`, {
    task: {
      title: 'Landing Page Design',
      description: 'Create a modern landing page with animations and gradients',
      type: 'ui-design',
      requirements: [
        'Hero section with CTA',
        'Feature showcase',
        'Testimonials section',
        'Contact form',
        'Tailwind CSS',
        'Dark mode support',
      ],
    },
    preferences: {
      preferredService: 'lovable',
    },
  });

  console.log('✅ UI task delegated:', response.data.delegation);
  return response.data.delegation.id;
}

// Example 3: Get recommendations for a task
async function getRecommendations() {
  const response = await axios.post(`${API_BASE_URL}/api/delegate/recommend`, {
    task: {
      description: 'Need to build a dashboard with real-time charts and data visualization',
      type: 'frontend',
      requirements: ['React', 'Charts.js', 'WebSocket', 'Responsive'],
    },
  });

  console.log('📊 Recommendations:', response.data.recommendations);
}

// Example 4: Check task status
async function checkTaskStatus(delegationId: string) {
  const response = await axios.get(
    `${API_BASE_URL}/api/delegate/status/${delegationId}`
  );

  console.log('📈 Status:', response.data.status);
}

// Example 5: List all services
async function listServices() {
  const response = await axios.get(`${API_BASE_URL}/api/delegate/services`);

  console.log('🛠️  Available services:');
  response.data.services.forEach((service: any) => {
    console.log(`  - ${service.name}: ${service.specialties.join(', ')}`);
  });
}

// Example 6: List delegations with filters
async function listDelegations() {
  const response = await axios.get(`${API_BASE_URL}/api/delegate`, {
    params: {
      status: 'completed',
    },
  });

  console.log('📋 Completed delegations:', response.data.delegations);
}

// Run examples
async function main() {
  try {
    console.log('🚀 Task Delegation Agent Examples\n');

    // List available services
    await listServices();
    console.log('\n---\n');

    // Get recommendations
    await getRecommendations();
    console.log('\n---\n');

    // Delegate a full-stack app
    const appId = await delegateFullStackApp();
    console.log('\n---\n');

    // Delegate UI design
    const uiId = await delegateUIDesign();
    console.log('\n---\n');

    // Wait a bit for processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check status
    await checkTaskStatus(appId);
    await checkTaskStatus(uiId);
    console.log('\n---\n');

    // List all delegations
    await listDelegations();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Uncomment to run examples
// main();

export {
  delegateFullStackApp,
  delegateUIDesign,
  getRecommendations,
  checkTaskStatus,
  listServices,
  listDelegations,
};
