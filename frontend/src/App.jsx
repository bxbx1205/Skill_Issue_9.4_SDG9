/**
 * Predictive Maintenance Dashboard
 * PS 9.4 - SDG 9: Industry Innovation
 */

import { useState, useEffect } from 'react';
import MachineCard from './components/MachineCard';
import AlertsPanel from './components/AlertsPanel';
import RiskRanking from './components/RiskRanking';
import FleetStats from './components/FleetStats';
import EventLogs from './components/EventLogs';
import FactoryScene from './components/FactoryScene';
import './App.css';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const REFRESH_INTERVAL = 1000; // 1 second

function App() {
  const [fleetData, setFleetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch fleet data from API
  const fetchFleetData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/fleet`);
      if (!response.ok) {
        throw new Error('Failed to fetch fleet data');
      }
      const data = await response.json();
      setFleetData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching fleet data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchFleetData();
    const interval = setInterval(fetchFleetData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  if (loading && !fleetData) {
    return (
      <div className="dashboard" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="status-indicator simulation pulse" style={{ width: 40, height: 40, margin: '0 auto 20px' }}></div>
          <h2>Initializing System...</h2>
        </div>
      </div>
    );
  }

  if (error && !fleetData) {
    return (
      <div className="dashboard" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: 400 }}>
          <span style={{ fontSize: 40, display: 'block', marginBottom: 16 }}>⚠️</span>
          <h2 style={{ marginBottom: 8 }}>Connection Lost</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error}</p>
          <button onClick={fetchFleetData} style={{
            background: 'var(--color-info)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-brand">
          <h1>
            <span className="icon">🏭</span>
            Predictive Maintenance
          </h1>
          <span className="header-meta">PS 9.4 - SDG 9: Industry Innovation</span>
        </div>
        
        <div className="header-status">
           <span className="status-indicator pulse"></span>
           System Online
        </div>
      </header>

      <div className="dashboard-container">
        
        {/* Fleet Stats Banner */}
        <div style={{ marginBottom: 24 }}>
          <FleetStats 
            stats={fleetData.fleetStats} 
            simulationMode={!fleetData.serialConnected}
            serialConnected={fleetData.serialConnected}
          />
        </div>

        {/* 3D Digital Twin Factory Scene */}
        <div style={{ marginBottom: 24 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 className="card-title">
                <span className="icon">🏭</span> Digital Twin - Factory Floor
              </h3>
            </div>
            <div style={{ height: '500px' }}>
              <FactoryScene 
                machines={fleetData.machines}
                onMachineSelect={(machine) => console.log('Selected:', machine.name)}
              />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="main-content-grid">
          
          {/* Sidebar Area */}
          <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <RiskRanking 
              rankedMachines={fleetData.rankedMachines}
              topRiskMachine={fleetData.topRiskMachine}
            />
            <AlertsPanel machines={fleetData.machines} />
          </div>

          {/* Main Grid Area */}
          <div className="machines-grid-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Machine Fleet Status</h2>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Total Machines: {fleetData.machines.length}
              </span>
            </div>
            
            <div className="machines-grid">
              {fleetData.machines.map(machine => (
                <MachineCard 
                  key={machine.id} 
                  machine={machine}
                  isTopRisk={fleetData.topRiskMachine?.id === machine.id}
                />
              ))}
            </div>

            {/* Event Logs */}
            <EventLogs logs={fleetData.logs || []} />
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default App;
