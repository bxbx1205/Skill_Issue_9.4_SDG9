import { motion, AnimatePresence } from 'framer-motion';
import './AlertsPanel.css';

function AlertsPanel({ alerts }) {
  return (
    <div className="alerts-panel">
      <div className="panel-header">
        <h2 className="panel-title">ACTIVE ALERTS</h2>
        <span className="alert-count numeric">{alerts.length}</span>
      </div>
      
      <div className="alerts-list">
        <AnimatePresence>
          {alerts.length === 0 ? (
            <motion.div 
              className="no-alerts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="no-alerts-icon">✓</div>
              <p>All systems operational</p>
            </motion.div>
          ) : (
            alerts.map((alert, index) => (
              <motion.div
                key={`${alert.timestamp}-${index}`}
                className={`alert-item severity-${alert.severity.toLowerCase()}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="alert-icon">
                  {alert.severity === 'CRITICAL' ? '⚠' : '⚡'}
                </div>
                <div className="alert-content">
                  <div className="alert-machine">{alert.machineId}</div>
                  <div className="alert-message">{alert.message}</div>
                  <div className="alert-time numeric">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AlertsPanel;
