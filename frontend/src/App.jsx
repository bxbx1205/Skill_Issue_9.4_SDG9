import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MachineCard from './components/MachineCard';
import AlertsPanel from './components/AlertsPanel';
import EventLog from './components/EventLog';
import FleetHeader from './components/FleetHeader';
import './App.css';

const API_URL = 'http://localhost:3000/api/fleet';

function App() {
  const [fleetData, setFleetData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFleetData = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch fleet data');
        const data = await response.json();
        setFleetData(data);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchFleetData();

    // Poll every 2 seconds for real-time updates
    const interval = setInterval(fetchFleetData, 2000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p className="loading-text">INITIALIZING FLEET MONITOR...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-icon">⚠</div>
        <h2>CONNECTION LOST</h2>
        <p>{error}</p>
        <p className="error-hint">Ensure backend server is running on port 3000</p>
      </div>
    );
  }

  const machines = fleetData?.machines || [];
  const alerts = fleetData?.alerts || [];
  const events = fleetData?.recentEvents || [];

  // Calculate fleet health statistics
  const avgHealth = machines.length > 0 
    ? Math.round(machines.reduce((sum, m) => sum + m.healthScore, 0) / machines.length)
    : 0;
  
  const criticalCount = machines.filter(m => m.status === 'CRITICAL').length;
  const warningCount = machines.filter(m => m.status === 'WARNING').length;

  return (
    <div className="app">
      <FleetHeader 
        machineCount={machines.length}
        avgHealth={avgHealth}
        criticalCount={criticalCount}
        warningCount={warningCount}
        timestamp={fleetData?.timestamp}
      />

      <div className="container">
        <div className="main-grid">
          {/* Machine Cards Grid */}
          <div className="machines-grid">
            {machines.map((machine, index) => (
              <motion.div
                key={machine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  ease: [0.25, 0.1, 0.25, 1]
                }}
              >
                <MachineCard machine={machine} />
              </motion.div>
            ))}
          </div>

          {/* Sidebar: Alerts & Logs */}
          <div className="sidebar">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <AlertsPanel alerts={alerts} />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <EventLog events={events} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
