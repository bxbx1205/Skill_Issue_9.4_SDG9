/**
 * Predictive Maintenance Dashboard
 * PS 9.4 - SDG 9: Industry Innovation
 * 
 * Smart IoT + AI predictive maintenance system that monitors
 * factory machines using temperature and vibration sensors.
 * 
 * OPTIMIZED: Handles Vercel free tier rate limits gracefully
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import MachineCard from './components/MachineCard';
import AlertsPanel from './components/AlertsPanel';
import RiskRanking from './components/RiskRanking';
import EventLogs from './components/EventLogs';
import FleetStats from './components/FleetStats';
import FactoryScene from './components/FactoryScene';
import './App.css';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
// Realtime 3 second refresh (20 requests/min) - synced with IoT data
const REFRESH_INTERVAL = parseInt(import.meta.env.VITE_REFRESH_INTERVAL) || 3000;

function App() {
  const [fleetData, setFleetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [rateLimited, setRateLimited] = useState(false);
  const intervalRef = useRef(null);
  const backoffRef = useRef(REFRESH_INTERVAL);

  // Fetch fleet data from API with rate limit handling
  const fetchFleetData = useCallback(async () => {
    // Skip fetch if rate limited
    if (rateLimited) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/fleet`);
      
      // Handle rate limiting (429 status)
      if (response.status === 429) {
        const data = await response.json();
        setRateLimited(true);
        setError(`Rate limited. Retrying in ${data.retryAfter || 30} seconds...`);
        
        // Back off and retry after the specified time
        const retryAfter = (data.retryAfter || 30) * 1000;
        backoffRef.current = Math.min(retryAfter, 60000);
        
        setTimeout(() => {
          setRateLimited(false);
          setError(null);
          backoffRef.current = REFRESH_INTERVAL;
        }, retryAfter);
        
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch fleet data');
      }
      const data = await response.json();
      setFleetData(data);
      setLastUpdate(new Date());
      setError(null);
      setRateLimited(false);
      backoffRef.current = REFRESH_INTERVAL;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching fleet data:', err);
    } finally {
      setLoading(false);
    }
  }, [rateLimited]);

  // Initial fetch and polling
  useEffect(() => {
    fetchFleetData();
    
    intervalRef.current = setInterval(fetchFleetData, REFRESH_INTERVAL);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchFleetData]);

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

        {/* 3D Factory Scene */}
        <section className="factory-scene-section">
          <h2 className="section-title">
            <span>🏭</span> 3D Factory View
          </h2>
          <div className="factory-scene-container" style={{ height: '500px', borderRadius: '12px', overflow: 'hidden' }}>
            <FactoryScene 
              machines={fleetData?.machines || []}
              onMachineSelect={(machine) => console.log('Selected:', machine)}
            />
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
