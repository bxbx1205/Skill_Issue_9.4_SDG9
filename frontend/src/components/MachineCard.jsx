/**
 * Machine Card Component
 * Displays individual machine status with gauges
 */

import React from 'react';
import GaugeChart from './GaugeChart';

const MachineCard = ({ machine, isTopRisk = false }) => {
  const getStatusBadgeStyle = (status) => {
    const colors = {
      'Critical': { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
      'Warning': { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
      'Caution': { bg: '#fefce8', text: '#ca8a04', border: '#fef08a' },
      'Healthy': { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' }
    };
    return colors[status] || colors['Healthy'];
  };

  const statusStyle = getStatusBadgeStyle(machine.status);

  return (
    <div className={`machine-card ${isTopRisk ? 'top-risk' : ''}`} style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      borderRadius: 16,
      padding: 20,
      border: isTopRisk ? '2px solid #ef4444' : '1px solid #334155',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}>
      {/* Top Risk Badge */}
      {isTopRisk && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: 'white',
          padding: '4px 10px',
          borderRadius: 12,
          fontSize: 11,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
        }}>
          🏆 TOP RISK
        </div>
      )}
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 32, marginRight: 12 }}>{machine.icon}</span>
        <div>
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: 18, fontWeight: 600 }}>
            {machine.name}
          </h3>
          <span style={{ 
            fontSize: 12, 
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            {machine.type} • 
            <span style={{ 
              color: machine.dataSource === 'Real Sensor' ? '#22c55e' : '#3b82f6',
              fontWeight: 500
            }}>
              {machine.dataSource === 'Real Sensor' ? '📡 Live' : '💻 Simulated'}
            </span>
          </span>
        </div>
      </div>

      {/* Status Badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: statusStyle.bg,
        color: statusStyle.text,
        padding: '6px 12px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        marginBottom: 16,
        border: `1px solid ${statusStyle.border}`
      }}>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: statusStyle.text,
          animation: machine.status === 'Critical' ? 'pulse 1s infinite' : 'none'
        }}></span>
        {machine.status}
      </div>

      {/* Gauges Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        marginBottom: 16
      }}>
        <GaugeChart
          value={machine.temperature}
          min={0}
          max={100}
          label="Temperature"
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
        gap: 10,
        background: '#0f172a',
        borderRadius: 10,
        padding: 12
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Vibration</div>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: machine.vibration === 1 ? '#ef4444' : '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4
          }}>
            {machine.vibration === 1 ? '⚠️ Detected' : '✓ Normal'}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Last Update</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>
            {new Date(machine.lastUpdate).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachineCard;
