/**
 * Machine Card Component
 * Displays individual machine status with gauges
 */

import React from 'react';
import GaugeChart from './GaugeChart';

const MachineCard = ({ machine, isTopRisk = false }) => {
  const getStatusClass = (status) => {
    switch(status) {
      case 'Critical': return 'status-critical';
      case 'Warning': return 'status-warning';
      case 'Caution': return 'status-caution';
      default: return 'status-healthy';
    }
  };

  const statusClass = getStatusClass(machine.status);

  return (
    <div className={`card machine-card ${isTopRisk ? 'risk-critical' : ''}`}>
      {/* Top Risk Badge */}
      {isTopRisk && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'rgba(239, 68, 68, 0.9)',
          color: 'white',
          padding: '4px 10px',
          borderRadius: 12,
          fontSize: '0.7rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
          zIndex: 10
        }}>
          🏆 TOP RISK
        </div>
      )}
      
      {/* Header */}
      <div className="machine-header">
        <div className="machine-icon">
          {machine.icon}
        </div>
        <div className="machine-info">
          <h3>{machine.name}</h3>
          <div className="machine-meta">
            <span className="machine-type">{machine.type}</span>
            <span>•</span>
            <span style={{ 
              color: machine.dataSource === 'Real Sensor' ? 'var(--color-success)' : 'var(--color-info)',
              fontWeight: 500
            }}>
              {machine.dataSource === 'Real Sensor' ? '📡 Live' : '💻 Sim'}
            </span>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`machine-status-badge ${statusClass}`} style={{ marginBottom: 16 }}>
        <span className={`status-dot ${machine.status === 'Critical' ? 'pulse' : ''}`}></span>
        {machine.status}
      </div>

      {/* Gauges Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        marginBottom: 20
      }}>
        <GaugeChart
          value={machine.temperature}
          min={0}
          max={100}
          label="Temp"
          unit="°C"
          size={100}
        />
        <GaugeChart
          value={machine.healthScore}
          min={0}
          max={100}
          label="Health"
          unit="%"
          size={100}
          reverseColors={true}
        />
        <GaugeChart
          value={machine.failureRisk}
          min={0}
          max={100}
          label="Risk"
          unit="%"
          size={100}
        />
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 8,
        padding: 12
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Vibration</div>
          <div style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: machine.vibration === 1 ? 'var(--color-danger)' : 'var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}>
            {machine.vibration === 1 ? 'Detect' : 'Normal'}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Updated</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {new Date(machine.lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', second:'2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachineCard;
