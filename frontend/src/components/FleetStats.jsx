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
      color: '#3b82f6'
    },
    {
      label: 'Avg Health Score',
      value: `${stats.avgHealthScore.toFixed(1)}%`,
      icon: '💪',
      color: stats.avgHealthScore >= 70 ? '#22c55e' : stats.avgHealthScore >= 50 ? '#eab308' : '#ef4444'
    },
    {
      label: 'Avg Failure Risk',
      value: `${stats.avgFailureRisk.toFixed(1)}%`,
      icon: '📊',
      color: stats.avgFailureRisk < 30 ? '#22c55e' : stats.avgFailureRisk < 50 ? '#eab308' : '#ef4444'
    },
    {
      label: 'Critical',
      value: stats.criticalCount,
      icon: '🚨',
      color: '#ef4444'
    },
    {
      label: 'Warning',
      value: stats.warningCount,
      icon: '⚠️',
      color: '#f97316'
    },
    {
      label: 'Healthy',
      value: stats.healthyCount,
      icon: '✅',
      color: '#22c55e'
    }
  ];

  return (
    <div className="fleet-stats" style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      borderRadius: 16,
      padding: 20,
      border: '1px solid #334155'
    }}>
      {/* Header */}
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
          📈 Fleet Overview
        </h3>
        
        {/* Connection Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12
        }}>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 12,
            background: serialConnected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            color: serialConnected ? '#22c55e' : '#3b82f6',
            fontWeight: 500
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: serialConnected ? '#22c55e' : '#3b82f6',
              animation: 'pulse 2s infinite'
            }}></span>
            {serialConnected ? '📡 Live Sensor' : '💻 Simulation Mode'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 12
      }}>
        {statCards.map((stat, index) => (
          <div
            key={index}
            style={{
              background: '#0f172a',
              borderRadius: 10,
              padding: 14,
              textAlign: 'center',
              border: '1px solid #1e293b',
              transition: 'transform 0.2s ease'
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 6 }}>{stat.icon}</div>
            <div style={{
              fontSize: 20,
              fontWeight: 700,
              color: stat.color,
              marginBottom: 4
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: 10,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FleetStats;
