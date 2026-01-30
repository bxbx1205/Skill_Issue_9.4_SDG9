/**
 * Predictive Maintenance Dashboard
 * PS 9.4 - SDG 9: Industry Innovation
 * 
 * Smart IoT + AI predictive maintenance system that monitors
 * factory machines using temperature and vibration sensors.
 */

import { useState, useEffect } from 'react';
import MachineCard from './components/MachineCard';
import AlertsPanel from './components/AlertsPanel';
import RiskRanking from './components/RiskRanking';
import EventLogs from './components/EventLogs';
import FleetStats from './components/FleetStats';
import './App.css';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const REFRESH_INTERVAL = 1000; // 1 second

function App() {
  const [fleetData, setFleetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch fleet data from API
  const fetchFleetData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/fleet`);
      if (!response.ok) {
        throw new Error('Failed to fetch fleet data');
      }
      const data = await response.json();
      setFleetData(data);
      setLastUpdate(new Date());
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

  // Get top risk machine ID for highlighting
  const topRiskMachineId = fleetData?.topRiskMachine?.name 
    ? fleetData.machines.find(m => m.name === fleetData.topRiskMachine.name)?.id 
    : null;

  if (loading && !fleetData) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="spinner"></div>
          <h2>🏭 Predictive Maintenance System</h2>
          <p>Connecting to sensors...</p>
        </div>
      </div>
    );
  }

  if (error && !fleetData) {
    return (
      <div className="error-screen">
        <div className="error-content">
          <span className="error-icon">⚠️</span>
          <h2>Connection Error</h2>
          <p>{error}</p>
          <p className="error-hint">
            Make sure the backend server is running at {API_BASE_URL}
          </p>
          <button onClick={fetchFleetData} className="retry-button">
            🔄 Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>
            <span className="header-icon">🏭</span>
            Predictive Maintenance System
          </h1>
          <span className="header-subtitle">PS 9.4 - SDG 9: Industry Innovation</span>
        </div>
        <div className="header-right">
          <div className="header-status">
            <span className={`status-dot ${fleetData?.simulationMode ? 'simulation' : 'live'}`}></span>
            {fleetData?.simulationMode ? '💻 Simulation Mode' : '📡 Live Sensors'}
          </div>
          {lastUpdate && (
            <div className="last-update">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Fleet Statistics Bar */}
        {fleetData?.fleetStats && (
          <section className="stats-section">
            <FleetStats 
              stats={fleetData.fleetStats}
              simulationMode={fleetData.simulationMode}
              serialConnected={fleetData.serialConnected}
            />
          </section>
        )}

        {/* Machine Cards Grid */}
        <section className="machines-section">
          <h2 className="section-title">
            <span>⚡</span> Fleet Monitoring
            <span className="machine-count">{fleetData?.machines?.length || 0} Machines</span>
          </h2>
          <div className="machines-grid">
            {fleetData?.machines?.map((machine) => (
              <MachineCard 
                key={machine.id} 
                machine={machine}
                isTopRisk={machine.id === topRiskMachineId}
              />
            ))}
          </div>
        </section>

        {/* Bottom Row - Alerts, Ranking, Logs */}
        <section className="bottom-section">
          <div className="bottom-grid">
            {/* Alerts Panel */}
            <div className="alerts-column">
              <AlertsPanel machines={fleetData?.machines || []} />
            </div>

            {/* Risk Ranking */}
            <div className="ranking-column">
              <RiskRanking 
                rankedMachines={fleetData?.rankedMachines || []}
                topRiskMachine={fleetData?.topRiskMachine}
              />
            </div>
          </div>
        </section>

        {/* Event Logs */}
        <section className="logs-section">
          <EventLogs logs={fleetData?.logs || []} />
        </section>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <span>🌍 Smart Factory IoT Solution</span>
          <span>•</span>
          <span>Industry 4.0 Predictive Maintenance</span>
          <span>•</span>
          <span>SDG 9: Industry, Innovation and Infrastructure</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
