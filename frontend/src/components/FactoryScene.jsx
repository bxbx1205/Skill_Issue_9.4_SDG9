import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Grid } from '@react-three/drei';
import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import * as THREE from 'three';

// ============================================
// MACHINE CONFIGURATION & LAYOUT
// ============================================

const FACTORY_LAYOUT = {
  'vibration-motor': { position: [-12, 0, 2], type: 'motor', label: 'VIB-001', sensorType: 'VIB' },
  'temp-pump': { position: [-4, 0, 2], type: 'pump', label: 'TEMP-002', sensorType: 'TEMP' },
  'humidity-compressor': { position: [4, 0, 2], type: 'compressor', label: 'HUM-003', sensorType: 'HUM' },
  'gas-detector': { position: [12, 0, 2], type: 'gasDetector', label: 'GAS-004', sensorType: 'GAS' },
};

// ============================================
// CAMERA MODES
// ============================================

const CAMERA_MODES = {
  ORBIT: 'orbit',
  WALK: 'walk',
  DRONE: 'drone'
};

// First-Person Walker Controller
function FirstPersonController({ isActive }) {
  const { camera } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const keys = useRef({ forward: false, backward: false, left: false, right: false, sprint: false });
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const isLocked = useRef(false);
  
  const WALK_SPEED = 5;
  const SPRINT_SPEED = 10;
  const PLAYER_HEIGHT = 1.7;
  const BOUNDS = { minX: -23, maxX: 23, minZ: -16, maxZ: 16 };
  
  useEffect(() => {
    if (!isActive) return;
    
    const handleKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': keys.current.forward = true; break;
        case 'KeyS': case 'ArrowDown': keys.current.backward = true; break;
        case 'KeyA': case 'ArrowLeft': keys.current.left = true; break;
        case 'KeyD': case 'ArrowRight': keys.current.right = true; break;
        case 'ShiftLeft': case 'ShiftRight': keys.current.sprint = true; break;
      }
    };
    
    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': keys.current.forward = false; break;
        case 'KeyS': case 'ArrowDown': keys.current.backward = false; break;
        case 'KeyA': case 'ArrowLeft': keys.current.left = false; break;
        case 'KeyD': case 'ArrowRight': keys.current.right = false; break;
        case 'ShiftLeft': case 'ShiftRight': keys.current.sprint = false; break;
      }
    };
    
    const handleMouseMove = (e) => {
      if (!isLocked.current) return;
      const sensitivity = 0.002;
      euler.current.y -= e.movementX * sensitivity;
      euler.current.x -= e.movementY * sensitivity;
      euler.current.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
    };
    
    const handlePointerLockChange = () => {
      isLocked.current = document.pointerLockElement !== null;
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    
    camera.position.set(0, PLAYER_HEIGHT, 12);
    euler.current.set(0, 0, 0);
    camera.quaternion.setFromEuler(euler.current);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [isActive, camera]);
  
  useFrame((_, delta) => {
    if (!isActive) return;
    
    const speed = keys.current.sprint ? SPRINT_SPEED : WALK_SPEED;
    direction.current.set(0, 0, 0);
    
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    
    if (keys.current.forward) direction.current.add(forward);
    if (keys.current.backward) direction.current.sub(forward);
    if (keys.current.right) direction.current.add(right);
    if (keys.current.left) direction.current.sub(right);
    
    direction.current.normalize();
    velocity.current.lerp(direction.current.multiplyScalar(speed), 0.15);
    
    const newX = camera.position.x + velocity.current.x * delta;
    const newZ = camera.position.z + velocity.current.z * delta;
    
    camera.position.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, newX));
    camera.position.z = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, newZ));
    camera.position.y = PLAYER_HEIGHT;
  });
  
  return null;
}

// Drone Flight Controller
function DroneController({ isActive }) {
  const { camera } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const keys = useRef({ forward: false, backward: false, left: false, right: false, up: false, down: false, sprint: false });
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const isLocked = useRef(false);
  
  const FLY_SPEED = 8;
  const FAST_SPEED = 20;
  const BOUNDS = { minX: -28, maxX: 28, minY: 1, maxY: 20, minZ: -20, maxZ: 20 };
  
  useEffect(() => {
    if (!isActive) return;
    
    const handleKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': keys.current.forward = true; break;
        case 'KeyS': case 'ArrowDown': keys.current.backward = true; break;
        case 'KeyA': case 'ArrowLeft': keys.current.left = true; break;
        case 'KeyD': case 'ArrowRight': keys.current.right = true; break;
        case 'Space': keys.current.up = true; e.preventDefault(); break;
        case 'ControlLeft': case 'ControlRight': keys.current.down = true; break;
        case 'ShiftLeft': case 'ShiftRight': keys.current.sprint = true; break;
      }
    };
    
    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': keys.current.forward = false; break;
        case 'KeyS': case 'ArrowDown': keys.current.backward = false; break;
        case 'KeyA': case 'ArrowLeft': keys.current.left = false; break;
        case 'KeyD': case 'ArrowRight': keys.current.right = false; break;
        case 'Space': keys.current.up = false; break;
        case 'ControlLeft': case 'ControlRight': keys.current.down = false; break;
        case 'ShiftLeft': case 'ShiftRight': keys.current.sprint = false; break;
      }
    };
    
    const handleMouseMove = (e) => {
      if (!isLocked.current) return;
      const sensitivity = 0.002;
      euler.current.y -= e.movementX * sensitivity;
      euler.current.x -= e.movementY * sensitivity;
      euler.current.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
    };
    
    const handlePointerLockChange = () => {
      isLocked.current = document.pointerLockElement !== null;
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    
    camera.position.set(0, 10, 20);
    euler.current.set(-0.3, 0, 0);
    camera.quaternion.setFromEuler(euler.current);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [isActive, camera]);
  
  useFrame((_, delta) => {
    if (!isActive) return;
    
    const speed = keys.current.sprint ? FAST_SPEED : FLY_SPEED;
    const moveDir = new THREE.Vector3();
    
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    
    if (keys.current.forward) moveDir.add(forward);
    if (keys.current.backward) moveDir.sub(forward);
    if (keys.current.right) moveDir.add(right);
    if (keys.current.left) moveDir.sub(right);
    if (keys.current.up) moveDir.y += 1;
    if (keys.current.down) moveDir.y -= 1;
    
    moveDir.normalize();
    velocity.current.lerp(moveDir.multiplyScalar(speed), 0.1);
    
    const newPos = camera.position.clone().add(velocity.current.clone().multiplyScalar(delta));
    
    camera.position.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, newPos.x));
    camera.position.y = Math.max(BOUNDS.minY, Math.min(BOUNDS.maxY, newPos.y));
    camera.position.z = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, newPos.z));
  });
  
  return null;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getStatusColor(failureRisk) {
  if (failureRisk >= 70) return '#ef4444';
  if (failureRisk >= 50) return '#f97316';
  if (failureRisk >= 30) return '#eab308';
  return '#22c55e';
}

function getMachineColor(failureRisk) {
  if (failureRisk >= 70) return '#94a3b8';
  if (failureRisk >= 50) return '#9ca3af';
  return '#a8a29e';
}

// ============================================
// FACTORY FLOOR
// ============================================

function FactoryFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[50, 35]} />
        <meshStandardMaterial color="#475569" roughness={0.9} metalness={0.1} />
      </mesh>
      
      <Grid
        position={[0, 0.01, 0]}
        args={[50, 35]}
        cellSize={1}
        cellThickness={0.4}
        cellColor="#64748b"
        sectionSize={5}
        sectionThickness={0.8}
        sectionColor="#94a3b8"
        fadeDistance={40}
        fadeStrength={1}
        followCamera={false}
      />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -10]}>
        <planeGeometry args={[50, 2]} />
        <meshStandardMaterial color="#ca8a04" roughness={0.8} opacity={0.6} transparent />
      </mesh>
    </group>
  );
}

// ============================================
// GAS PIPE WITH LEAK DETECTION
// ============================================

function GasPipe({ start, end, radius = 0.08, hasLeak = false, valveClosed = false, onValveClose }) {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(endVec, startVec);
  const length = direction.length();
  const midpoint = startVec.clone().add(direction.clone().multiplyScalar(0.5));
  
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  const euler = new THREE.Euler().setFromQuaternion(quaternion);
  
  const leakRef = useRef();
  const valveRef = useRef();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (leakRef.current && hasLeak && !valveClosed) {
      leakRef.current.scale.setScalar(1 + Math.sin(t * 10) * 0.3);
      leakRef.current.material.opacity = 0.6 + Math.sin(t * 8) * 0.3;
    }
    if (valveRef.current && valveClosed) {
      valveRef.current.rotation.z = Math.PI / 2;
    }
  });

  const pipeColor = hasLeak && !valveClosed ? '#ef4444' : valveClosed ? '#6b7280' : '#eab308';

  return (
    <group>
      {/* Main pipe */}
      <mesh position={midpoint.toArray()} rotation={euler}>
        <cylinderGeometry args={[radius, radius, length, 16]} />
        <meshStandardMaterial color={pipeColor} roughness={0.3} metalness={0.8} />
      </mesh>
      
      {/* Pipe joints */}
      <mesh position={start}>
        <sphereGeometry args={[radius * 1.4, 12, 12]} />
        <meshStandardMaterial color={pipeColor} roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[radius * 1.4, 12, 12]} />
        <meshStandardMaterial color={pipeColor} roughness={0.3} metalness={0.8} />
      </mesh>
      
      {/* Gas leak visualization */}
      {hasLeak && !valveClosed && (
        <group position={midpoint.toArray()}>
          <mesh ref={leakRef}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={0.5} />
          </mesh>
          <pointLight color="#22c55e" intensity={2} distance={3} />
          
          {/* Leak particles */}
          {[...Array(8)].map((_, i) => (
            <mesh key={i} position={[
              Math.sin(i * 0.8) * 0.2,
              0.1 + Math.random() * 0.3,
              Math.cos(i * 0.8) * 0.2
            ]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial color="#4ade80" transparent opacity={0.7} />
            </mesh>
          ))}
        </group>
      )}
      
      {/* Valve */}
      <group position={midpoint.toArray()}>
        <mesh ref={valveRef} rotation={[Math.PI / 2, 0, valveClosed ? Math.PI / 2 : 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.05, 16]} />
          <meshStandardMaterial color={valveClosed ? '#ef4444' : '#22c55e'} roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.08, 0.15, 0.02]} />
          <meshStandardMaterial color="#1f2937" roughness={0.5} metalness={0.5} />
        </mesh>
      </group>
      
      {/* Warning label */}
      {hasLeak && !valveClosed && (
        <Html position={[midpoint.x, midpoint.y + 0.5, midpoint.z]} center>
          <div style={{
            background: 'rgba(239, 68, 68, 0.95)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 'bold',
            animation: 'pulse 1s infinite',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.5)'
          }} onClick={onValveClose}>
            GAS LEAK DETECTED!
            <div style={{ fontSize: 10, marginTop: 4 }}>Click to close valve</div>
          </div>
        </Html>
      )}
      
      {valveClosed && (
        <Html position={[midpoint.x, midpoint.y + 0.5, midpoint.z]} center>
          <div style={{
            background: 'rgba(34, 197, 94, 0.95)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 'bold'
          }}>
            VALVE CLOSED
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================
// GAS PIPE NETWORK
// ============================================

function GasPipeNetwork({ machines, valvesClosed, onValveClose }) {
  // Check if any machine has gas leak (simulated by high temperature or vibration)
  const hasGasLeak = machines.some(m => m.temperature > 60 || m.vibration === 1);
  
  return (
    <group>
      {/* Main gas line */}
      <GasPipe 
        start={[-20, 3, -5]} 
        end={[20, 3, -5]} 
        radius={0.1}
        hasLeak={hasGasLeak}
        valveClosed={valvesClosed['gas-main']}
        onValveClose={() => onValveClose('gas-main')}
      />
      
      {/* Branch lines to machines */}
      <GasPipe start={[-8, 3, -5]} end={[-8, 1.5, 2]} radius={0.06} />
      <GasPipe start={[0, 3, -5]} end={[0, 1.5, 2]} radius={0.06} />
      <GasPipe start={[8, 3, -5]} end={[8, 1.5, 2]} radius={0.06} />
      
      {/* Pipe supports */}
      {[-15, -8, 0, 8, 15].map((x, i) => (
        <mesh key={i} position={[x, 1.5, -5]}>
          <boxGeometry args={[0.1, 3, 0.1]} />
          <meshStandardMaterial color="#64748b" roughness={0.6} metalness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// PUMP MOTOR WITH REALISTIC ANIMATION
// ============================================

function PumpMotor({ position, machine, isShutdown, onShutdown }) {
  const pumpRef = useRef();
  const fanRef = useRef();
  const impellerRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  const isOverheating = machine.temperature > 55;
  const isCritical = machine.temperature > 70;
  const needsMaintenance = isOverheating || machine.vibration === 1;
  
  const motorColor = useMemo(() => {
    if (isShutdown) return '#4b5563';
    if (isCritical) return '#ef4444';
    if (isOverheating) return '#f97316';
    return '#3b82f6';
  }, [isShutdown, isCritical, isOverheating]);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (!isShutdown) {
      // Rotate impeller based on temperature
      if (impellerRef.current) {
        const speed = Math.min(machine.temperature / 30, 3);
        impellerRef.current.rotation.y += 0.1 * speed;
      }
      
      // Fan rotation - faster when overheating
      if (fanRef.current) {
        const fanSpeed = isOverheating ? 0.3 : 0.1;
        fanRef.current.rotation.z += fanSpeed;
      }
      
      // Vibration effect
      if (pumpRef.current && machine.vibration === 1) {
        pumpRef.current.position.x = position[0] + Math.sin(t * 40) * 0.01;
        pumpRef.current.position.z = position[2] + Math.cos(t * 35) * 0.008;
      }
    }
  });

  return (
    <group 
      ref={pumpRef} 
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Base Platform */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[2, 0.1, 1.5]} />
        <meshStandardMaterial color="#374151" roughness={0.8} metalness={0.3} />
      </mesh>
      
      {/* Motor Body */}
      <mesh position={[-0.4, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.6, 32]} />
        <meshStandardMaterial 
          color={motorColor} 
          roughness={0.4} 
          metalness={0.6}
          emissive={isCritical ? '#ef4444' : '#000'}
          emissiveIntensity={isCritical ? 0.5 : 0}
        />
      </mesh>
      
      {/* Cooling Fan Housing */}
      <mesh position={[-0.8, 0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 24]} />
        <meshStandardMaterial 
          color={isOverheating ? '#ef4444' : '#6b7280'}
          roughness={0.5} 
          metalness={0.5}
          emissive={isOverheating ? '#ef4444' : '#000'}
          emissiveIntensity={isOverheating ? 0.3 : 0}
        />
      </mesh>
      
      {/* Cooling Fan Blades */}
      <group ref={fanRef} position={[-0.85, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} rotation={[0, (i * Math.PI) / 3, 0]} position={[0, 0, 0]}>
            <boxGeometry args={[0.02, 0.18, 0.08]} />
            <meshStandardMaterial 
              color={isOverheating ? '#fca5a5' : '#9ca3af'}
              emissive={isOverheating ? '#ef4444' : '#000'}
              emissiveIntensity={isOverheating ? 0.5 : 0}
            />
          </mesh>
        ))}
      </group>
      
      {/* Pump Head */}
      <mesh position={[0.3, 0.35, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.6]} />
        <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.5} />
      </mesh>
      
      {/* Impeller Housing */}
      <mesh position={[0.6, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.3, 24]} />
        <meshStandardMaterial color="#0ea5e9" roughness={0.3} metalness={0.7} transparent opacity={0.8} />
      </mesh>
      
      {/* Rotating Impeller */}
      <group ref={impellerRef} position={[0.6, 0.35, 0]}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} rotation={[0, (i * Math.PI) / 3, 0]}>
            <boxGeometry args={[0.15, 0.02, 0.04]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
      </group>
      
      {/* Inlet Pipe */}
      <mesh position={[0.6, 0.35, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.3, 12]} />
        <meshStandardMaterial color="#6b7280" roughness={0.4} metalness={0.6} />
      </mesh>
      
      {/* Outlet Pipe */}
      <mesh position={[0.6, 0.6, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.3, 12]} />
        <meshStandardMaterial color="#6b7280" roughness={0.4} metalness={0.6} />
      </mesh>
      
      {/* Pressure Gauge */}
      <mesh position={[0.4, 0.7, 0.2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.3} metalness={0.4} />
      </mesh>
      
      {/* Critical Alert Light */}
      {(isCritical || isOverheating) && !isShutdown && (
        <pointLight position={[0, 1, 0]} color="#ef4444" intensity={2} distance={3} />
      )}
      
      {/* Status Label */}
      {hovered && (
        <Html position={[0, 1.2, 0]} center>
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: `2px solid ${isShutdown ? '#6b7280' : motorColor}`,
            borderRadius: 12,
            padding: '12px 16px',
            color: '#f1f5f9',
            fontSize: 12,
            minWidth: 180,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: motorColor }}>
              PUMP MOTOR
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <div>TEMP: <span style={{ color: isCritical ? '#ef4444' : isOverheating ? '#f97316' : '#22c55e' }}>{machine.temperature}°C</span></div>
              <div>HEALTH: <span style={{ color: machine.healthScore < 50 ? '#ef4444' : '#22c55e' }}>{machine.healthScore}%</span></div>
              <div>VIBRATION: <span style={{ color: machine.vibration === 1 ? '#ef4444' : '#22c55e' }}>{machine.vibration === 1 ? 'ALERT' : 'Normal'}</span></div>
              <div>STATUS: <span style={{ color: isShutdown ? '#6b7280' : '#22c55e' }}>{isShutdown ? 'SHUTDOWN' : 'Running'}</span></div>
            </div>
          </div>
        </Html>
      )}
      
      {/* Maintenance/Shutdown Button */}
      {needsMaintenance && !isShutdown && (
        <Html position={[0, 1.5, 0]} center>
          <div style={{
            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 'bold',
            cursor: 'pointer',
            animation: 'pulse 1s infinite',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.5)',
            textAlign: 'center'
          }} onClick={onShutdown}>
            MAINTENANCE REQUIRED
            <div style={{ fontSize: 10, marginTop: 4 }}>Click to shutdown motor</div>
          </div>
        </Html>
      )}
      
      {isShutdown && (
        <Html position={[0, 1, 0]} center>
          <div style={{
            background: 'rgba(107, 114, 128, 0.95)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 'bold'
          }}>
            MOTOR SHUTDOWN FOR MAINTENANCE
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================
// INDUSTRIAL FAN WITH TEMPERATURE RESPONSE
// ============================================

function IndustrialFan({ position, temperature, isShutdown }) {
  const fanRef = useRef();
  const housingRef = useRef();
  
  const isOverheating = temperature > 55;
  const isCritical = temperature > 70;
  
  useFrame((state) => {
    if (!isShutdown && fanRef.current) {
      // Fan speed increases with temperature
      const speed = Math.min(temperature / 20, 5) * 0.1;
      fanRef.current.rotation.z += speed;
    }
    
    // Pulsing effect when critical
    if (housingRef.current && isCritical && !isShutdown) {
      const t = state.clock.getElapsedTime();
      housingRef.current.material.emissiveIntensity = 0.3 + Math.sin(t * 5) * 0.2;
    }
  });
  
  const fanColor = useMemo(() => {
    if (isShutdown) return '#4b5563';
    if (isCritical) return '#ef4444';
    if (isOverheating) return '#f97316';
    return '#3b82f6';
  }, [isShutdown, isCritical, isOverheating]);

  return (
    <group position={position}>
      {/* Fan Housing */}
      <mesh ref={housingRef} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.3]} />
        <meshStandardMaterial 
          color={fanColor}
          roughness={0.5}
          metalness={0.5}
          emissive={isCritical ? '#ef4444' : '#000'}
          emissiveIntensity={isCritical ? 0.3 : 0}
        />
      </mesh>
      
      {/* Fan Guard */}
      <mesh position={[0, 0, 0.16]}>
        <ringGeometry args={[0.1, 0.35, 32]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.4} metalness={0.6} wireframe />
      </mesh>
      
      {/* Rotating Fan Blades */}
      <group ref={fanRef} position={[0, 0, 0.1]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 5]}>
            <boxGeometry args={[0.28, 0.08, 0.02]} />
            <meshStandardMaterial 
              color={isOverheating ? '#fca5a5' : '#e5e7eb'}
              emissive={isOverheating && !isShutdown ? '#ef4444' : '#000'}
              emissiveIntensity={isOverheating ? 0.4 : 0}
            />
          </mesh>
        ))}
      </group>
      
      {/* Status Light */}
      <mesh position={[0.3, 0.3, 0.16]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshBasicMaterial color={isShutdown ? '#6b7280' : isCritical ? '#ef4444' : '#22c55e'} />
      </mesh>
      
      {isCritical && !isShutdown && (
        <pointLight position={[0, 0, 0.5]} color="#ef4444" intensity={1.5} distance={2} />
      )}
    </group>
  );
}

// ============================================
// MACHINE GEOMETRIES
// ============================================

function MotorGeometry({ color, emissiveIntensity, temperature, isShutdown }) {
  const fanRef = useRef();
  const isOverheating = temperature > 55;
  
  useFrame(() => {
    if (fanRef.current && !isShutdown) {
      const speed = Math.min(temperature / 25, 4) * 0.1;
      fanRef.current.rotation.z += speed;
    }
  });
  
  return (
    <group>
      {/* Motor housing */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.45, 0.65, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.65}
          emissive={emissiveIntensity > 0 ? '#ef4444' : '#000'}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      
      {/* Cooling Fan */}
      <group position={[0, 0.9, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.25, 0.25, 0.1, 24]} />
          <meshStandardMaterial 
            color={isOverheating ? '#ef4444' : '#6b7280'}
            emissive={isOverheating ? '#ef4444' : '#000'}
            emissiveIntensity={isOverheating ? 0.4 : 0}
          />
        </mesh>
        <group ref={fanRef} position={[0, 0.06, 0]}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <mesh key={i} rotation={[0, (i * Math.PI) / 3, 0]}>
              <boxGeometry args={[0.18, 0.02, 0.04]} />
              <meshStandardMaterial 
                color={isOverheating ? '#fca5a5' : '#9ca3af'}
                emissive={isOverheating ? '#ef4444' : '#000'}
                emissiveIntensity={isOverheating ? 0.3 : 0}
              />
            </mesh>
          ))}
        </group>
      </group>
      
      {/* Cooling fins */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[0, 0.5, 0]} rotation={[0, (i * Math.PI) / 3, 0]} castShadow>
          <boxGeometry args={[0.48, 0.45, 0.025]} />
          <meshStandardMaterial color="#71717a" roughness={0.5} metalness={0.5} />
        </mesh>
      ))}
      
      {/* Base mount */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.65, 0.2, 0.65]} />
        <meshStandardMaterial color="#525252" roughness={0.7} metalness={0.3} />
      </mesh>
      
      {/* Temperature indicator */}
      {isOverheating && (
        <IndustrialFan position={[0.5, 0.5, 0]} temperature={temperature} isShutdown={isShutdown} />
      )}
    </group>
  );
}

function PumpGeometry({ color, emissiveIntensity }) {
  return (
    <group>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.6, 0.55, 0.45]} />
        <meshStandardMaterial
          color={color}
          roughness={0.35}
          metalness={0.65}
          emissive={emissiveIntensity > 0 ? '#ef4444' : '#000'}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 0.22, 24]} />
        <meshStandardMaterial
          color={color}
          roughness={0.35}
          metalness={0.65}
          emissive={emissiveIntensity > 0 ? '#ef4444' : '#000'}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      
      <mesh position={[-0.4, 0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.2, 16]} />
        <meshStandardMaterial color="#a1a1aa" roughness={0.4} metalness={0.7} />
      </mesh>
      
      <mesh position={[0.4, 0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.2, 16]} />
        <meshStandardMaterial color="#a1a1aa" roughness={0.4} metalness={0.7} />
      </mesh>
      
      <mesh position={[0, 0.06, 0]} castShadow>
        <boxGeometry args={[0.75, 0.12, 0.55]} />
        <meshStandardMaterial color="#525252" roughness={0.7} metalness={0.3} />
      </mesh>
    </group>
  );
}

function CompressorGeometry({ color, emissiveIntensity }) {
  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.32, 0.5, 8, 24]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.65}
          emissive={emissiveIntensity > 0 ? '#ef4444' : '#000'}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      
      <mesh position={[0.4, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.35, 16]} />
        <meshStandardMaterial color="#404040" roughness={0.5} metalness={0.5} />
      </mesh>
      
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.1, 12]} />
        <meshStandardMaterial color="#dc2626" roughness={0.5} metalness={0.5} />
      </mesh>
      
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.42, 0.16, 24]} />
        <meshStandardMaterial color="#525252" roughness={0.7} metalness={0.3} />
      </mesh>
    </group>
  );
}

// ============================================
// GAS DETECTOR GEOMETRY
// ============================================

function GasDetectorGeometry({ color, emissiveIntensity, gasLevel = 100, isShutdown }) {
  const sensorRef = useRef();
  const alertRef = useRef();
  
  const hasGasLeak = gasLevel > 300;
  const isCriticalLeak = gasLevel > 500;
  
  useFrame((state) => {
    if (!sensorRef.current || isShutdown) return;
    const t = state.clock.getElapsedTime();
    
    // Pulsing sensor when gas detected
    if (hasGasLeak && alertRef.current) {
      alertRef.current.material.emissiveIntensity = 0.5 + Math.sin(t * 8) * 0.5;
    }
  });

  return (
    <group ref={sensorRef}>
      {/* Main housing */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.5, 0.6, 0.35]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.6}
          emissive={emissiveIntensity > 0 ? '#ef4444' : '#000'}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      
      {/* Sensor dome */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial 
          color={hasGasLeak ? '#ef4444' : '#22c55e'} 
          roughness={0.3} 
          metalness={0.7}
          emissive={hasGasLeak ? '#ef4444' : '#000'}
          emissiveIntensity={hasGasLeak ? 0.5 : 0}
        />
      </mesh>
      
      {/* Alert light on top */}
      <mesh ref={alertRef} position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 0.1, 8]} />
        <meshStandardMaterial 
          color={isCriticalLeak ? '#dc2626' : hasGasLeak ? '#f97316' : '#22c55e'}
          emissive={isCriticalLeak ? '#dc2626' : hasGasLeak ? '#f97316' : '#22c55e'}
          emissiveIntensity={hasGasLeak ? 0.8 : 0.2}
        />
      </mesh>
      
      {/* Display panel */}
      <mesh position={[0, 0.5, 0.19]} castShadow>
        <boxGeometry args={[0.3, 0.2, 0.02]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} metalness={0.1} />
      </mesh>
      
      {/* Gas inlet pipes */}
      <mesh position={[-0.35, 0.35, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.2, 12]} />
        <meshStandardMaterial color="#404040" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[0.35, 0.35, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.2, 12]} />
        <meshStandardMaterial color="#404040" roughness={0.6} metalness={0.5} />
      </mesh>
      
      {/* Base plate */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.6, 0.1, 0.45]} />
        <meshStandardMaterial color="#525252" roughness={0.7} metalness={0.3} />
      </mesh>
    </group>
  );
}

// ============================================
// MACHINE PLATFORM
// ============================================

function MachinePlatform({ position, statusColor, isCritical }) {
  const ringRef = useRef();
  
  useFrame((state) => {
    if (ringRef.current && isCritical) {
      const t = state.clock.getElapsedTime();
      ringRef.current.material.opacity = 0.35 + Math.sin(t * 5) * 0.25;
    }
  });

  return (
    <group position={[position[0], 0.01, position[2]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <boxGeometry args={[1.5, 1.5, 0.08]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} metalness={0.1} />
      </mesh>
      
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.65, 0.72, 48]} />
        <meshBasicMaterial color={statusColor} transparent opacity={isCritical ? 0.6 : 0.3} />
      </mesh>
    </group>
  );
}

// ============================================
// ATTENTION PARTICLES - Floating particles for machines needing attention
// ============================================

function AttentionParticles({ position, color = '#f59e0b' }) {
  const particlesRef = useRef();
  const count = 20;
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 2,
          Math.random() * 2,
          (Math.random() - 0.5) * 2
        ],
        speed: 0.5 + Math.random() * 1,
        offset: Math.random() * Math.PI * 2
      });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const t = state.clock.getElapsedTime();
    
    particlesRef.current.children.forEach((particle, i) => {
      const p = particles[i];
      particle.position.y = (t * p.speed + p.offset) % 3;
      particle.position.x = p.position[0] + Math.sin(t * 2 + p.offset) * 0.2;
      particle.position.z = p.position[2] + Math.cos(t * 2 + p.offset) * 0.2;
      particle.material.opacity = 0.3 + Math.sin(t * 4 + p.offset) * 0.3;
    });
  });

  return (
    <group ref={particlesRef} position={position}>
      {particles.map((p, i) => (
        <mesh key={i} position={p.position}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// ATTENTION RING - Pulsing ring around machines needing attention
// ============================================

function AttentionRing({ position, color = '#f59e0b' }) {
  const ringRef = useRef();
  const ring2Ref = useRef();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (ringRef.current) {
      ringRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.15);
      ringRef.current.material.opacity = 0.4 + Math.sin(t * 3) * 0.2;
      ringRef.current.rotation.z = t * 0.5;
    }
    
    if (ring2Ref.current) {
      ring2Ref.current.scale.setScalar(1.2 + Math.sin(t * 2 + 1) * 0.1);
      ring2Ref.current.material.opacity = 0.2 + Math.sin(t * 2 + 1) * 0.15;
      ring2Ref.current.rotation.z = -t * 0.3;
    }
  });

  return (
    <group position={[position[0], 0.02, position[2]]}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.0, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.2, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ============================================
// MACHINE COMPONENT
// ============================================

function Machine({ machine, config, onSelect, isShutdown, onShutdown, needsAttention = false }) {
  const groupRef = useRef();
  const alertLightRef = useRef();
  const glowRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // Check conditions based on sensor type
  const isGasSensor = config.sensorType === 'GAS';
  const hasGasLeak = isGasSensor && machine.gasLevel > 300;
  const isCriticalLeak = isGasSensor && machine.gasLevel > 500;
  
  const isCritical = machine.failureRisk >= 70 || machine.status === 'Critical';
  const isWarning = machine.failureRisk >= 50 || machine.status === 'Warning';
  const hasVibration = machine.vibration === 1;
  const needsMaintenance = isCritical || hasGasLeak;
  
  const statusColor = useMemo(() => getStatusColor(machine.failureRisk), [machine.failureRisk]);
  const attentionColor = isCritical ? '#ef4444' : isWarning ? '#f97316' : '#f59e0b';
  
  const machineColor = useMemo(() => {
    if (isShutdown) return '#4b5563';
    if (isCritical || isCriticalLeak) return '#ef4444';
    if (isWarning || hasGasLeak) return '#f97316';
    if (needsAttention) return '#f59e0b';
    return getMachineColor(machine.failureRisk);
  }, [machine.failureRisk, isShutdown, isCritical, isWarning, hasGasLeak, isCriticalLeak, needsAttention]);
  
  const emissiveIntensity = (isCritical || isCriticalLeak || needsAttention) && !isShutdown ? 0.4 : 0;

  useFrame((state) => {
    if (!groupRef.current || isShutdown) return;
    const t = state.clock.getElapsedTime();
    
    // Vibration effect
    if (hasVibration || needsAttention) {
      const vibIntensity = hasVibration ? 0.006 : 0.003;
      const vibSpeed = hasVibration ? 30 : 15;
      groupRef.current.position.x = config.position[0] + Math.sin(t * vibSpeed) * vibIntensity;
      groupRef.current.position.z = config.position[2] + Math.cos(t * vibSpeed * 1.2) * vibIntensity;
    }
    
    // Bobbing effect for attention
    if (needsAttention && !hasVibration) {
      groupRef.current.position.y = Math.sin(t * 2) * 0.02;
    }
    
    if (alertLightRef.current && (isCritical || isCriticalLeak || needsAttention)) {
      alertLightRef.current.intensity = 1.2 + Math.sin(t * (needsAttention ? 4 : 8)) * 0.6;
    }
    
    // Glow pulsing for attention
    if (glowRef.current && needsAttention) {
      glowRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.1);
      glowRef.current.material.opacity = 0.15 + Math.sin(t * 3) * 0.1;
    }
  });

  const GeometryComponent = {
    motor: MotorGeometry,
    pump: PumpGeometry,
    compressor: CompressorGeometry,
    gasDetector: GasDetectorGeometry,
  }[config.type] || MotorGeometry;

  return (
    <group>
      <MachinePlatform position={config.position} statusColor={needsAttention ? attentionColor : statusColor} isCritical={isCritical || needsAttention} />
      
      {/* Attention Effects */}
      {needsAttention && !isShutdown && (
        <>
          <AttentionRing position={config.position} color={attentionColor} />
          <AttentionParticles position={[config.position[0], 0.5, config.position[2]]} color={attentionColor} />
          
          {/* Glow sphere */}
          <mesh ref={glowRef} position={[config.position[0], 0.8, config.position[2]]}>
            <sphereGeometry args={[1.2, 16, 16]} />
            <meshBasicMaterial color={attentionColor} transparent opacity={0.15} />
          </mesh>
          
          {/* Spotlight from above */}
          <spotLight
            position={[config.position[0], 4, config.position[2]]}
            target-position={config.position}
            angle={0.4}
            penumbra={0.5}
            intensity={1.5}
            color={attentionColor}
            distance={8}
          />
        </>
      )}
      
      <group
        ref={groupRef}
        position={config.position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onSelect(machine)}
      >
        <GeometryComponent 
          color={machineColor} 
          emissiveIntensity={emissiveIntensity}
          temperature={machine.temperature}
          gasLevel={machine.gasLevel || 0}
          isShutdown={isShutdown}
        />
        
        {/* Alert light for critical or attention states */}
        {(isCritical || isCriticalLeak || needsAttention) && !isShutdown && (
          <pointLight 
            ref={alertLightRef} 
            position={[0, 1.5, 0]} 
            color={attentionColor} 
            intensity={1.2} 
            distance={4} 
          />
        )}
        
        {/* Attention Badge floating above machine */}
        {needsAttention && !isShutdown && (
          <Html position={[0, 2.5, 0]} center>
            <div style={{
              background: `linear-gradient(135deg, ${attentionColor}, ${isCritical ? '#dc2626' : '#ea580c'})`,
              color: 'white',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: `0 4px 20px ${attentionColor}80`,
              animation: 'bounce 1s infinite'
            }}>
              <span style={{ animation: 'spin 2s linear infinite' }}>!</span>
              NEEDS ATTENTION
            </div>
          </Html>
        )}
        
        {hovered && (
          <Html position={[0, 1.8, 0]} center distanceFactor={8}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: `2px solid ${needsAttention ? attentionColor : statusColor}`,
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#f1f5f9',
              fontSize: '12px',
              minWidth: '180px',
              backdropFilter: 'blur(10px)',
              boxShadow: `0 8px 32px rgba(0,0,0,0.5)${needsAttention ? `, 0 0 20px ${attentionColor}40` : ''}`,
            }}>
              <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '8px', color: needsAttention ? attentionColor : statusColor }}>
                {config.label} - {machine.name}
                {needsAttention && <span style={{ marginLeft: 8, fontSize: 10 }}>MONITORING</span>}
              </div>
              <div style={{ display: 'grid', gap: '5px' }}>
                <div>SENSOR: <span style={{ fontWeight: 600, color: '#60a5fa' }}>{config.sensorType}</span></div>
                <div>VALUE: <span style={{ color: needsAttention ? attentionColor : statusColor, fontWeight: 600 }}>
                  {machine.sensorValue !== undefined ? 
                    (config.sensorType === 'TEMP' ? `${machine.sensorValue?.toFixed(1)}°C` :
                     config.sensorType === 'HUM' ? `${machine.sensorValue?.toFixed(1)}%` :
                     config.sensorType === 'GAS' ? `${machine.sensorValue?.toFixed(0)} ppm` :
                     machine.sensorValue?.toFixed(2)) : 'N/A'}
                </span></div>
                <div>HEALTH: <span style={{ color: statusColor, fontWeight: 600 }}>{machine.healthScore}%</span></div>
                <div>RISK: <span style={{ color: statusColor, fontWeight: 600 }}>{machine.failureRisk}%</span></div>
                {isGasSensor && (
                  <div>GAS: <span style={{ color: isCriticalLeak ? '#ef4444' : hasGasLeak ? '#f97316' : '#22c55e', fontWeight: 600 }}>
                    {isCriticalLeak ? 'CRITICAL LEAK!' : hasGasLeak ? 'LEAK DETECTED' : 'Normal'}
                  </span></div>
                )}
                <div>ALERT: <span style={{ color: hasVibration ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                  {hasVibration ? 'TRIGGERED' : 'Normal'}
                </span></div>
                <div>STATUS: <span style={{ color: isShutdown ? '#6b7280' : isCritical ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                  {isShutdown ? 'SHUTDOWN' : machine.status}
                </span></div>
              </div>
            </div>
          </Html>
        )}
        
        {/* Maintenance Button */}
        {needsMaintenance && !isShutdown && (
          <Html position={[0, 2.2, 0]} center>
            <div style={{
              background: hasGasLeak ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'linear-gradient(135deg, #dc2626, #991b1b)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 'bold',
              cursor: 'pointer',
              animation: 'pulse 1s infinite',
              boxShadow: hasGasLeak ? '0 4px 20px rgba(249, 115, 22, 0.5)' : '0 4px 20px rgba(239, 68, 68, 0.5)',
              textAlign: 'center'
            }} onClick={(e) => { e.stopPropagation(); onShutdown(); }}>
              {isCriticalLeak ? 'GAS LEAK!' : hasGasLeak ? 'GAS ALERT' : isCritical ? 'CRITICAL!' : 'ALERT'}
              <div style={{ fontSize: 9, marginTop: 2 }}>
                {hasGasLeak ? 'Click to close valve' : 'Click to shutdown'}
              </div>
            </div>
          </Html>
        )}
        
        {isShutdown && (
          <Html position={[0, 1.5, 0]} center>
            <div style={{
              background: 'rgba(107, 114, 128, 0.95)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 'bold'
            }}>
              MAINTENANCE MODE
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

// ============================================
// STORAGE TANK
// ============================================

function StorageTank({ position, height = 4, radius = 1, color = '#22c55e' }) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2 + 0.3, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, height, 32]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.7} />
      </mesh>
      
      <mesh position={[0, height + 0.3, 0]} castShadow>
        <sphereGeometry args={[radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.7} />
      </mesh>
      
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[radius + 0.15, radius + 0.2, 0.3, 32]} />
        <meshStandardMaterial color="#52525b" roughness={0.7} metalness={0.3} />
      </mesh>
    </group>
  );
}

// ============================================
// LIGHTING
// ============================================

function IndustrialLighting() {
  return (
    <>
      <ambientLight intensity={0.5} color="#f1f5f9" />
      
      <directionalLight
        position={[15, 20, 15]}
        intensity={1.3}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={70}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
      />
      
      <directionalLight position={[-15, 15, -10]} intensity={0.5} color="#dbeafe" />
      
      {[
        [-12, 6, 0], [0, 6, 0], [12, 6, 0],
      ].map((pos, i) => (
        <group key={i}>
          <mesh position={pos}>
            <boxGeometry args={[1.2, 0.12, 0.35]} />
            <meshStandardMaterial color="#404040" roughness={0.6} metalness={0.4} />
          </mesh>
          <pointLight position={pos} color="#fef3c7" intensity={0.4} distance={10} />
        </group>
      ))}
    </>
  );
}

// ============================================
// WALLS
// ============================================

function Walls() {
  return (
    <group>
      <mesh position={[0, 3.5, -17]}>
        <boxGeometry args={[50, 7, 0.25]} />
        <meshStandardMaterial color="#334155" roughness={0.85} />
      </mesh>
      
      <mesh position={[-25, 3.5, 0]}>
        <boxGeometry args={[0.25, 7, 35]} />
        <meshStandardMaterial color="#334155" roughness={0.85} />
      </mesh>
      <mesh position={[25, 3.5, 0]}>
        <boxGeometry args={[0.25, 7, 35]} />
        <meshStandardMaterial color="#334155" roughness={0.85} />
      </mesh>
    </group>
  );
}

// ============================================
// MAIN FACTORY CONTENT
// ============================================

function FactoryContent({ machines, onMachineSelect, cameraMode, motorShutdown, valvesClosed, needsAttention, onMotorShutdown, onValveClose }) {
  return (
    <>
      <IndustrialLighting />
      <fog attach="fog" args={['#1e293b', 25, 60]} />
      
      <FactoryFloor />
      <Walls />
      
      {/* Gas Pipe Network with leak detection */}
      <GasPipeNetwork 
        machines={machines}
        valvesClosed={valvesClosed}
        onValveClose={onValveClose}
      />
      
      {/* Pump Motor - dedicated visualization */}
      {machines.length > 0 && (
        <PumpMotor 
          position={[-15, 0, 8]}
          machine={machines[0]}
          isShutdown={motorShutdown['pump-motor-1']}
          onShutdown={() => onMotorShutdown('pump-motor-1')}
        />
      )}
      
      {/* Storage Tanks */}
      <StorageTank position={[18, 0, 0]} height={5} radius={1.3} color="#22c55e" />
      <StorageTank position={[21.5, 0, 0]} height={5} radius={1.3} color="#22c55e" />
      
      {/* API-connected Machines */}
      {machines.map((machine) => {
        const config = FACTORY_LAYOUT[machine.id];
        if (!config) return null;
        return (
          <Machine
            key={machine.id}
            machine={machine}
            config={config}
            onSelect={onMachineSelect}
            isShutdown={motorShutdown[machine.id]}
            needsAttention={!!needsAttention[machine.id]}
            onShutdown={() => onMotorShutdown(machine.id)}
          />
        );
      })}
      
      {/* Camera Controllers */}
      {cameraMode === CAMERA_MODES.ORBIT && (
        <OrbitControls
          makeDefault
          minDistance={8}
          maxDistance={45}
          minPolarAngle={0.3}
          maxPolarAngle={Math.PI / 2.15}
          target={[0, 1.5, 0]}
          enableDamping
          dampingFactor={0.05}
        />
      )}
      
      <FirstPersonController isActive={cameraMode === CAMERA_MODES.WALK} />
      <DroneController isActive={cameraMode === CAMERA_MODES.DRONE} />
    </>
  );
}

// ============================================
// MAIN EXPORT
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
  const [cameraMode, setCameraMode] = useState(CAMERA_MODES.ORBIT);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Digit1' || e.code === 'Numpad1') {
        setCameraMode(CAMERA_MODES.ORBIT);
        if (document.pointerLockElement) document.exitPointerLock();
      }
      if (e.code === 'Digit2' || e.code === 'Numpad2') {
        setCameraMode(CAMERA_MODES.WALK);
      }
      if (e.code === 'Digit3' || e.code === 'Numpad3') {
        setCameraMode(CAMERA_MODES.DRONE);
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
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, []);

  const handleCanvasClick = useCallback(() => {
    if ((cameraMode === CAMERA_MODES.WALK || cameraMode === CAMERA_MODES.DRONE) && 
        canvasRef.current && !document.pointerLockElement) {
      canvasRef.current.requestPointerLock();
    }
  }, [cameraMode]);

  if (!isLoaded) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#94a3b8',
      }}>
        Loading Factory...
      </div>
    );
  }

  // Handle WebGL context lost
  if (contextLost) {
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
        gap: 16
      }}>
        <span style={{ fontSize: 40, color: '#f59e0b' }}>!</span>
        <span>3D View temporarily unavailable</span>
        <button 
          onClick={() => { setContextLost(false); setIsLoaded(false); setTimeout(() => setIsLoaded(true), 100); }}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          Reload 3D View
        </button>
      </div>
    );
  }

  // Check for active alerts
  const hasGasLeak = machines.some(m => m.temperature > 60 || m.vibration === 1);
  const hasCriticalMachine = machines.some(m => m.failureRisk >= 70 || m.temperature > 70);

  // Handle WebGL context loss/restore
  const handleCreated = ({ gl }) => {
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
  };

  return (
    <div 
      ref={canvasRef}
      onClick={handleCanvasClick}
      style={{ width: '100%', height: '100%', background: '#0f172a', position: 'relative' }}
    >
      <Canvas
        shadows="soft"
        camera={{ position: [20, 15, 25], fov: 50, near: 0.1, far: 150 }}
        gl={{ 
          antialias: false,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: false
        }}
        dpr={[1, 1.5]}
        onCreated={handleCreated}
      >
        <FactoryContent 
          machines={machines} 
          onMachineSelect={onMachineSelect}
          cameraMode={cameraMode}
          motorShutdown={motorShutdown}
          valvesClosed={valvesClosed}
          needsAttention={needsAttention}
          onMotorShutdown={onMotorShutdown}
          onValveClose={onValveClose}
        />
      </Canvas>
      
      {/* Alert Banner */}
      {(hasGasLeak || hasCriticalMachine) && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
          color: 'white',
          padding: '8px 16px',
          fontSize: 12,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          animation: 'pulse 2s infinite'
        }}>
          <span>ALERTS:</span>
          {hasGasLeak && <span>GAS LEAK DETECTED</span>}
          {hasCriticalMachine && <span>CRITICAL TEMPERATURE</span>}
          <span style={{ fontSize: 10 }}>Check 3D view for actions</span>
        </div>
      )}
      
      {/* Camera Mode Toggle UI */}
      <div style={{
        position: 'absolute',
        top: hasGasLeak || hasCriticalMachine ? '50px' : '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '4px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderRadius: '10px',
        padding: '6px',
        backdropFilter: 'blur(12px)',
        border: '1px solid #334155',
      }}>
        {[
          { mode: CAMERA_MODES.ORBIT, label: 'Orbit', icon: 'O', key: '1' },
          { mode: CAMERA_MODES.WALK, label: 'Walk', icon: 'W', key: '2' },
          { mode: CAMERA_MODES.DRONE, label: 'Drone', icon: 'D', key: '3' },
        ].map(({ mode, label, icon, key }) => (
          <button
            key={mode}
            onClick={(e) => {
              e.stopPropagation();
              setCameraMode(mode);
              if (mode === CAMERA_MODES.ORBIT && document.pointerLockElement) {
                document.exitPointerLock();
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              background: cameraMode === mode 
                ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
                : 'transparent',
              color: cameraMode === mode ? '#fff' : '#94a3b8',
            }}
          >
            <span>{icon}</span>
            <span>{label}</span>
            <span style={{ fontSize: '9px', opacity: 0.6 }}>{key}</span>
          </button>
        ))}
      </div>
      
      {/* Controls Help */}
      {(cameraMode === CAMERA_MODES.WALK || cameraMode === CAMERA_MODES.DRONE) && (
        <div style={{
          position: 'absolute',
          top: hasGasLeak || hasCriticalMachine ? '110px' : '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: isPointerLocked ? 'rgba(15, 23, 42, 0.85)' : 'rgba(59, 130, 246, 0.9)',
          borderRadius: '8px',
          padding: '10px 16px',
          fontSize: '11px',
          color: '#fff',
        }}>n          {!isPointerLocked ? (
            <div>Click to enable controls</div>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <span><b>WASD</b> Move</span>
              <span><b>Mouse</b> Look</span>
              <span><b>ESC</b> Release</span>
            </div>
          )}
        </div>
      )}
      
      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        background: 'rgba(15, 23, 42, 0.92)',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '11px',
        color: '#94a3b8',
      }}>
        <div style={{ fontWeight: '600', marginBottom: '6px', color: '#e2e8f0' }}>IoT Status Legend</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span><span style={{ color: '#22c55e' }}>●</span> Normal</span>
          <span><span style={{ color: '#eab308' }}>●</span> Warning</span>
          <span><span style={{ color: '#f97316' }}>●</span> High Temp</span>
          <span><span style={{ color: '#ef4444' }}>●</span> Critical</span>
        </div>
        <div style={{ marginTop: '5px', fontSize: '10px', color: '#64748b' }}>
          Real-time data from IoT sensors • Hover for details • Click alerts to take action
        </div>
      </div>
    </div>
  );
}
