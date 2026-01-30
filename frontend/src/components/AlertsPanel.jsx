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

  const getAlertStyle = (status) => {
    switch (status) {
      case 'Critical':
        return {
          bg: 'linear-gradient(135deg, #450a0a, #7f1d1d)',
          border: '#ef4444',
          icon: '🚨',
          pulse: true
        };
      case 'Warning':
        return {
          bg: 'linear-gradient(135deg, #431407, #7c2d12)',
          border: '#f97316',
          icon: '⚠️',
          pulse: false
        };
      case 'Caution':
        return {
          bg: 'linear-gradient(135deg, #422006, #713f12)',
          border: '#eab308',
          icon: '⚡',
          pulse: false
        };
      default:
        return {
          bg: '#1e293b',
          border: '#334155',
          icon: 'ℹ️',
          pulse: false
        };
    }
  };

  return (
    <div className="alerts-panel" style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      borderRadius: 16,
      padding: 20,
      border: '1px solid #334155',
      height: '100%'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16
      }}>
        <h3 style={{ 
          margin: 0, 
          color: '#f8fafc', 
          fontSize: 16, 
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          🔔 Active Alerts
        </h3>
        <span style={{
          background: alertMachines.length > 0 ? '#ef4444' : '#22c55e',
          color: 'white',
          padding: '4px 10px',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600
        }}>
          {alertMachines.length} Active
        </span>
      </div>

      {alertMachines.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 30,
          color: '#64748b',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: 40, marginBottom: 12 }}>✅</span>
          <p style={{ margin: 0, fontSize: 14 }}>All systems operating normally</p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#475569' }}>No active warnings</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alertMachines.map((machine) => {
            const alertStyle = getAlertStyle(machine.status);
            return (
              <div
                key={machine.id}
                style={{
                  background: alertStyle.bg,
                  border: `1px solid ${alertStyle.border}`,
                  borderRadius: 12,
                  padding: 14,
                  animation: alertStyle.pulse ? 'alertPulse 2s infinite' : 'none'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span style={{ fontSize: 20 }}>{alertStyle.icon}</span>
                    <span style={{ 
                      color: '#f8fafc', 
                      fontWeight: 600,
                      fontSize: 14
                    }}>
                      {machine.name}
                    </span>
                  </div>
                  <span style={{
                    background: alertStyle.border,
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    {machine.status}
                  </span>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  fontSize: 12
                }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Temp: </span>
                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                      {machine.temperature.toFixed(1)}°C
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Health: </span>
                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                      {machine.healthScore.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Risk: </span>
                    <span style={{ 
                      color: machine.failureRisk >= 70 ? '#ef4444' : '#f8fafc', 
                      fontWeight: 600 
                    }}>
                      {machine.failureRisk.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {machine.vibration === 1 && (
                  <div style={{
                    marginTop: 8,
                    padding: '6px 10px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    borderRadius: 6,
                    fontSize: 11,
                    color: '#fca5a5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    📳 Abnormal vibration detected
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;
