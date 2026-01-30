/**
 * Predictive Maintenance Dashboard
 * PS 9.4 - SDG 9: Industry Innovation
 * Smart Industrial IoT Monitoring
 */

import { useState, useEffect, useCallback } from 'react';
import MachineCard from './components/MachineCard';
import AlertsPanel from './components/AlertsPanel';
import FleetStats from './components/FleetStats';
import EventLogs from './components/EventLogs';
import FactoryScene from './components/FactoryScene';
import './App.css';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const REFRESH_INTERVAL = 1000; // 1 second

// Gemini AI Analysis Function
async function analyzeWithGemini(fleetData) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    return null;
  }
  
  try {
    const prompt = `Analyze this industrial IoT sensor data and provide brief maintenance recommendations:
    ${JSON.stringify(fleetData.machines.map(m => ({
      name: m.name,
      temperature: m.temperature,
      vibration: m.vibration,
      healthScore: m.healthScore,
      failureRisk: m.failureRisk,
      status: m.status
    })), null, 2)}
    
    Provide a brief JSON response with format: {"recommendations": [{"machine": "name", "action": "brief action", "priority": "high/medium/low"}], "summary": "one line summary"}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
        })
      }
    );
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (err) {
    console.error('Gemini analysis error:', err);
    return null;
  }
}

// Machine stays stopped until maintenance click

function App() {
  const [fleetData, setFleetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [motorShutdown, setMotorShutdown] = useState({});
  const [valvesClosed, setValvesClosed] = useState({});
  const [machineStopped, setMachineStopped] = useState({}); // Track stopped machines - stays stopped until maintenance
  const [stoppedAt, setStoppedAt] = useState({}); // When machine was stopped
  const [lockedMachineData, setLockedMachineData] = useState({}); // Store locked data when stopped

  // Check if machine should be stopped - CRITICAL status = immediate stop
  const shouldStopMachine = useCallback((machine) => {
    if (!machine) return false;
    // Stop immediately if status is Critical - no further data taken
    return machine.status === 'Critical';
  }, []);

  // NO auto-expire - machines stay stopped until maintenance button clicked
  // This useEffect just updates the timer display
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update timer displays
      setStoppedAt(prev => ({ ...prev }));
    }, 1000); // Update every second for timer display
    
    return () => clearInterval(interval);
  }, []);

  // Handle motor shutdown
  const handleMotorShutdown = useCallback((machineId) => {
    setMotorShutdown(prev => ({ ...prev, [machineId]: true }));
  }, []);

  // Handle valve close for gas leak
  const handleValveClose = useCallback((machineId) => {
    setValvesClosed(prev => ({ ...prev, [machineId]: true }));
  }, []);

  // Maintenance button handler - restarts machine and resumes monitoring
  const handleMaintenance = useCallback((machineId) => {
    // Clear stopped state - resume normal monitoring
    setMachineStopped(prev => {
      const updated = { ...prev };
      delete updated[machineId];
      return updated;
    });
    setStoppedAt(prev => {
      const updated = { ...prev };
      delete updated[machineId];
      return updated;
    });
    // Clear locked data
    setLockedMachineData(prev => {
      const updated = { ...prev };
      delete updated[machineId];
      return updated;
    });
    // Clear motor shutdown and valve states
    setMotorShutdown(prev => ({ ...prev, [machineId]: false }));
    setValvesClosed(prev => ({ ...prev, [machineId]: false }));
  }, []);

  // Legacy reset handler (for backwards compatibility)
  const handleReset = handleMaintenance;

  // Fetch fleet data from API
  const fetchFleetData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/fleet`);
      if (!response.ok) {
        throw new Error('Failed to fetch fleet data');
      }
      const data = await response.json();
      
      // Process machines - stopped machines show locked data
      if (data.machines) {
        const now = Date.now();
        
        const processedMachines = data.machines.map(newMachine => {
          // If machine is stopped, use locked data instead - no new data taken
          if (machineStopped[newMachine.id] && lockedMachineData[newMachine.id]) {
            return lockedMachineData[newMachine.id];
          }
          return newMachine;
        });
        
        // Check if any machine should be stopped - CRITICAL = immediate stop
        data.machines.forEach(newMachine => {
          // Skip if already stopped
          if (machineStopped[newMachine.id]) return;
          
          // Check if Critical status - stop immediately
          if (shouldStopMachine(newMachine)) {
            // Stop machine immediately - no further data updates until maintenance
            setMachineStopped(prev => ({ ...prev, [newMachine.id]: true }));
            setStoppedAt(prev => ({ ...prev, [newMachine.id]: now }));
            // Lock the current data
            setLockedMachineData(prev => ({ ...prev, [newMachine.id]: newMachine }));
            // Auto trigger motor shutdown for safety
            setMotorShutdown(prev => ({ ...prev, [newMachine.id]: true }));
          }
        });
        
        data.machines = processedMachines;
      }
      
      setFleetData(data);
      setError(null);
      
      // Run Gemini analysis periodically (reduced to save API calls)
      if (Math.random() < 0.05) { // 5% chance each refresh
        const insights = await analyzeWithGemini(data);
        if (insights) setAiInsights(insights);
      }
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
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Connecting to IoT Sensors</p>
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
            <span style={{ fontSize: '0.7rem', background: 'linear-gradient(135deg, #10b981, #3b82f6)', padding: '4px 10px', borderRadius: 16, marginLeft: 10, fontWeight: 600 }}>IoT Dashboard</span>
          </h1>
          <span className="header-meta">PS 9.4 - SDG 9: Industry Innovation</span>
        </div>
        
        <div className="header-status">
           <span className="status-indicator pulse"></span>
           <span style={{ fontWeight: 600 }}>LIVE</span> • System Online
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

        {/* AI Insights Banner */}
        {aiInsights && (
          <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>🧠</span>
              <h3 style={{ margin: 0 }}>Smart Analysis</h3>
              <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '2px 8px', borderRadius: 8 }}>AI Powered</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{aiInsights.summary}</p>
            {aiInsights.recommendations?.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {aiInsights.recommendations.map((rec, i) => (
                  <span key={i} style={{
                    padding: '4px 12px',
                    borderRadius: 16,
                    fontSize: '0.8rem',
                    background: rec.priority === 'high' ? 'rgba(239, 68, 68, 0.2)' : rec.priority === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#f59e0b' : '#10b981'
                  }}>
                    {rec.machine}: {rec.action}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3D Digital Twin Factory Scene */}
        <div style={{ marginBottom: 24 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 className="card-title">
                <span className="icon">🏭</span> Digital Twin - Factory Floor
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 12 }}>
                  Real-time IoT Visualization
                </span>
              </h3>
            </div>
            <div style={{ height: '500px' }}>
              <FactoryScene 
                machines={fleetData.machines}
                onMachineSelect={(machine) => console.log('Selected:', machine.name)}
                motorShutdown={motorShutdown}
                valvesClosed={valvesClosed}
                needsAttention={machineStopped}
                onMotorShutdown={handleMotorShutdown}
                onValveClose={handleValveClose}
                onReset={handleMaintenance}
              />
            </div>
          </div>
        </div>

        {/* Machine Stopped Alert Banner */}
        {Object.keys(machineStopped).length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.15))',
            border: '2px solid rgba(239, 68, 68, 0.6)',
            borderRadius: 16,
            padding: '20px 28px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)',
            animation: 'attentionPulse 1.5s ease-in-out infinite'
          }}>
            <div style={{ 
              width: 60, 
              height: 60, 
              background: 'linear-gradient(135deg, #dc2626, #ef4444)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              animation: 'bounce 1s infinite'
            }}>
              <span style={{ fontSize: 32 }}>🛑</span>
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, color: '#dc2626', fontSize: '1.2rem', fontWeight: 700 }}>
                🚨 {Object.keys(machineStopped).length} MACHINE(S) CRITICAL - STOPPED
              </h4>
              <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Critical error detected • Machine stopped • No further data until maintenance
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {Object.keys(machineStopped).map(id => {
                const machine = fleetData.machines.find(m => m.id === id);
                const elapsedSec = Math.floor((Date.now() - stoppedAt[id]) / 1000);
                const mins = Math.floor(elapsedSec / 60);
                const secs = elapsedSec % 60;
                return (
                  <div key={id} style={{
                    background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.4), rgba(239, 68, 68, 0.3))',
                    padding: '12px 18px',
                    borderRadius: 12,
                    border: '2px solid rgba(239, 68, 68, 0.5)',
                    textAlign: 'center',
                    minWidth: 100
                  }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{machine?.icon}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626' }}>
                      {machine?.name?.split(' ')[0]}
                    </div>
                    <div style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 700, 
                      color: '#fff',
                      background: 'rgba(0,0,0,0.3)',
                      padding: '4px 8px',
                      borderRadius: 8,
                      marginTop: 4,
                      fontFamily: 'monospace'
                    }}>
                      ⏱️ {mins}:{secs.toString().padStart(2, '0')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content Grid - Removed Risk Ranking */}
        <div className="main-content-grid" style={{ gridTemplateColumns: '1fr' }}>
          
          {/* Main Grid Area */}
          <div className="machines-grid-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.25rem' }}>Machine Fleet Status</h2>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Total Machines: {fleetData.machines.length}
              </span>
            </div>
            
            <div className="machines-grid">
              {fleetData.machines.map(machine => {
                const isStopped = !!machineStopped[machine.id];
                const elapsedSec = stoppedAt[machine.id] ? Math.floor((Date.now() - stoppedAt[machine.id]) / 1000) : 0;
                return (
                  <MachineCard 
                    key={machine.id} 
                    machine={machine}
                    isTopRisk={fleetData.topRiskMachine?.id === machine.id}
                    isShutdown={motorShutdown[machine.id]}
                    isValveClosed={valvesClosed[machine.id]}
                    isStopped={isStopped}
                    stoppedElapsedTime={elapsedSec}
                    onShutdown={() => handleMotorShutdown(machine.id)}
                    onValveClose={() => handleValveClose(machine.id)}
                    onMaintenance={() => handleMaintenance(machine.id)}
                  />
                );
              })}
            </div>

            {/* Alerts Panel */}
            <div style={{ marginTop: 24 }}>
              <AlertsPanel 
                machines={fleetData.machines} 
                motorShutdown={motorShutdown}
                valvesClosed={valvesClosed}
              />
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
