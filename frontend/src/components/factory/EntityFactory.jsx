/**
 * Entity Factory Module
 * =====================
 * Production-grade industrial machinery 3D models.
 * Each machine is a detailed, PBR-ready geometry with:
 * - Realistic proportions and details
 * - Animated components
 * - Status-reactive materials
 * - Optimized for real-time rendering
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STATUS_COLORS, STATUS, MATERIALS, EFFECT_PARAMS } from './constants';

// ============================================
// UTILITY: Get status from machine data
// ============================================
export function getStatusFromData(machine, sensorType) {
  if (!machine) return STATUS.OFFLINE;
  
  const failureRisk = machine.failureRisk || 0;
  const temperature = machine.temperature || 0;
  const vibration = machine.vibration || 0;
  const gasLevel = machine.gasLevel || 0;
  
  // Critical conditions - RED highlight
  if (failureRisk >= 50) return STATUS.CRITICAL;
  if (temperature > 60) return STATUS.CRITICAL;
  if (vibration >= 0.8) return STATUS.CRITICAL;
  if (sensorType === 'GAS' && gasLevel > 350) return STATUS.CRITICAL;
  
  // Warning conditions - YELLOW highlight (lowered thresholds)
  if (failureRisk >= 15) return STATUS.WARNING;
  if (temperature > 40) return STATUS.WARNING;
  if (vibration >= 0.3) return STATUS.WARNING;
  if (sensorType === 'GAS' && gasLevel > 150) return STATUS.WARNING;
  
  return STATUS.NORMAL;
}

// ============================================
// VIBRATION MOTOR
// High-detail rotating machinery with cooling fins
// ============================================
export function VibrationMotor({ status = STATUS.NORMAL, machineData = {}, isShutdown = false }) {
  const shaftRef = useRef();
  const fanRef = useRef();
  const bodyRef = useRef();
  const groupRef = useRef();
  
  const colors = STATUS_COLORS[status];
  const rpm = isShutdown ? 0 : (machineData.temperature || 25) * 2;
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Shaft rotation
    if (shaftRef.current && !isShutdown) {
      shaftRef.current.rotation.x += (rpm / 60) * 0.1;
    }
    
    // Cooling fan rotation
    if (fanRef.current && !isShutdown) {
      fanRef.current.rotation.z += 0.15;
    }
    
    // Vibration effect for critical/warning
    if (groupRef.current && status !== STATUS.NORMAL && status !== STATUS.OFFLINE && !isShutdown) {
      const { intensity, frequency } = EFFECT_PARAMS.vibrationShake;
      const mult = status === STATUS.CRITICAL ? 2 : 1;
      groupRef.current.position.x = Math.sin(t * frequency) * intensity * mult;
      groupRef.current.position.z = Math.cos(t * frequency * 1.3) * intensity * mult * 0.7;
    }
    
    // Pulsing emissive for warning/critical
    if (bodyRef.current && status !== STATUS.NORMAL && status !== STATUS.OFFLINE) {
      const pulse = 0.3 + Math.sin(t * (status === STATUS.CRITICAL ? 8 : 4)) * 0.3;
      bodyRef.current.material.emissiveIntensity = pulse;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Motor Base - Heavy cast iron base */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.16, 0.9]} />
        <meshStandardMaterial {...MATERIALS.oilStained} />
      </mesh>
      
      {/* Mounting feet */}
      {[[-0.55, 0], [0.55, 0], [-0.55, 0.3], [0.55, 0.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.04, z - 0.15]} castShadow>
          <boxGeometry args={[0.15, 0.08, 0.12]} />
          <meshStandardMaterial {...MATERIALS.wornMetal} />
        </mesh>
      ))}
      
      {/* Motor Frame / Stator Housing */}
      <mesh ref={bodyRef} position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.42, 0.7, 32]} />
        <meshStandardMaterial
          color={colors.primary}
          roughness={0.5}
          metalness={0.7}
          emissive={colors.emissive}
          emissiveIntensity={colors.intensity}
        />
      </mesh>
      
      {/* Cooling Fins around motor body */}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh 
          key={i} 
          position={[0, 0.45, 0]} 
          rotation={[0, (i * Math.PI) / 6, 0]}
          castShadow
        >
          <boxGeometry args={[0.52, 0.5, 0.02]} />
          <meshStandardMaterial {...MATERIALS.paintedSteel} />
        </mesh>
      ))}
      
      {/* Drive End Bell Housing */}
      <mesh position={[0.45, 0.45, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.35, 0.38, 0.12, 32]} />
        <meshStandardMaterial {...MATERIALS.wornMetal} />
      </mesh>
      
      {/* Non-Drive End Bell with Fan Cover */}
      <mesh position={[-0.45, 0.45, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.32, 0.35, 0.15, 32]} />
        <meshStandardMaterial {...MATERIALS.paintedSteel} />
      </mesh>
      
      {/* Fan Cover Grill */}
      <mesh position={[-0.55, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.28, 0.02, 8, 32]} />
        <meshStandardMaterial {...MATERIALS.wornMetal} />
      </mesh>
      
      {/* Cooling Fan */}
      <group ref={fanRef} position={[-0.5, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} rotation={[0, (i * Math.PI) / 3, 0]}>
            <boxGeometry args={[0.22, 0.02, 0.05]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.3} roughness={0.6} />
          </mesh>
        ))}
      </group>
      
      {/* Output Shaft */}
      <mesh ref={shaftRef} position={[0.6, 0.45, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.35, 16]} />
        <meshStandardMaterial color="#71717a" metalness={0.9} roughness={0.3} />
      </mesh>
      
      {/* Shaft Coupling */}
      <mesh position={[0.75, 0.45, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.08, 24]} />
        <meshStandardMaterial {...MATERIALS.safetyYellow} />
      </mesh>
      
      {/* Junction Box */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.25, 0.15, 0.2]} />
        <meshStandardMaterial {...MATERIALS.paintedSteel} />
      </mesh>
      
      {/* Conduit fitting */}
      <mesh position={[0.15, 0.85, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
        <meshStandardMaterial {...MATERIALS.wornMetal} />
      </mesh>
      
      {/* Name Plate */}
      <mesh position={[0, 0.45, 0.39]}>
        <boxGeometry args={[0.3, 0.15, 0.01]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.1} roughness={0.8} />
      </mesh>
      
      {/* Status indicator light */}
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={colors.glow} />
      </mesh>
      
      {/* Status light glow */}
      {status !== STATUS.OFFLINE && (
        <pointLight
          position={[0, 1, 0]}
          color={colors.glow}
          intensity={status === STATUS.CRITICAL ? 2 : status === STATUS.WARNING ? 1 : 0.3}
          distance={3}
        />
      )}
    </group>
  );
}

// ============================================
// THERMAL PUMP
// Centrifugal pump with heat visualization
// ============================================
export function ThermalPump({ status = STATUS.NORMAL, machineData = {}, isShutdown = false }) {
  const impellerRef = useRef();
  const groupRef = useRef();
  const bodyRef = useRef();
  const heatGlowRef = useRef();
  
  const colors = STATUS_COLORS[status];
  const temp = machineData.temperature || 25;
  
  // Heat color interpolation
  const heatColor = useMemo(() => {
    if (temp < 40) return '#3b82f6';  // Cool blue
    if (temp < 55) return '#22c55e';  // Normal green
    if (temp < 65) return '#f97316';  // Warning orange
    return '#ef4444';  // Critical red
  }, [temp]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Impeller rotation
    if (impellerRef.current && !isShutdown) {
      const speed = Math.min(temp / 20, 4);
      impellerRef.current.rotation.y += 0.08 * speed;
    }
    
    // Heat distortion effect
    if (heatGlowRef.current && temp > 50 && !isShutdown) {
      heatGlowRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.1);
      heatGlowRef.current.material.opacity = 0.2 + Math.sin(t * 2) * 0.1;
    }
    
    // Vibration for critical
    if (groupRef.current && status === STATUS.CRITICAL && !isShutdown) {
      groupRef.current.position.x = Math.sin(t * 30) * 0.008;
      groupRef.current.position.z = Math.cos(t * 25) * 0.006;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Base plate */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.12, 1.2]} />
        <meshStandardMaterial {...MATERIALS.oilStained} />
      </mesh>
      
      {/* Motor section */}
      <mesh position={[-0.4, 0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.28, 0.32, 0.55, 32]} />
        <meshStandardMaterial
          color={colors.primary}
          roughness={0.45}
          metalness={0.7}
          emissive={colors.emissive}
          emissiveIntensity={colors.intensity * 0.5}
        />
      </mesh>
      
      {/* Motor cooling fins */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[-0.4, 0.4, 0]} rotation={[0, (i * Math.PI) / 4, Math.PI / 2]} castShadow>
          <boxGeometry args={[0.02, 0.4, 0.35]} />
          <meshStandardMaterial {...MATERIALS.paintedSteel} />
        </mesh>
      ))}
      
      {/* Pump volute casing */}
      <mesh ref={bodyRef} position={[0.25, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.38, 0.5, 32]} />
        <meshStandardMaterial
          color={heatColor}
          roughness={0.35}
          metalness={0.6}
          emissive={temp > 55 ? heatColor : '#000'}
          emissiveIntensity={temp > 55 ? 0.3 : 0}
        />
      </mesh>
      
      {/* Impeller housing (transparent) */}
      <mesh position={[0.25, 0.38, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.35, 32]} />
        <meshStandardMaterial
          color="#0ea5e9"
          transparent
          opacity={0.3}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>
      
      {/* Rotating impeller */}
      <group ref={impellerRef} position={[0.25, 0.38, 0]}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} rotation={[0, (i * Math.PI) / 3, 0]}>
            <boxGeometry args={[0.18, 0.03, 0.04]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 0.2, 12]} />
          <meshStandardMaterial color="#71717a" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
      
      {/* Suction inlet (bottom) */}
      <mesh position={[0.25, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.1, 16]} />
        <meshStandardMaterial {...MATERIALS.wornMetal} />
      </mesh>
      
      {/* Discharge outlet (side) */}
      <mesh position={[0.6, 0.38, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.25, 16]} />
        <meshStandardMaterial {...MATERIALS.wornMetal} />
      </mesh>
      <mesh position={[0.75, 0.38, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.1, 0.025, 8, 16]} />
        <meshStandardMaterial {...MATERIALS.wornMetal} />
      </mesh>
      
      {/* Pressure gauge */}
      <mesh position={[0.25, 0.7, 0.15]}>
        <cylinderGeometry args={[0.06, 0.06, 0.03, 16]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0.25, 0.7, 0.17]}>
        <circleGeometry args={[0.05, 16]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>
      
      {/* Heat glow effect for high temperature */}
      {temp > 50 && !isShutdown && (
        <mesh ref={heatGlowRef} position={[0.25, 0.38, 0]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color={heatColor} transparent opacity={0.15} />
        </mesh>
      )}
      
      {/* Status light */}
      <mesh position={[-0.4, 0.75, 0]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial color={colors.glow} />
      </mesh>
      
      {status !== STATUS.OFFLINE && (
        <pointLight
          position={[0.25, 0.6, 0]}
          color={heatColor}
          intensity={temp > 55 ? 1.5 : 0.5}
          distance={3}
        />
      )}
    </group>
  );
}

// ============================================
// HEAT EXCHANGER
// Shell and tube heat exchanger with thermal visualization
// ============================================
export function HeatExchanger({ status = STATUS.NORMAL, machineData = {}, isShutdown = false }) {
  const shellRef = useRef();
  const groupRef = useRef();
  
  const colors = STATUS_COLORS[status];
  const temp = machineData.temperature || 25;
  
  const shellColor = useMemo(() => {
    if (temp < 40) return '#6b7280';
    if (temp < 55) return '#78716c';
    if (temp < 65) return '#ea580c';
    return '#dc2626';
  }, [temp]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (shellRef.current && temp > 50 && !isShutdown) {
      // Heat shimmer effect
      shellRef.current.material.emissiveIntensity = 0.2 + Math.sin(t * 2) * 0.15;
    }
    
    if (groupRef.current && status === STATUS.CRITICAL && !isShutdown) {
      groupRef.current.position.y = Math.sin(t * 20) * 0.003;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Support frame */}
      <mesh position={[-0.8, 0.3, 0]} castShadow>
        <boxGeometry args={[0.15, 0.6, 0.8]} />
        <meshStandardMaterial {...MATERIALS.paintedSteel} />
      </mesh>
      <mesh position={[0.8, 0.3, 0]} castShadow>
        <boxGeometry args={[0.15, 0.6, 0.8]} />
        <meshStandardMaterial {...MATERIALS.paintedSteel} />
      </mesh>
      
      {/* Shell body (horizontal cylinder) */}
      <mesh ref={shellRef} position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 1.8, 32]} />
        <meshStandardMaterial
          color={shellColor}
          roughness={0.4}
          metalness={0.7}
          emissive={temp > 50 ? shellColor : '#000'}
          emissiveIntensity={temp > 50 ? 0.2 : 0}
        />
      </mesh>
      
      {/* End caps */}
      <mesh position={[-0.95, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.38, 0.35, 0.1, 32]} />
        <meshStandardMaterial {...MATERIALS.wornMetal} />
      </mesh>
      <mesh position={[0.95, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.38, 0.35, 0.1, 32]} />
        <meshStandardMaterial {...MATERIALS.wornMetal} />
      </mesh>
      
      {/* Inlet/outlet nozzles */}
      {[[-0.5, 0.95], [0.5, 0.95], [-0.5, 0.15], [0.5, 0.15]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.2, 12]} />
          <meshStandardMaterial color={i < 2 ? '#ff6b35' : '#60a5fa'} roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
      
      {/* Flanges on nozzles */}
      {[[-0.5, 1.08], [0.5, 1.08], [-0.5, 0.02], [0.5, 0.02]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.03, 16]} />
          <meshStandardMaterial {...MATERIALS.wornMetal} />
        </mesh>
      ))}
      
      {/* Temperature indicators */}
      <mesh position={[0, 0.95, 0.2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.06, 12]} />
        <meshStandardMaterial color={temp > 55 ? '#ef4444' : '#22c55e'} emissive={temp > 55 ? '#ef4444' : '#22c55e'} emissiveIntensity={0.5} />
      </mesh>
      
      {/* Tube bundle indicator lights */}
      {[-0.3, 0, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 0.93, 0]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial color={status === STATUS.CRITICAL ? '#ef4444' : status === STATUS.WARNING ? '#f97316' : '#22c55e'} />
        </mesh>
      ))}
      
      {/* Status light */}
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color={colors.glow} />
      </mesh>
      
      {temp > 55 && !isShutdown && (
        <pointLight position={[0, 0.55, 0]} color="#ff6b35" intensity={1} distance={4} />
      )}
    </group>
  );
}

// ============================================
// HUMIDITY CONTROLLER
// Industrial air handling unit
// ============================================
export function HumidityController({ status = STATUS.NORMAL, machineData = {}, isShutdown = false }) {
  const fanRef = useRef();
  const groupRef = useRef();
  
  const colors = STATUS_COLORS[status];
  const humidity = machineData.humidity || 50;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (fanRef.current && !isShutdown) {
      fanRef.current.rotation.z += 0.1;
    }
    
    if (groupRef.current && status !== STATUS.NORMAL && !isShutdown) {
      groupRef.current.position.x = Math.sin(t * 15) * 0.004;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main cabinet */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.2, 1.2, 0.8]} />
        <meshStandardMaterial
          color={colors.primary}
          roughness={0.5}
          metalness={0.4}
          emissive={colors.emissive}
          emissiveIntensity={colors.intensity * 0.3}
        />
      </mesh>
      
      {/* Intake louvers */}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[0, 0.3 + i * 0.18, 0.42]} rotation={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.9, 0.08, 0.02]} />
          <meshStandardMaterial {...MATERIALS.wornMetal} />
        </mesh>
      ))}
      
      {/* Exhaust grill */}
      <mesh position={[0, 0.6, -0.42]}>
        <boxGeometry args={[0.8, 0.8, 0.02]} />
        <meshStandardMaterial {...MATERIALS.wornMetal} wireframe />
      </mesh>
      
      {/* Fan behind grill */}
      <group ref={fanRef} position={[0, 0.6, -0.38]}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 3]}>
            <boxGeometry args={[0.35, 0.06, 0.02]} />
            <meshStandardMaterial color="#e5e7eb" />
          </mesh>
        ))}
      </group>
      
      {/* Control panel */}
      <mesh position={[0.62, 0.8, 0]} castShadow>
        <boxGeometry args={[0.02, 0.4, 0.3]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>
      
      {/* Humidity display */}
      <mesh position={[0.64, 0.85, 0]}>
        <boxGeometry args={[0.01, 0.1, 0.15]} />
        <meshBasicMaterial color={humidity > 70 || humidity < 30 ? '#ef4444' : '#22c55e'} />
      </mesh>
      
      {/* Water connections */}
      <mesh position={[-0.5, 0.15, -0.3]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.15, 12]} />
        <meshStandardMaterial color="#60a5fa" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0.5, 0.15, -0.3]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.15, 12]} />
        <meshStandardMaterial color="#60a5fa" roughness={0.3} metalness={0.6} />
      </mesh>
      
      {/* Status light */}
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color={colors.glow} />
      </mesh>
      
      {status !== STATUS.OFFLINE && (
        <pointLight position={[0, 1.3, 0]} color={colors.glow} intensity={0.8} distance={3} />
      )}
    </group>
  );
}

// ============================================
// AIR COMPRESSOR
// Industrial reciprocating compressor
// ============================================
export function AirCompressor({ status = STATUS.NORMAL, machineData = {}, isShutdown = false }) {
  const pistonRef = useRef();
  const flywheelRef = useRef();
  const groupRef = useRef();
  
  const colors = STATUS_COLORS[status];

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (flywheelRef.current && !isShutdown) {
      flywheelRef.current.rotation.x += 0.08;
    }
    
    if (pistonRef.current && !isShutdown) {
      pistonRef.current.position.y = 0.5 + Math.sin(t * 8) * 0.08;
    }
    
    if (groupRef.current && status === STATUS.CRITICAL && !isShutdown) {
      const shake = EFFECT_PARAMS.vibrationShake;
      groupRef.current.position.x = Math.sin(t * shake.frequency) * shake.intensity * 1.5;
      groupRef.current.position.z = Math.cos(t * shake.frequency * 1.2) * shake.intensity;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Base frame */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.2, 1.2]} />
        <meshStandardMaterial {...MATERIALS.oilStained} />
      </mesh>
      
      {/* Motor */}
      <mesh position={[-0.5, 0.45, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.25, 0.28, 0.5, 32]} />
        <meshStandardMaterial
          color={colors.primary}
          roughness={0.45}
          metalness={0.65}
          emissive={colors.emissive}
          emissiveIntensity={colors.intensity}
        />
      </mesh>
      
      {/* Flywheel */}
      <group ref={flywheelRef} position={[-0.15, 0.45, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.06, 32]} />
          <meshStandardMaterial {...MATERIALS.wornMetal} />
        </mesh>
        {/* Spokes */}
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} rotation={[0, 0, Math.PI / 2 + (i * Math.PI) / 3]}>
            <boxGeometry args={[0.24, 0.03, 0.04]} />
            <meshStandardMaterial {...MATERIALS.wornMetal} />
          </mesh>
        ))}
      </group>
      
      {/* Cylinder block */}
      <mesh position={[0.3, 0.4, 0]} castShadow>
        <boxGeometry args={[0.5, 0.4, 0.4]} />
        <meshStandardMaterial {...MATERIALS.paintedSteel} />
      </mesh>
      
      {/* Cylinder head with fins */}
      <mesh ref={pistonRef} position={[0.3, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.18, 0.2, 24]} />
        <meshStandardMaterial color="#52525b" roughness={0.5} metalness={0.6} />
      </mesh>
      
      {/* Cooling fins on cylinder */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[0.3, 0.5 + i * 0.05, 0]} castShadow>
          <boxGeometry args={[0.55, 0.02, 0.45]} />
          <meshStandardMaterial {...MATERIALS.wornMetal} />
        </mesh>
      ))}
      
      {/* Air tank */}
      <mesh position={[0.7, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.5, 8, 16]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} metalness={0.5} />
      </mesh>
      
      {/* Pressure gauge on tank */}
      <mesh position={[0.7, 0.6, 0.22]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.3} metalness={0.4} />
      </mesh>
      
      {/* Air outlet */}
      <mesh position={[0.9, 0.35, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.15, 12]} />
        <meshStandardMaterial {...MATERIALS.pipeAir} />
      </mesh>
      
      {/* Safety valve */}
      <mesh position={[0.7, 0.58, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.08, 8]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.4} metalness={0.5} />
      </mesh>
      
      {/* Status light */}
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color={colors.glow} />
      </mesh>
      
      {status !== STATUS.OFFLINE && (
        <pointLight position={[0, 0.9, 0]} color={colors.glow} intensity={0.7} distance={3} />
      )}
    </group>
  );
}

// ============================================
// GAS DETECTOR
// Multi-gas detection unit with sensor array
// ============================================
export function GasDetector({ status = STATUS.NORMAL, machineData = {}, isShutdown = false }) {
  const sensorRef = useRef();
  const alertRef = useRef();
  const groupRef = useRef();
  
  const colors = STATUS_COLORS[status];
  const gasLevel = machineData.gasLevel || 0;
  const hasLeak = gasLevel > 200;
  const criticalLeak = gasLevel > 400;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (sensorRef.current && !isShutdown) {
      // Scanning animation
      sensorRef.current.rotation.y = Math.sin(t * 0.5) * 0.3;
    }
    
    if (alertRef.current && hasLeak && !isShutdown) {
      alertRef.current.material.emissiveIntensity = 0.5 + Math.sin(t * (criticalLeak ? 10 : 5)) * 0.5;
    }
    
    if (groupRef.current && criticalLeak && !isShutdown) {
      groupRef.current.position.x = Math.sin(t * 20) * 0.005;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Mounting post */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 1.6, 12]} />
        <meshStandardMaterial {...MATERIALS.paintedSteel} />
      </mesh>
      
      {/* Base plate */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.3, 0.04, 24]} />
        <meshStandardMaterial {...MATERIALS.oilStained} />
      </mesh>
      
      {/* Detector housing */}
      <mesh position={[0, 1.65, 0]} castShadow>
        <boxGeometry args={[0.4, 0.3, 0.25]} />
        <meshStandardMaterial
          color={colors.primary}
          roughness={0.45}
          metalness={0.5}
          emissive={colors.emissive}
          emissiveIntensity={colors.intensity}
        />
      </mesh>
      
      {/* Sensor dome */}
      <group ref={sensorRef} position={[0, 1.85, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color={hasLeak ? (criticalLeak ? '#ef4444' : '#f97316') : '#22c55e'}
            roughness={0.25}
            metalness={0.7}
            emissive={hasLeak ? (criticalLeak ? '#ef4444' : '#f97316') : '#22c55e'}
            emissiveIntensity={hasLeak ? 0.6 : 0.2}
          />
        </mesh>
        
        {/* Sensor mesh cover */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.05, 16]} />
          <meshStandardMaterial color="#9ca3af" wireframe />
        </mesh>
      </group>
      
      {/* Alert beacon */}
      <mesh ref={alertRef} position={[0, 2.05, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.04, 0.1, 8]} />
        <meshStandardMaterial
          color={criticalLeak ? '#dc2626' : hasLeak ? '#f97316' : '#22c55e'}
          emissive={criticalLeak ? '#dc2626' : hasLeak ? '#f97316' : '#22c55e'}
          emissiveIntensity={hasLeak ? 0.8 : 0.2}
        />
      </mesh>
      
      {/* Display panel */}
      <mesh position={[0, 1.65, 0.14]}>
        <boxGeometry args={[0.2, 0.12, 0.01]} />
        <meshBasicMaterial color={hasLeak ? '#ef4444' : '#1e293b'} />
      </mesh>
      
      {/* Cable conduit */}
      <mesh position={[0.15, 1.4, 0]} rotation={[0, 0, 0.3]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
        <meshStandardMaterial color="#4b5563" roughness={0.7} />
      </mesh>
      
      {/* Gas sampling tubes */}
      {[-0.12, 0.12].map((x, i) => (
        <mesh key={i} position={[x, 1.5, 0.15]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} />
          <meshStandardMaterial {...MATERIALS.pipeGas} />
        </mesh>
      ))}
      
      {hasLeak && !isShutdown && (
        <pointLight
          position={[0, 2, 0]}
          color={criticalLeak ? '#ef4444' : '#f97316'}
          intensity={criticalLeak ? 3 : 1.5}
          distance={6}
        />
      )}
    </group>
  );
}

// ============================================
// INDUSTRIAL MOTOR (Generic)
// Standard industrial electric motor
// ============================================
export function IndustrialMotor({ status = STATUS.NORMAL, machineData = {}, isShutdown = false }) {
  const shaftRef = useRef();
  const fanRef = useRef();
  const groupRef = useRef();
  
  const colors = STATUS_COLORS[status];

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (shaftRef.current && !isShutdown) {
      shaftRef.current.rotation.x += 0.12;
    }
    
    if (fanRef.current && !isShutdown) {
      fanRef.current.rotation.z += 0.18;
    }
    
    if (groupRef.current && status !== STATUS.NORMAL && status !== STATUS.OFFLINE && !isShutdown) {
      const mult = status === STATUS.CRITICAL ? 1.5 : 1;
      groupRef.current.position.x = Math.sin(t * 25) * 0.004 * mult;
      groupRef.current.position.z = Math.cos(t * 22) * 0.003 * mult;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Base */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.12, 0.7]} />
        <meshStandardMaterial {...MATERIALS.oilStained} />
      </mesh>
      
      {/* Motor body */}
      <mesh position={[0, 0.35, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.28, 0.32, 0.65, 32]} />
        <meshStandardMaterial
          color={colors.primary}
          roughness={0.45}
          metalness={0.7}
          emissive={colors.emissive}
          emissiveIntensity={colors.intensity}
        />
      </mesh>
      
      {/* Cooling fins */}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[0, 0.35, 0]} rotation={[0, (i * Math.PI) / 5, Math.PI / 2]} castShadow>
          <boxGeometry args={[0.02, 0.45, 0.38]} />
          <meshStandardMaterial {...MATERIALS.paintedSteel} />
        </mesh>
      ))}
      
      {/* Fan housing */}
      <mesh position={[-0.38, 0.35, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.1, 24]} />
        <meshStandardMaterial {...MATERIALS.wornMetal} />
      </mesh>
      
      {/* Fan */}
      <group ref={fanRef} position={[-0.42, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
        {Array.from({ length: 5 }, (_, i) => (
          <mesh key={i} rotation={[0, (i * Math.PI * 2) / 5, 0]}>
            <boxGeometry args={[0.16, 0.02, 0.04]} />
            <meshStandardMaterial color="#9ca3af" />
          </mesh>
        ))}
      </group>
      
      {/* Shaft */}
      <mesh ref={shaftRef} position={[0.4, 0.35, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.25, 16]} />
        <meshStandardMaterial color="#71717a" metalness={0.9} roughness={0.3} />
      </mesh>
      
      {/* Junction box */}
      <mesh position={[0, 0.65, 0.2]} castShadow>
        <boxGeometry args={[0.15, 0.12, 0.1]} />
        <meshStandardMaterial {...MATERIALS.paintedSteel} />
      </mesh>
      
      {/* Status light */}
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshBasicMaterial color={colors.glow} />
      </mesh>
      
      {status !== STATUS.OFFLINE && (
        <pointLight position={[0, 0.8, 0]} color={colors.glow} intensity={0.6} distance={2.5} />
      )}
    </group>
  );
}

// ============================================
// FACTORY FUNCTION - Entity Creator
// ============================================
export function createMachineEntity(type, props) {
  const componentMap = {
    'vibration-motor': VibrationMotor,
    'industrial-motor': IndustrialMotor,
    'thermal-pump': ThermalPump,
    'heat-exchanger': HeatExchanger,
    'humidity-controller': HumidityController,
    'air-compressor': AirCompressor,
    'gas-detector': GasDetector
  };
  
  const Component = componentMap[type] || IndustrialMotor;
  return <Component {...props} />;
}
