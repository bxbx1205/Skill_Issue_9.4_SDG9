/**
 * Production-Grade 3D Industrial Monitoring Environment
 * =====================================================
 * Industry 4.0 / Predictive Maintenance Visualization System
 * 
 * Architecture:
 * - Modular Three.js components via React Three Fiber
 * - Real-time sensor data binding
 * - Anomaly visualization with color, motion, particles, glow
 * - Three camera modes: Control Room, First-Person, Drone
 * - PBR materials with industrial aesthetics
 * 
 * @author Industrial Digital Twin Architect
 * @version 2.0.0
 */

import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as THREE from 'three';

// Import modular components
import { 
  CAMERA_MODES, 
  MACHINE_CONFIGS, 
  STATUS, 
  STATUS_COLORS,
  FACTORY_BOUNDS 
} from './factory/constants';

import {
  VibrationMotor,
  ThermalPump,
  HeatExchanger,
  HumidityController,
  AirCompressor,
  GasDetector,
  IndustrialMotor,
  getStatusFromData
} from './factory/EntityFactory';

import {
  AlertRing,
  MachineHighlight,
  AmbientDust
} from './factory/EffectsSystem';

import {
  ControlRoomCamera,
  FirstPersonController,
  DroneController,
  DroneModel
} from './factory/CameraSystem';

import {
  FactoryFloor,
  FactoryWalls,
  StorageTanks,
  IndustrialLighting,
  PipelineNetwork
} from './factory/Environment';

// ============================================
// MACHINE WRAPPER COMPONENT
// Binds sensor data to machine entities
// ============================================
function MachineEntity({ 
  machineId, 
  config, 
  machineData, 
  isSelected,
  isShutdown,
  onSelect,
  onShutdown
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef();
  const highlightRef = useRef();
  
  // Determine status from sensor data
  const status = useMemo(() => {
    if (isShutdown) return STATUS.OFFLINE;
    return getStatusFromData(machineData, config.sensorType);
  }, [machineData, config.sensorType, isShutdown]);
  
  const colors = STATUS_COLORS[status];
  const isCritical = status === STATUS.CRITICAL;
  const isWarning = status === STATUS.WARNING;
  const needsAttention = isCritical || isWarning;
  
  // Get the appropriate machine component
  const MachineComponent = useMemo(() => {
    const componentMap = {
      'vibration-motor': VibrationMotor,
      'industrial-motor': IndustrialMotor,
      'thermal-pump': ThermalPump,
      'heat-exchanger': HeatExchanger,
      'humidity-controller': HumidityController,
      'air-compressor': AirCompressor,
      'gas-detector': GasDetector
    };
    return componentMap[config.type] || IndustrialMotor;
  }, [config.type]);

  // Pulsing highlight for at-risk machines
  useFrame((state) => {
    if (highlightRef.current && needsAttention && !isShutdown) {
      const t = state.clock.getElapsedTime();
      const pulse = isCritical 
        ? 0.4 + Math.sin(t * 6) * 0.3  // Fast pulse for critical
        : 0.3 + Math.sin(t * 3) * 0.2;  // Slower pulse for warning
      highlightRef.current.material.opacity = pulse;
    }
  });

  // Highlight color based on status - PURE YELLOW and RED
  const highlightColor = isCritical ? '#ff0000' : isWarning ? '#ffff00' : '#3b82f6';

  return (
    <group
      ref={groupRef}
      position={config.position}
      rotation={config.rotation || [0, 0, 0]}
      scale={config.scale || 1}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); onSelect(machineId, machineData); }}
    >
      {/* FULL OBJECT HIGHLIGHT BOX for at-risk machines */}
      {needsAttention && !isShutdown && (
        <mesh ref={highlightRef} position={[0, 0.5, 0]}>
          <boxGeometry args={[2.5, 2, 2]} />
          <meshBasicMaterial 
            color={highlightColor} 
            transparent 
            opacity={0.5} 
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
      
      {/* Glowing outline for at-risk machines */}
      {needsAttention && !isShutdown && (
        <lineSegments position={[0, 0.5, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(2.6, 2.1, 2.1)]} />
          <lineBasicMaterial color={highlightColor} linewidth={3} transparent opacity={1} toneMapped={false} />
        </lineSegments>
      )}
      
      {/* Machine geometry */}
      <MachineComponent 
        status={status}
        machineData={machineData}
        isShutdown={isShutdown}
      />
      
      {/* Platform base */}
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[2, 0.04, 1.5]} />
        <meshStandardMaterial 
          color={needsAttention ? highlightColor : '#5a6577'} 
          roughness={0.8}
          emissive={needsAttention ? highlightColor : '#000'}
          emissiveIntensity={needsAttention ? 0.5 : 0}
        />
      </mesh>
      
      {/* Simplified alert effects - only ring for critical */}
      {isCritical && !isShutdown && (
        <AlertRing 
          position={config.position} 
          color={highlightColor}
          maxRadius={3}
          speed={2}
        />
      )}
      
      {/* Point light glow for at-risk machines */}
      {needsAttention && !isShutdown && (
        <pointLight 
          color={highlightColor} 
          intensity={isCritical ? 5 : 3} 
          distance={8} 
          position={[0, 1.5, 0]}
        />
      )}
      
      {/* Selection/hover highlight */}
      {(isSelected || hovered) && !needsAttention && (
        <MachineHighlight 
          position={[0, 0.6, 0]} 
          size={[2.2, 1.8, 1.8]}
          color={isSelected ? '#3b82f6' : '#60a5fa'}
        />
      )}
      
      {/* Machine info tooltip */}
      {hovered && (
        <Html position={[0, 2.2, 0]} center distanceFactor={10}>
          <MachineTooltip 
            config={config}
            machineData={machineData}
            status={status}
            isShutdown={isShutdown}
          />
        </Html>
      )}
      
      {/* Maintenance action button */}
      {needsAttention && !isShutdown && (
        <Html position={[0, 2.8, 0]} center>
          <MaintenanceButton 
            status={status}
            sensorType={config.sensorType}
            onAction={(e) => { e.stopPropagation(); onShutdown(machineId); }}
          />
        </Html>
      )}
      
      {/* Shutdown indicator */}
      {isShutdown && (
        <Html position={[0, 1.8, 0]} center>
          <div style={{
            background: 'rgba(107, 114, 128, 0.95)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 'bold',
            fontFamily: 'monospace'
          }}>
            🔧 MAINTENANCE MODE
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================
// MACHINE TOOLTIP COMPONENT
// ============================================
function MachineTooltip({ config, machineData, status, isShutdown }) {
  const colors = STATUS_COLORS[status];
  
  const formatValue = (value, type) => {
    if (value === undefined || value === null) return 'N/A';
    switch (type) {
      case 'TEMP': return `${value.toFixed(1)}°C`;
      case 'HUM': return `${value.toFixed(1)}%`;
      case 'GAS': return `${value.toFixed(0)} ppm`;
      case 'VIB': return value === 1 ? 'ALERT' : 'Normal';
      default: return value.toFixed(2);
    }
  };

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.95)',
      border: `2px solid ${colors.glow}`,
      borderRadius: '12px',
      padding: '14px 18px',
      color: '#f1f5f9',
      fontSize: '12px',
      minWidth: '220px',
      backdropFilter: 'blur(12px)',
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${colors.glow}40`,
      fontFamily: 'monospace'
    }}>
      {/* Header */}
      <div style={{ 
        fontWeight: '700', 
        fontSize: '14px', 
        marginBottom: '10px', 
        color: colors.glow,
        borderBottom: `1px solid ${colors.glow}40`,
        paddingBottom: '8px'
      }}>
        <span style={{ marginRight: '8px' }}>⚙️</span>
        {config.label}
      </div>
      
      {/* Machine info */}
      <div style={{ marginBottom: '8px', color: '#94a3b8', fontSize: '11px' }}>
        {config.description}
      </div>
      
      {/* Sensor data grid */}
      <div style={{ display: 'grid', gap: '6px' }}>
        <DataRow label="SENSOR" value={config.sensorType} color="#60a5fa" />
        <DataRow 
          label="VALUE" 
          value={formatValue(machineData?.sensorValue, config.sensorType)} 
          color={status === STATUS.CRITICAL ? '#ef4444' : status === STATUS.WARNING ? '#f97316' : '#22c55e'} 
        />
        <DataRow 
          label="HEALTH" 
          value={`${machineData?.healthScore || 0}%`} 
          color={machineData?.healthScore < 50 ? '#ef4444' : '#22c55e'} 
        />
        <DataRow 
          label="RISK" 
          value={`${machineData?.failureRisk || 0}%`} 
          color={machineData?.failureRisk > 60 ? '#ef4444' : '#22c55e'} 
        />
        <DataRow 
          label="STATUS" 
          value={isShutdown ? 'SHUTDOWN' : status.toUpperCase()} 
          color={isShutdown ? '#6b7280' : colors.glow} 
        />
      </div>
    </div>
  );
}

function DataRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: '#94a3b8' }}>{label}:</span>
      <span style={{ color, fontWeight: '600' }}>{value}</span>
    </div>
  );
}

// ============================================
// MAINTENANCE BUTTON COMPONENT
// ============================================
function MaintenanceButton({ status, sensorType, onAction }) {
  const isCritical = status === STATUS.CRITICAL;
  const isGas = sensorType === 'GAS';
  
  return (
    <div 
      style={{
        background: isCritical 
          ? 'linear-gradient(135deg, #dc2626, #991b1b)'
          : 'linear-gradient(135deg, #f97316, #ea580c)',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '10px',
        fontSize: '12px',
        fontWeight: 'bold',
        cursor: 'pointer',
        animation: 'pulse 1s infinite',
        boxShadow: isCritical 
          ? '0 4px 25px rgba(220, 38, 38, 0.6)' 
          : '0 4px 25px rgba(249, 115, 22, 0.5)',
        textAlign: 'center',
        fontFamily: 'monospace',
        userSelect: 'none'
      }}
      onClick={onAction}
    >
      <div style={{ fontSize: '14px', marginBottom: '4px' }}>
        {isCritical ? '🚨 CRITICAL' : '⚠️ WARNING'}
      </div>
      <div style={{ fontSize: '10px', opacity: 0.9 }}>
        {isGas ? 'Click to close valve' : 'Click to shutdown'}
      </div>
    </div>
  );
}

// ============================================
// FACTORY SCENE CONTENT
// Main 3D content with all entities
// ============================================
function FactorySceneContent({ 
  machines,
  cameraMode,
  selectedMachine,
  shutdownMachines,
  onMachineSelect,
  onMachineShutdown,
  dronePosition,
  onDronePositionUpdate
}) {
  // Map API machine data to config
  const machineMap = useMemo(() => {
    const map = {};
    machines.forEach(m => {
      map[m.id] = m;
    });
    return map;
  }, [machines]);
  
  // Find anomaly positions for drone auto-patrol
  const anomalyPositions = useMemo(() => {
    return machines
      .filter(m => m.failureRisk >= 50 || m.temperature > 55 || (m.gasLevel && m.gasLevel > 300))
      .map(m => {
        const config = MACHINE_CONFIGS[m.id];
        return config ? config.position : null;
      })
      .filter(Boolean);
  }, [machines]);
  
  // Check for critical alerts
  const hasCriticalAlert = useMemo(() => {
    return machines.some(m => 
      m.failureRisk >= 70 || 
      m.temperature > 65 || 
      (m.gasLevel && m.gasLevel > 400)
    );
  }, [machines]);
  
  // Check for gas leak
  const hasGasLeak = useMemo(() => {
    return machines.some(m => m.gasLevel && m.gasLevel > 300);
  }, [machines]);

  return (
    <>
      {/* Industrial Lighting with alert mode */}
      <IndustrialLighting criticalAlert={hasCriticalAlert} />
      
      {/* Light atmospheric fog */}
      <fog attach="fog" args={['#3a4555', 80, 180]} />
      
      {/* Environment - simplified */}
      <FactoryFloor />
      <FactoryWalls />
      <StorageTanks />
      <PipelineNetwork hasLeak={hasGasLeak} />
      
      {/* Reduced ambient dust */}
      <AmbientDust count={30} />
      
      {/* Machine entities */}
      {Object.entries(MACHINE_CONFIGS).map(([machineId, config]) => {
        const machineData = machineMap[machineId] || {};
        const isSelected = selectedMachine === machineId;
        const isShutdown = shutdownMachines[machineId] || false;
        
        return (
          <MachineEntity
            key={machineId}
            machineId={machineId}
            config={config}
            machineData={machineData}
            isSelected={isSelected}
            isShutdown={isShutdown}
            onSelect={onMachineSelect}
            onShutdown={onMachineShutdown}
          />
        );
      })}
      
      {/* Camera controllers */}
      <ControlRoomCamera isActive={cameraMode === CAMERA_MODES.CONTROL_ROOM} />
      <FirstPersonController 
        isActive={cameraMode === CAMERA_MODES.FIRST_PERSON}
        onPositionUpdate={onDronePositionUpdate}
      />
      <DroneController 
        isActive={cameraMode === CAMERA_MODES.DRONE}
        anomalyPositions={anomalyPositions}
        onPositionUpdate={onDronePositionUpdate}
      />
      
      {/* Drone visual (shown in other camera modes) */}
      {cameraMode !== CAMERA_MODES.DRONE && dronePosition && (
        <DroneModel 
          position={dronePosition.toArray()} 
          isFlying={true}
        />
      )}
    </>
  );
}

// ============================================
// HUD OVERLAY COMPONENT
// UI elements overlaid on 3D scene
// ============================================
function HUDOverlay({
  cameraMode,
  setCameraMode,
  playerPosition,
  isPatrolling,
  hasAlerts,
  selectedMachine,
  machines,
  isPointerLocked,
  isFullscreen,
  onToggleFullscreen
}) {
  // Find alert counts
  const alertStats = useMemo(() => {
    const critical = machines.filter(m => m.failureRisk >= 70).length;
    const warning = machines.filter(m => m.failureRisk >= 40 && m.failureRisk < 70).length;
    return { critical, warning, total: critical + warning };
  }, [machines]);

  return (
    <>
      {/* Fullscreen toggle button */}
      <button
        onClick={onToggleFullscreen}
        style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '10px 14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#e2e8f0',
          fontSize: '12px',
          fontFamily: 'monospace',
          fontWeight: '600',
          zIndex: 100,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.8)'}
        onMouseLeave={(e) => e.target.style.background = 'rgba(15, 23, 42, 0.95)'}
      >
        {isFullscreen ? '⛶' : '⛶'}
        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>
      
      {/* Alert banner */}
      {alertStats.total > 0 && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          background: alertStats.critical > 0 
            ? 'linear-gradient(90deg, rgba(220, 38, 38, 0.95), rgba(185, 28, 28, 0.95))'
            : 'linear-gradient(90deg, rgba(249, 115, 22, 0.95), rgba(234, 88, 12, 0.95))',
          color: 'white',
          padding: '10px 20px',
          fontSize: '13px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          animation: alertStats.critical > 0 ? 'pulse 2s infinite' : 'none',
          zIndex: 100
        }}>
          <span>🚨 SYSTEM ALERTS:</span>
          {alertStats.critical > 0 && (
            <span style={{ color: '#fecaca' }}>{alertStats.critical} CRITICAL</span>
          )}
          {alertStats.warning > 0 && (
            <span style={{ color: '#fed7aa' }}>{alertStats.warning} WARNING</span>
          )}
          <span style={{ fontSize: '11px', opacity: 0.8 }}>
            Hover machines for details • Click to take action
          </span>
        </div>
      )}
      
      {/* Camera mode selector */}
      <div style={{
        position: 'absolute',
        top: alertStats.total > 0 ? '55px' : '15px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '4px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderRadius: '12px',
        padding: '6px',
        backdropFilter: 'blur(12px)',
        border: '1px solid #334155',
        zIndex: 90
      }}>
        {[
          { mode: CAMERA_MODES.CONTROL_ROOM, label: 'Control Room', icon: '🖥️', key: '1' },
          { mode: CAMERA_MODES.FIRST_PERSON, label: 'Engineer', icon: '🚶', key: '2' },
          { mode: CAMERA_MODES.DRONE, label: 'Drone', icon: '🚁', key: '3' }
        ].map(({ mode, label, icon, key }) => (
          <button
            key={mode}
            onClick={() => setCameraMode(mode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              fontFamily: 'monospace',
              background: cameraMode === mode 
                ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
                : 'transparent',
              color: cameraMode === mode ? '#fff' : '#94a3b8',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{icon}</span>
            <span>{label}</span>
            <span style={{ 
              fontSize: '10px', 
              opacity: 0.6,
              background: 'rgba(255,255,255,0.1)',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>{key}</span>
          </button>
        ))}
      </div>
      
      {/* Controls help panel - IMPROVED */}
      {(cameraMode === CAMERA_MODES.FIRST_PERSON || cameraMode === CAMERA_MODES.DRONE) && (
        <div style={{
          position: 'absolute',
          top: alertStats.total > 0 ? '115px' : '75px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: isPointerLocked 
            ? 'rgba(15, 23, 42, 0.9)' 
            : 'linear-gradient(135deg, #3b82f6, #2563eb)',
          borderRadius: '10px',
          padding: '12px 20px',
          fontSize: '12px',
          fontFamily: 'monospace',
          color: '#fff',
          zIndex: 80,
          boxShadow: isPointerLocked ? 'none' : '0 4px 20px rgba(59, 130, 246, 0.4)',
          cursor: isPointerLocked ? 'default' : 'pointer',
          animation: isPointerLocked ? 'none' : 'pulse 2s infinite'
        }}>
          {!isPointerLocked ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>🖱️</span>
              <div>
                <div style={{ fontWeight: 'bold' }}>Click anywhere to enable controls</div>
                <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                  Mouse will be locked for camera control
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ color: '#22c55e' }}>✓ Controls Active</span>
              <span><b>WASD</b> Move</span>
              <span><b>Mouse</b> Look</span>
              {cameraMode === CAMERA_MODES.DRONE && (
                <>
                  <span><b>Space/Ctrl</b> Up/Down</span>
                  <span><b>P</b> Patrol</span>
                </>
              )}
              <span><b>Shift</b> Sprint</span>
              <span style={{ color: '#fbbf24' }}><b>ESC</b> Release</span>
            </div>
          )}
        </div>
      )}
      
      {/* Drone status panel */}
      {cameraMode === CAMERA_MODES.DRONE && (
        <div style={{
          position: 'absolute',
          top: alertStats.total > 0 ? '165px' : '125px',
          right: '15px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderRadius: '10px',
          padding: '12px 16px',
          fontSize: '11px',
          fontFamily: 'monospace',
          color: '#94a3b8',
          border: '1px solid #334155',
          minWidth: '180px'
        }}>
          <div style={{ fontWeight: '700', color: '#e2e8f0', marginBottom: '8px' }}>
            🚁 DRONE STATUS
          </div>
          <div style={{ display: 'grid', gap: '4px' }}>
            <div>MODE: <span style={{ color: isPatrolling ? '#22c55e' : '#60a5fa' }}>
              {isPatrolling ? 'AUTO PATROL' : 'MANUAL'}
            </span></div>
            {playerPosition && (
              <>
                <div>ALT: <span style={{ color: '#fbbf24' }}>{playerPosition.y?.toFixed(1)}m</span></div>
                <div>POS: <span style={{ color: '#60a5fa' }}>
                  {playerPosition.x?.toFixed(0)}, {playerPosition.z?.toFixed(0)}
                </span></div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* First-person HUD */}
      {cameraMode === CAMERA_MODES.FIRST_PERSON && playerPosition && (
        <div style={{
          position: 'absolute',
          bottom: '15px',
          left: '15px',
          background: 'rgba(15, 23, 42, 0.9)',
          borderRadius: '10px',
          padding: '12px 16px',
          fontSize: '11px',
          fontFamily: 'monospace',
          color: '#94a3b8',
          border: '1px solid #334155'
        }}>
          <div style={{ fontWeight: '700', color: '#e2e8f0', marginBottom: '6px' }}>
            🚶 ENGINEER VIEW
          </div>
          <div>POSITION: <span style={{ color: '#60a5fa' }}>
            X:{playerPosition.x?.toFixed(1)} Z:{playerPosition.z?.toFixed(1)}
          </span></div>
        </div>
      )}
      
      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '15px',
        left: cameraMode === CAMERA_MODES.FIRST_PERSON ? '200px' : '15px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderRadius: '10px',
        padding: '12px 16px',
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#94a3b8',
        border: '1px solid #334155'
      }}>
        <div style={{ fontWeight: '700', color: '#e2e8f0', marginBottom: '8px' }}>
          📊 STATUS LEGEND
        </div>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <span><span style={{ color: '#22c55e' }}>●</span> Normal</span>
          <span><span style={{ color: '#fbbf24' }}>●</span> Warning</span>
          <span><span style={{ color: '#ef4444' }}>●</span> Critical</span>
          <span><span style={{ color: '#6b7280' }}>●</span> Offline</span>
        </div>
        <div style={{ marginTop: '6px', fontSize: '10px', color: '#94a3b8' }}>
          Real-time IoT sensor data • Press 1-2-3 for camera modes • F for fullscreen
        </div>
      </div>
      
      {/* Selected machine panel */}
      {selectedMachine && (
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '15px',
          transform: 'translateY(-50%)',
          background: 'rgba(15, 23, 42, 0.98)',
          borderRadius: '12px',
          padding: '16px 20px',
          fontSize: '12px',
          fontFamily: 'monospace',
          color: '#f1f5f9',
          border: '2px solid #3b82f6',
          minWidth: '240px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}>
          <div style={{ 
            fontWeight: '700', 
            fontSize: '14px', 
            marginBottom: '12px', 
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>📍</span> SELECTED MACHINE
          </div>
          <div style={{ 
            background: '#1e293b', 
            padding: '10px', 
            borderRadius: '8px',
            marginBottom: '10px'
          }}>
            <div style={{ color: '#e2e8f0', fontWeight: '600' }}>
              {MACHINE_CONFIGS[selectedMachine]?.label || selectedMachine}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '4px' }}>
              {MACHINE_CONFIGS[selectedMachine]?.description}
            </div>
          </div>
          <button
            onClick={() => {/* Navigate to machine */}}
            style={{
              width: '100%',
              padding: '8px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'monospace'
            }}
          >
            🎯 Focus Camera
          </button>
        </div>
      )}
    </>
  );
}

// ============================================
// LOADING SCREEN
// ============================================
function LoadingScreen() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a, #1e293b)',
      color: '#e2e8f0',
      fontFamily: 'monospace'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '3px solid #334155',
        borderTop: '3px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <div style={{ marginTop: '20px', fontSize: '16px', fontWeight: '600' }}>
        INITIALIZING DIGITAL TWIN
      </div>
      <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
        Loading industrial environment...
      </div>
    </div>
  );
}

// ============================================
// ERROR FALLBACK
// ============================================
function ErrorFallback({ onRetry }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      color: '#94a3b8',
      fontFamily: 'monospace',
      gap: '16px'
    }}>
      <span style={{ fontSize: '48px' }}>⚠️</span>
      <span style={{ fontSize: '14px' }}>3D View temporarily unavailable</span>
      <button
        onClick={onRetry}
        style={{
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        Reload 3D View
      </button>
    </div>
  );
}

// ============================================
// MAIN FACTORY SCENE COMPONENT
// ============================================
export default function FactoryScene({
  machines = [],
  onMachineSelect = () => {},
  motorShutdown = {},
  valvesClosed = {},
  needsAttention = {},
  onMotorShutdown = () => {},
  onValveClose = () => {},
  onReset = () => {}
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [cameraMode, setCameraMode] = useState(CAMERA_MODES.CONTROL_ROOM);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [shutdownMachines, setShutdownMachines] = useState({});
  const [dronePosition, setDronePosition] = useState(null);
  const [isPatrolling, setIsPatrolling] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Initialize
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Sync external shutdown state
  useEffect(() => {
    setShutdownMachines(prev => ({ ...prev, ...motorShutdown }));
  }, [motorShutdown]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Keyboard shortcuts for camera modes
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Digit1' || e.code === 'Numpad1') {
        setCameraMode(CAMERA_MODES.CONTROL_ROOM);
        if (document.pointerLockElement) document.exitPointerLock();
      }
      if (e.code === 'Digit2' || e.code === 'Numpad2') {
        setCameraMode(CAMERA_MODES.FIRST_PERSON);
      }
      if (e.code === 'Digit3' || e.code === 'Numpad3') {
        setCameraMode(CAMERA_MODES.DRONE);
      }
      if (e.code === 'KeyF') {
        toggleFullscreen();
      }
      if (e.code === 'Escape') {
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
      }
    };
    
    const handlePointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement !== null);
    };
    
    const handlePointerLockError = () => {
      console.warn('Pointer lock error');
      setIsPointerLocked(false);
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
    };
  }, [toggleFullscreen]);

  // Handle canvas click for pointer lock - IMPROVED
  const handleCanvasClick = useCallback((e) => {
    // Don't lock if clicking on UI elements
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
      return;
    }
    
    if ((cameraMode === CAMERA_MODES.FIRST_PERSON || cameraMode === CAMERA_MODES.DRONE) &&
        canvasRef.current && !document.pointerLockElement) {
      // Request pointer lock on the canvas element specifically
      const canvas = canvasRef.current.querySelector('canvas');
      if (canvas) {
        canvas.requestPointerLock().catch(err => {
          console.warn('Pointer lock failed:', err);
        });
      }
    }
  }, [cameraMode]);

  // Handle machine selection
  const handleMachineSelect = useCallback((machineId, machineData) => {
    setSelectedMachine(prev => prev === machineId ? null : machineId);
    onMachineSelect(machineData);
  }, [onMachineSelect]);

  // Handle machine shutdown
  const handleMachineShutdown = useCallback((machineId) => {
    setShutdownMachines(prev => ({ ...prev, [machineId]: true }));
    onMotorShutdown(machineId);
  }, [onMotorShutdown]);

  // Handle drone position updates
  const handleDronePositionUpdate = useCallback((position, patrolling) => {
    setDronePosition(position);
    setIsPatrolling(patrolling);
  }, []);

  // Handle WebGL context management
  const handleCreated = useCallback(({ gl }) => {
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('WebGL context lost');
      setContextLost(true);
    });
    canvas.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored');
      setContextLost(false);
    });
  }, []);

  // Loading state
  if (!isLoaded) {
    return <LoadingScreen />;
  }

  // Error state
  if (contextLost) {
    return (
      <ErrorFallback 
        onRetry={() => {
          setContextLost(false);
          setIsLoaded(false);
          setTimeout(() => setIsLoaded(true), 100);
        }}
      />
    );
  }

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '100%', 
        background: '#1a2332', 
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: '100%',
          cursor: (cameraMode === CAMERA_MODES.FIRST_PERSON || cameraMode === CAMERA_MODES.DRONE) && !isPointerLocked 
            ? 'pointer' 
            : 'default'
        }}
      >
        <Canvas
          shadows={false}
          camera={{ 
            position: [0, 35, 45], 
            fov: 45, 
            near: 0.5, 
            far: 150 
          }}
          gl={{
            antialias: false,
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: false,
            preserveDrawingBuffer: false,
            alpha: false,
            stencil: false,
            depth: true,
            toneMapping: THREE.NoToneMapping
          }}
          dpr={1}
          onCreated={handleCreated}
        >
          {/* Background color */}
          <color attach="background" args={['#2a3444']} />
          
          <Suspense fallback={null}>
            <FactorySceneContent
              machines={machines}
              cameraMode={cameraMode}
              selectedMachine={selectedMachine}
              shutdownMachines={shutdownMachines}
              onMachineSelect={handleMachineSelect}
              onMachineShutdown={handleMachineShutdown}
              dronePosition={dronePosition}
              onDronePositionUpdate={handleDronePositionUpdate}
            />
          </Suspense>
        </Canvas>
      </div>
      
      {/* HUD Overlay */}
      <HUDOverlay
        cameraMode={cameraMode}
        setCameraMode={setCameraMode}
        playerPosition={dronePosition}
        isPatrolling={isPatrolling}
        hasAlerts={machines.some(m => m.failureRisk >= 40)}
        selectedMachine={selectedMachine}
        machines={machines}
        isPointerLocked={isPointerLocked}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />
      
      {/* CSS Animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
