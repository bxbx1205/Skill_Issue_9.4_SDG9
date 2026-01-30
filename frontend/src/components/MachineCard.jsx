/**
 * Machine Card Component
 * Displays individual machine status with gauges and control actions
 * Each machine is controlled by a specific IoT sensor:
 * - VIB sensor → Vibration Motor
 * - TEMP sensor → Thermal Pump
 * - HUM sensor → Humidity Controller
 * - GAS sensor → Gas Detector
 */

import React from 'react';
import GaugeChart from './GaugeChart';

const MachineCard = ({ 
  machine, 
  isTopRisk = false,
  isShutdown = false,
  isValveClosed = false,
  isStopped = false,
  stoppedElapsedTime = 0,
  onShutdown = () => {},
  onValveClose = () => {},
  onMaintenance = () => {}
}) => {
  const getStatusClass = (status) => {
    switch(status) {
      case 'Critical': return 'status-critical';
      case 'Warning': return 'status-warning';
      case 'Caution': return 'status-caution';
      default: return 'status-healthy';
    }
  };

  // Sensor-specific checks
  const isGasSensor = machine.sensorType === 'GAS';
  const hasGasLeak = isGasSensor && machine.gasLevel > 300;
  const isCriticalLeak = isGasSensor && machine.gasLevel > 500;
  
  const isCritical = machine.failureRisk >= 70 || machine.status === 'Critical';
  const isWarning = machine.failureRisk >= 50 || machine.status === 'Warning';
  const needsMaintenance = isCritical || hasGasLeak;

  const statusClass = getStatusClass(machine.status);

  // Format sensor value based on type
  const getSensorValueDisplay = () => {
    if (machine.sensorValue === undefined) return 'N/A';
    switch(machine.sensorType) {
      case 'TEMP': return `${machine.sensorValue?.toFixed(1)}°C`;
      case 'HUM': return `${machine.sensorValue?.toFixed(1)}%`;
      case 'GAS': return `${machine.sensorValue?.toFixed(0)} ppm`;
      case 'VIB': return machine.sensorValue?.toFixed(2);
      default: return machine.sensorValue?.toFixed(2);
    }
  };

  const getSensorIcon = () => {
    switch(machine.sensorType) {
      case 'TEMP': return '🌡️';
      case 'HUM': return '💧';
      case 'GAS': return '🔥';
      case 'VIB': return '📳';
      default: return '📡';
    }
  };

  // Format elapsed time as mm:ss
  const formatElapsedTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`card machine-card ${isTopRisk ? 'risk-critical' : ''} ${isShutdown ? 'shutdown-mode' : ''} ${isStopped ? 'machine-stopped' : ''}`}
      style={{
        ...(isShutdown || isStopped ? { opacity: 0.85, borderColor: '#dc2626', borderWidth: 2 } : {}),
        ...(isStopped ? { 
          boxShadow: '0 0 25px rgba(220, 38, 38, 0.4)',
          animation: 'attentionPulse 1.5s infinite'
        } : {})
      }}>
      
      {/* Machine Stopped Banner - Requires Maintenance */}
      {isStopped && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(90deg, #dc2626, #ef4444, #dc2626)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s linear infinite',
          color: 'white',
          padding: '10px 16px',
          fontSize: '0.85rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: '12px 12px 0 0',
          zIndex: 15,
          boxShadow: '0 4px 15px rgba(220, 38, 38, 0.5)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.1rem' }}>🛑</span>
            MACHINE STOPPED
          </span>
          <span style={{ 
            background: 'rgba(0,0,0,0.4)', 
            padding: '5px 14px', 
            borderRadius: 12,
            fontSize: '0.9rem',
            fontFamily: 'monospace',
            minWidth: 60,
            textAlign: 'center'
          }}>
            ⏱️ {formatElapsedTime(stoppedElapsedTime)}
          </span>
        </div>
      )}
      
      {/* Top Risk Badge */}
      {isTopRisk && !isShutdown && !isStopped && (
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

      {/* Shutdown Badge */}
      {isShutdown && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'rgba(107, 114, 128, 0.9)',
          color: 'white',
          padding: '4px 10px',
          borderRadius: 12,
          fontSize: '0.7rem',
          fontWeight: 600,
          zIndex: 10
        }}>
          🔧 MAINTENANCE
        </div>
      )}
      
      {/* Header */}
      <div className="machine-header">
        <div className="machine-icon" style={isShutdown ? { filter: 'grayscale(100%)' } : {}}>
          {machine.icon}
        </div>
        <div className="machine-info">
          <h3>{machine.name}</h3>
          <div className="machine-meta">
            <span className="machine-type">{machine.type}</span>
            <span>•</span>
            <span style={{ 
              color: 'var(--color-info)',
              fontWeight: 500
            }}>
              {getSensorIcon()} {machine.sensorType || 'IoT'}
            </span>
          </div>
        </div>
      </div>

      {/* Sensor Value Display */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.1))',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: 8,
        padding: '10px 12px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {getSensorIcon()} Sensor Value
        </span>
        <span style={{ 
          fontSize: '1.1rem', 
          fontWeight: 700, 
          color: isCritical ? '#ef4444' : isWarning ? '#f97316' : '#22c55e',
          fontFamily: 'var(--font-mono)'
        }}>
          {getSensorValueDisplay()}
        </span>
      </div>

      {/* Status Badge */}
      <div className={`machine-status-badge ${isShutdown ? 'status-shutdown' : statusClass}`} style={{ marginBottom: 16 }}>
        <span className={`status-dot ${machine.status === 'Critical' && !isShutdown ? 'pulse' : ''}`}
          style={isShutdown ? { background: '#6b7280' } : {}}></span>
        {isShutdown ? 'Shutdown' : machine.status}
      </div>

      {/* Alert Banners */}
      {!isShutdown && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {isCritical && !isGasSensor && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: 8,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8
            }}>
              <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>
                ⚠️ {machine.sensorType} Sensor Critical!
              </span>
              <button
                onClick={onShutdown}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: 6,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                SHUTDOWN
              </button>
            </div>
          )}
          
          {/* Gas Leak Alert for GAS sensor */}
          {hasGasLeak && !isValveClosed && (
            <div style={{
              background: isCriticalLeak 
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))'
                : 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.2))',
              border: `1px solid ${isCriticalLeak ? 'rgba(239, 68, 68, 0.5)' : 'rgba(249, 115, 22, 0.5)'}`,
              borderRadius: 8,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8
            }}>
              <span style={{ fontSize: '0.8rem', color: isCriticalLeak ? '#ef4444' : '#f97316', fontWeight: 600 }}>
                🔥 {isCriticalLeak ? 'CRITICAL GAS LEAK!' : 'Gas Leak Detected!'}
              </span>
              <button
                onClick={onValveClose}
                style={{
                  background: isCriticalLeak ? '#ef4444' : '#f97316',
                  color: 'white',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: 6,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                CLOSE VALVE
              </button>
            </div>
          )}

          {isValveClosed && isGasSensor && (
            <div style={{
              background: 'rgba(107, 114, 128, 0.2)',
              border: '1px solid rgba(107, 114, 128, 0.5)',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: '0.8rem',
              color: '#9ca3af'
            }}>
              ✓ Gas valve closed for safety
            </div>
          )}

          {isWarning && !isCritical && !isGasSensor && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.2))',
              border: '1px solid rgba(249, 115, 22, 0.5)',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: '0.8rem',
              color: '#f97316',
              fontWeight: 500
            }}>
              ⚠️ {machine.sensorType} levels elevated - Monitor closely
            </div>
          )}
        </div>
      )}

      {/* Gauges Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        marginBottom: 20,
        opacity: isShutdown ? 0.5 : 1
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
            {machine.vibration === 1 ? '⚠️ Detect' : '✓ Normal'}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Updated</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {new Date(machine.lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', second:'2-digit' })}
          </div>
        </div>
      </div>

      {/* Reset Button for Shutdown Mode */}
      {isShutdown && (
        <button
          onClick={onReset}
          style={{
            width: '100%',
            marginTop: 16,
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: 8,
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          🔄 Reset & Restart Machine
        </button>
      )}

      {/* Maintenance Button - Machine Stopped State */}
      {isStopped && (
        <button
          onClick={onMaintenance}
          style={{
            width: '100%',
            marginTop: 16,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none',
            padding: '14px 18px',
            borderRadius: 12,
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
            transition: 'all 0.2s ease',
            animation: 'bounce 2s infinite'
          }}
        >
          🔧 PERFORM MAINTENANCE & RESTART
        </button>
      )}
    </div>
  );
};

export default MachineCard;
