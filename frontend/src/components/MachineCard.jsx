import { motion } from 'framer-motion';
import Gauge from './Gauge';
import './MachineCard.css';

function MachineCard({ machine }) {
  const {
    id,
    name,
    location,
    temperature,
    vibration,
    healthScore,
    riskPercent,
    status,
    isReal
  } = machine;

  // Determine status styling
  const statusClass = status === 'CRITICAL' ? 'badge-critical' :
                      status === 'WARNING' ? 'badge-warning' :
                      'badge-operational';

  return (
    <motion.div 
      className={`machine-card status-${status.toLowerCase()}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="card-header">
        <div className="card-title-section">
          <h3 className="card-title">{name}</h3>
          <div className="card-meta">
            <span className="machine-id numeric">{id}</span>
            <span className="meta-divider">•</span>
            <span className="machine-location">{location}</span>
            {isReal && (
              <>
                <span className="meta-divider">•</span>
                <span className="sensor-indicator">⚡ LIVE</span>
              </>
            )}
          </div>
        </div>
        <span className={`badge ${statusClass}`}>{status}</span>
      </div>

      {/* Sensor Readings */}
      <div className="sensor-readings">
        <div className="reading">
          <div className="reading-label">TEMPERATURE</div>
          <div className="reading-value">
            <span className="numeric">{temperature.toFixed(1)}</span>
            <span className="reading-unit">°C</span>
          </div>
          <div className="reading-bar">
            <div 
              className="reading-bar-fill temperature"
              style={{ 
                width: `${Math.min((temperature / 50) * 100, 100)}%`,
                background: temperature > 40 ? 'var(--red-500)' : 
                           temperature > 30 ? 'var(--amber-400)' : 
                           'var(--green-500)'
              }}
            ></div>
          </div>
        </div>

        <div className="reading">
          <div className="reading-label">VIBRATION</div>
          <div className="reading-value">
            <span className="numeric">{vibration === 1 ? 'ACTIVE' : 'NOMINAL'}</span>
          </div>
          <div className="vibration-indicator">
            {vibration === 1 ? (
              <motion.div 
                className="vib-active"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                ⚠
              </motion.div>
            ) : (
              <div className="vib-nominal">✓</div>
            )}
          </div>
        </div>
      </div>

      {/* Gauges Grid */}
      <div className="gauges-grid">
        <Gauge 
          value={healthScore}
          max={100}
          label="HEALTH SCORE"
          unit="%"
          color={healthScore < 30 ? 'red' : healthScore < 60 ? 'amber' : 'green'}
        />
        <Gauge 
          value={riskPercent}
          max={100}
          label="FAILURE RISK"
          unit="%"
          color={riskPercent > 70 ? 'red' : riskPercent > 40 ? 'amber' : 'green'}
          inverted
        />
      </div>
    </motion.div>
  );
}

export default MachineCard;
