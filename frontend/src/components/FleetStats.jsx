/**
 * Fleet Statistics Component
 * Displays overall fleet health metrics
 */

import React from 'react';

const FleetStats = ({ stats, simulationMode, serialConnected }) => {
  const statCards = [
    {
      label: 'Total Machines',
      value: stats.totalMachines,
      icon: '🏭',
      color: 'var(--color-info)'
    },
    {
      label: 'Avg Health Score',
      value: `${stats.avgHealthScore.toFixed(1)}%`,
      icon: '💪',
      color: stats.avgHealthScore >= 70 ? 'var(--color-success)' : stats.avgHealthScore >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'
    },
    {
      label: 'Avg Failure Risk',
      value: `${stats.avgFailureRisk.toFixed(1)}%`,
      icon: '📊',
      color: stats.avgFailureRisk < 30 ? 'var(--color-success)' : stats.avgFailureRisk < 50 ? 'var(--color-warning)' : 'var(--color-danger)'
    }
  ];

  const statusCounts = [
    { label: 'Critical', value: stats.criticalCount, color: 'var(--color-danger)', icon: '🚨' },
    { label: 'Warning', value: stats.warningCount, color: 'var(--color-warning)', icon: '⚠️' },
    { label: 'Healthy', value: stats.healthyCount, color: 'var(--color-success)', icon: '✅' }
  ];

  return (
    <div className="card fleet-stats">
      <div className="card-header">
        <h3 className="card-title">
          <span className="icon">📈</span> Fleet Overview
        </h3>
        
        {/* Connection Status */}
        <div className="header-status">
            <span className={`status-indicator ${!serialConnected ? 'simulation' : ''} pulse`}></span>
            {serialConnected ? 'Live Sensor' : 'Simulation Mode'}
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} style={{
            background: 'var(--bg-app)',
            padding: 16,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            border: '1px solid var(--border-subtle)'
          }}>
            <span style={{ fontSize: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 'var(--radius-sm)' }}>
              {stat.icon}
            </span>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: stat.color }}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
         {statusCounts.map((item, idx) => (
           <div key={idx} style={{
             textAlign: 'center',
             padding: '8px',
             background: 'rgba(255,255,255,0.02)',
             borderRadius: 'var(--radius-sm)',
             borderTop: `2px solid ${item.color}`
           }}>
             <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</div>
             <div style={{ fontSize: '0.75rem', color: item.color, fontWeight: 500 }}>{item.label}</div>
           </div>
         ))}
      </div>
    </div>
  );
};

export default FleetStats;
