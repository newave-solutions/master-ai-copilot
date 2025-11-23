import { useState } from 'react';
import Dashboard from './Dashboard';
import WorkflowCanvas from './WorkflowCanvas';
import './App.css';

type View = 'dashboard' | 'canvas';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI Co-Pilot</h1>
        <nav className="app-nav">
          <button
            className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-button ${currentView === 'canvas' ? 'active' : ''}`}
            onClick={() => setCurrentView('canvas')}
          >
            Workflow Canvas
          </button>
        </nav>
      </header>

      <main className="app-main">
        {currentView === 'dashboard' ? <Dashboard /> : <WorkflowCanvas />}
      </main>
    </div>
  );
}

export default App;
