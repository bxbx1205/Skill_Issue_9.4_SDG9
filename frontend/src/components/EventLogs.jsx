/**
 * Event Logs Component
 * Displays last 5 anomaly logs with time, machine, event, and severity
 */

import React from 'react';

const EventLogs = ({ logs }) => {
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return { color: 'var(--color-danger)', icon: '🚨' };
      case 'WARNING':
        return { color: 'var(--color-warning)', icon: '⚠️' };
      case 'INFO':
        return { color: 'var(--color-info)', icon: 'ℹ️' };
      default:
        return { color: 'var(--text-muted)', icon: '📋' };
    }
  };

  return (
    <div className="card event-logs" style={{ marginTop: 24 }}>
      <div className="card-header">
        <h3 className="card-title">
          <span className="icon">📋</span> Event Logs
        </h3>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          Last {logs.length} events
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <p style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>No events logged</p>
          <p style={{ fontSize: '0.75rem' }}>Anomalies will appear here</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Time</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Machine</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Severity</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => {
                const style = getSeverityStyle(log.severity);
                return (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 500 }}>{log.machineName}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        color: style.color, fontWeight: 600,
                        background: `rgba(${style.color === 'var(--color-danger)' ? '239, 68, 68' : '245, 158, 11'}, 0.1)`,
                        padding: '4px 8px', borderRadius: '4px'
                      }}>
                        {style.icon} {log.severity}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                      {log.message}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EventLogs;
