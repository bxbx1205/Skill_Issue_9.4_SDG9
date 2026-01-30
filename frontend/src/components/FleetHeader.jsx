import { motion } from 'framer-motion';
import './FleetHeader.css';

function FleetHeader({ machineCount, avgHealth, criticalCount, warningCount, timestamp }) {
  const formatTimestamp = (iso) => {
    const date = new Date(iso);
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  return (
    <header className="fleet-header">
      <div className="container">
        <div className="header-content">
          {/* Title & System Info */}
          <motion.div 
            className="header-left"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="system-title">
              <span className="title-main">FLEET MONITOR</span>
              <span className="title-sub">PREDICTIVE MAINTENANCE SYSTEM</span>
            </h1>
            <div className="system-info">
              <span className="info-item">
                <span className="info-label">ACTIVE MACHINES</span>
                <span className="info-value numeric">{machineCount}</span>
              </span>
              <span className="info-divider">|</span>
              <span className="info-item">
                <span className="info-label">TIMESTAMP</span>
                <span className="info-value numeric">{formatTimestamp(timestamp)}</span>
              </span>
            </div>
          </motion.div>

          {/* Fleet Health Metrics */}
          <motion.div 
            className="header-right"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="fleet-metrics">
              <div className="metric">
                <div className="metric-label">FLEET HEALTH</div>
                <div className={`metric-value numeric ${avgHealth < 60 ? 'text-red' : avgHealth < 80 ? 'text-amber' : 'text-green'}`}>
                  {avgHealth}%
                </div>
              </div>
              
              {criticalCount > 0 && (
                <div className="metric metric-critical">
                  <div className="metric-label">CRITICAL</div>
                  <div className="metric-value numeric text-red">{criticalCount}</div>
                </div>
              )}
              
              {warningCount > 0 && (
                <div className="metric metric-warning">
                  <div className="metric-label">WARNING</div>
                  <div className="metric-value numeric text-amber">{warningCount}</div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Bottom border effect */}
      <div className="header-border"></div>
    </header>
  );
}

export default FleetHeader;
