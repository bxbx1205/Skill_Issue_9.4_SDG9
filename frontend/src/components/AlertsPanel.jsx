/**
 * Alerts Panel Component
 * Displays real-time warning alerts when machines enter danger zone
 */

import React from 'react';

const AlertsPanel = ({ machines }) => {
  // Filter machines with warning or critical status
  const alertMachines = machines.filter(
    m => m.status === 'Critical' || m.status === 'Warning' || m.status === 'Caution'
  );

  const getAlertClass = (status) => {
    switch (status) {
      case 'Critical': return 'critical';
      case 'Warning': return 'warning';
      default: return '';
    }
  };

  return (
    <div className="card alerts-panel">
      <div className="card-header">
        <h3 className="card-title">
          <span className="icon">🔔</span> Active Alerts
        </h3>
        <span className="header-status" style={{
          background: alertMachines.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
          color: alertMachines.length > 0 ? 'var(--color-danger)' : 'var(--color-success)',
          border: 'none'
        }}>
          {alertMachines.length} Active
        </span>
      </div>

      {alertMachines.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">✅</span>
          <p style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>All systems normal</p>
          <p style={{ fontSize: '0.75rem' }}>No active warnings detected</p>
        </div>
      ) : (
        <div className="alerts-list">
          {alertMachines.map((machine) => (
            <div key={machine.id} className={`alert-item ${getAlertClass(machine.status)}`}>
              <div className="alert-icon">
                {machine.status === 'Critical' ? '🚨' : '⚠️'}
              </div>
              <div className="alert-content">
                <h4>{machine.name} - {machine.status}</h4>
                <p>High failure risk detected. Check sensors.</p>
                <span className="alert-time">
                  {new Date(machine.lastUpdate).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;
