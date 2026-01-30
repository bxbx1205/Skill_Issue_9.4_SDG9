/**
 * Event Logs Component
 * Displays last 5 anomaly logs with time, machine, event, and severity
 */

import React from 'react';

const EventLogs = ({ logs }) => {
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return { bg: '#7f1d1d', text: '#fecaca', icon: '🚨' };
      case 'WARNING':
        return { bg: '#713f12', text: '#fef08a', icon: '⚠️' };
      case 'INFO':
        return { bg: '#1e3a5f', text: '#93c5fd', icon: 'ℹ️' };
      default:
        return { bg: '#374151', text: '#d1d5db', icon: '📋' };
    }
  };

  return (
    <div className="event-logs" style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      borderRadius: 16,
      padding: 20,
      border: '1px solid #334155'
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
          📋 Event Logs
        </h3>
        <span style={{
          color: '#64748b',
          fontSize: 12
        }}>
          Last 5 events
        </span>
      </div>

      {logs.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 30,
          color: '#64748b',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: 36, marginBottom: 8 }}>📭</span>
          <p style={{ margin: 0, fontSize: 14 }}>No events logged yet</p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#475569' }}>
            Events will appear when anomalies are detected
          </p>
        </div>
      ) : (
        <div style={{ 
          overflowX: 'auto',
          borderRadius: 10,
          border: '1px solid #334155'
        }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: 13
          }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                <th style={{ 
                  padding: '12px 14px', 
                  textAlign: 'left', 
                  color: '#94a3b8',
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Time
                </th>
                <th style={{ 
                  padding: '12px 14px', 
                  textAlign: 'left', 
                  color: '#94a3b8',
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Machine
                </th>
                <th style={{ 
                  padding: '12px 14px', 
                  textAlign: 'left', 
                  color: '#94a3b8',
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Event
                </th>
                <th style={{ 
                  padding: '12px 14px', 
                  textAlign: 'center', 
                  color: '#94a3b8',
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Severity
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => {
                const severityStyle = getSeverityStyle(log.severity);
                return (
                  <tr 
                    key={log.id}
                    style={{ 
                      background: index % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.5)',
                      borderTop: '1px solid #1e293b'
                    }}
                  >
                    <td style={{ 
                      padding: '12px 14px',
                      color: '#94a3b8',
                      whiteSpace: 'nowrap'
                    }}>
                      {log.timeFormatted}
                    </td>
                    <td style={{ 
                      padding: '12px 14px',
                      color: '#f8fafc',
                      fontWeight: 500
                    }}>
                      {log.machine}
                    </td>
                    <td style={{ 
                      padding: '12px 14px',
                      color: '#cbd5e1',
                      maxWidth: 300,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {log.event}
                    </td>
                    <td style={{ 
                      padding: '12px 14px',
                      textAlign: 'center'
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: severityStyle.bg,
                        color: severityStyle.text,
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600
                      }}>
                        {severityStyle.icon} {log.severity}
                      </span>
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
