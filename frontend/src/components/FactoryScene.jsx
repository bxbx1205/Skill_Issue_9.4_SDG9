import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Grid, PointerLockControls } from '@react-three/drei';
import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import * as THREE from 'three';

// ============================================
// MACHINE CONFIGURATION & LAYOUT
// ============================================

const FACTORY_LAYOUT = {
  'motor-a': { position: [-6, 0, 2], type: 'motor', label: 'M-001' },
  'pump-b': { position: [0, 0, 2], type: 'pump', label: 'P-002' },
  'compressor-c': { position: [6, 0, 2], type: 'compressor', label: 'C-003' },
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
function FirstPersonController({ isActive, playerRef }) {
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
    
    // Set initial camera position for walk mode
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
    
    // Update player visual position
    if (playerRef.current) {
      playerRef.current.position.copy(camera.position);
      playerRef.current.position.y = 0;
      playerRef.current.rotation.y = euler.current.y + Math.PI;
    }
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
    
    // Set initial camera position for drone mode
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

// Player Character Model (visible in orbit mode)
function PlayerCharacter({ position, visible }) {
  const group = useRef();
  
  if (!visible) return null;
  
  return (
    <group ref={group} position={position}>
      {/* Body */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.6, 8, 16]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.6} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#fcd34d" roughness={0.5} />
      </mesh>
      
      {/* Hard hat */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.2, 0.08, 16]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.66, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.04, 16]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.4} />
      </mesh>
      
      {/* Safety Vest */}
      <mesh position={[0, 0.95, 0.13]} castShadow>
        <boxGeometry args={[0.45, 0.5, 0.08]} />
        <meshStandardMaterial color="#f97316" roughness={0.7} emissive="#f97316" emissiveIntensity={0.2} />
      </mesh>
      
      {/* Reflective stripes */}
      <mesh position={[0, 1.05, 0.18]}>
        <boxGeometry args={[0.4, 0.04, 0.01]} />
        <meshStandardMaterial color="#e5e7eb" emissive="#e5e7eb" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.85, 0.18]}>
        <boxGeometry args={[0.4, 0.04, 0.01]} />
        <meshStandardMaterial color="#e5e7eb" emissive="#e5e7eb" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.1, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.8} />
      </mesh>
      <mesh position={[0.1, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.8} />
      </mesh>
      
      {/* Boots */}
      <mesh position={[-0.1, 0.06, 0.03]} castShadow>
        <boxGeometry args={[0.12, 0.12, 0.2]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      <mesh position={[0.1, 0.06, 0.03]} castShadow>
        <boxGeometry args={[0.12, 0.12, 0.2]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
    </group>
  );
}

// Drone Visual Model
function DroneModel({ visible, cameraRef }) {
  const group = useRef();
  const propellers = useRef([]);
  
  useFrame(() => {
    if (!visible || !group.current) return;
    // Spin propellers
    propellers.current.forEach((p, i) => {
      if (p) p.rotation.y += 0.5 * (i % 2 === 0 ? 1 : -1);
    });
  });
  
  if (!visible) return null;
  
  return (
    <group ref={group} position={[0, 8, 15]}>
      {/* Drone body */}
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.1, 0.4]} />
        <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Camera dome */}
      <mesh position={[0, -0.08, 0.1]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#0ea5e9" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Arms and propellers */}
      {[[-0.3, 0, -0.3], [0.3, 0, -0.3], [-0.3, 0, 0.3], [0.3, 0, 0.3]].map((pos, i) => (
        <group key={i} position={pos}>
          {/* Arm */}
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
          {/* Motor */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.05, 8]} />
            <meshStandardMaterial color="#4b5563" metalness={0.7} />
          </mesh>
          {/* Propeller */}
          <mesh ref={el => propellers.current[i] = el} position={[0, 0.09, 0]}>
            <boxGeometry args={[0.25, 0.01, 0.03]} />
            <meshStandardMaterial color="#9ca3af" transparent opacity={0.7} />
          </mesh>
        </group>
      ))}
      
      {/* LEDs */}
      <pointLight position={[0.3, 0, 0.3]} color="#22c55e" intensity={0.5} distance={2} />
      <pointLight position={[-0.3, 0, 0.3]} color="#22c55e" intensity={0.5} distance={2} />
      <pointLight position={[0.3, 0, -0.3]} color="#ef4444" intensity={0.5} distance={2} />
      <pointLight position={[-0.3, 0, -0.3]} color="#ef4444" intensity={0.5} distance={2} />
    </group>
  );
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
      {/* Main concrete floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[50, 35]} />
        <meshStandardMaterial color="#475569" roughness={0.9} metalness={0.1} />
      </mesh>
      
      {/* Floor grid */}
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
      
      {/* Yellow safety walkways */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -10]}>
        <planeGeometry args={[50, 2]} />
        <meshStandardMaterial color="#ca8a04" roughness={0.8} opacity={0.6} transparent />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 10]}>
        <planeGeometry args={[50, 2]} />
        <meshStandardMaterial color="#ca8a04" roughness={0.8} opacity={0.6} transparent />
      </mesh>
      
      {/* Hazard stripes near conveyors */}
      {[-18, -12, -6, 0, 6, 12, 18].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, -4]}>
          <planeGeometry args={[0.15, 8]} />
          <meshBasicMaterial color="#eab308" opacity={0.5} transparent />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// PIPE COMPONENT
// ============================================

function Pipe({ start, end, radius = 0.06, color = '#fbbf24' }) {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(endVec, startVec);
  const length = direction.length();
  const midpoint = startVec.clone().add(direction.clone().multiplyScalar(0.5));
  
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  const euler = new THREE.Euler().setFromQuaternion(quaternion);

  return (
    <group>
      <mesh position={midpoint.toArray()} rotation={euler}>
        <cylinderGeometry args={[radius, radius, length, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={start}>
        <sphereGeometry args={[radius * 1.4, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[radius * 1.4, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
}

// ============================================
// COMPREHENSIVE PIPE NETWORK
// ============================================

function PipeNetwork() {
  const pipeRuns = [
    // === MAIN HORIZONTAL RUNS (ceiling level) ===
    // Yellow - main process line
    { start: [-24, 5.5, -6], end: [24, 5.5, -6], color: '#fbbf24', radius: 0.1 },
    // Blue - cooling water
    { start: [-24, 5.8, -6], end: [24, 5.8, -6], color: '#3b82f6', radius: 0.07 },
    // Red - steam/hot
    { start: [-24, 5.2, -6], end: [24, 5.2, -6], color: '#dc2626', radius: 0.05 },
    // Green - compressed air
    { start: [-24, 5.5, 6], end: [24, 5.5, 6], color: '#22c55e', radius: 0.08 },
    // Purple - hydraulic
    { start: [-24, 5.8, 6], end: [24, 5.8, 6], color: '#7c3aed', radius: 0.05 },
    
    // === VERTICAL DROPS TO MACHINES ===
    // To Motor area
    { start: [-6, 5.5, -6], end: [-6, 3, -6], color: '#fbbf24', radius: 0.06 },
    { start: [-6, 3, -6], end: [-6, 3, 2], color: '#fbbf24', radius: 0.06 },
    { start: [-6, 5.8, -6], end: [-6, 2.5, -6], color: '#3b82f6', radius: 0.05 },
    { start: [-6, 2.5, -6], end: [-6, 2.5, 2], color: '#3b82f6', radius: 0.05 },
    
    // To Pump area
    { start: [0, 5.5, -6], end: [0, 3.2, -6], color: '#fbbf24', radius: 0.06 },
    { start: [0, 3.2, -6], end: [0, 3.2, 2], color: '#fbbf24', radius: 0.06 },
    { start: [0, 5.2, -6], end: [0, 2.8, -6], color: '#dc2626', radius: 0.04 },
    { start: [0, 2.8, -6], end: [0, 2.8, 2], color: '#dc2626', radius: 0.04 },
    
    // To Compressor area  
    { start: [6, 5.5, -6], end: [6, 3, -6], color: '#fbbf24', radius: 0.06 },
    { start: [6, 3, -6], end: [6, 3, 2], color: '#fbbf24', radius: 0.06 },
    { start: [6, 5.5, 6], end: [6, 2.5, 6], color: '#22c55e', radius: 0.05 },
    { start: [6, 2.5, 6], end: [6, 2.5, 2], color: '#22c55e', radius: 0.05 },
    
    // === CROSS CONNECTIONS ===
    { start: [-12, 5.5, -6], end: [-12, 5.5, 6], color: '#94a3b8', radius: 0.05 },
    { start: [12, 5.5, -6], end: [12, 5.5, 6], color: '#94a3b8', radius: 0.05 },
    
    // === TO STORAGE TANKS ===
    { start: [18, 5.5, 6], end: [18, 4, 6], color: '#22c55e', radius: 0.07 },
    { start: [18, 4, 6], end: [18, 4, 0], color: '#22c55e', radius: 0.07 },
    { start: [21, 5.5, 6], end: [21, 3.5, 6], color: '#22c55e', radius: 0.06 },
    { start: [21, 3.5, 6], end: [21, 3.5, 0], color: '#22c55e', radius: 0.06 },
  ];

  return (
    <group>
      {pipeRuns.map((pipe, i) => (
        <Pipe key={i} {...pipe} />
      ))}
      
      {/* Pipe rack supports - horizontal beams */}
      {[-20, -10, 0, 10, 20].map((x, i) => (
        <group key={`rack-${i}`}>
          {/* Vertical supports */}
          <mesh position={[x, 3, -6]}>
            <boxGeometry args={[0.15, 6, 0.15]} />
            <meshStandardMaterial color="#78716c" roughness={0.6} metalness={0.4} />
          </mesh>
          <mesh position={[x, 3, 6]}>
            <boxGeometry args={[0.15, 6, 0.15]} />
            <meshStandardMaterial color="#78716c" roughness={0.6} metalness={0.4} />
          </mesh>
          {/* Horizontal cross member */}
          <mesh position={[x, 5.5, 0]}>
            <boxGeometry args={[0.12, 0.12, 12]} />
            <meshStandardMaterial color="#78716c" roughness={0.6} metalness={0.4} />
          </mesh>
          {/* Pipe support brackets */}
          <mesh position={[x, 5.5, -6]}>
            <boxGeometry args={[0.6, 0.08, 0.3]} />
            <meshStandardMaterial color="#64748b" roughness={0.5} metalness={0.5} />
          </mesh>
          <mesh position={[x, 5.5, 6]}>
            <boxGeometry args={[0.6, 0.08, 0.3]} />
            <meshStandardMaterial color="#64748b" roughness={0.5} metalness={0.5} />
          </mesh>
        </group>
      ))}
      
      {/* Pipe labels/tags */}
      {[
        { pos: [-20, 5.5, -6.3], label: 'PROCESS', color: '#fbbf24' },
        { pos: [-20, 5.8, -6.3], label: 'CW', color: '#3b82f6' },
        { pos: [-20, 5.5, 6.3], label: 'AIR', color: '#22c55e' },
      ].map((tag, i) => (
        <mesh key={`tag-${i}`} position={tag.pos}>
          <boxGeometry args={[0.4, 0.15, 0.02]} />
          <meshBasicMaterial color={tag.color} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// CONVEYOR BELT SYSTEM
// ============================================

function ConveyorBelt({ start, end, width = 0.7, color = '#1d4ed8' }) {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(endVec, startVec);
  const length = direction.length();
  const midpoint = startVec.clone().add(direction.clone().multiplyScalar(0.5));
  const angle = Math.atan2(direction.x, direction.z);
  
  const beltRef = useRef();
  
  useFrame(() => {
    if (beltRef.current?.material?.map) {
      beltRef.current.material.map.offset.y += 0.008;
    }
  });

  const beltTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#27272a';
    ctx.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = '#404040';
      ctx.fillRect(0, i * 13, 64, 3);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, length * 0.5);
    return texture;
  }, [length]);

  const legCount = Math.max(2, Math.floor(length / 3));
  
  return (
    <group position={midpoint.toArray()} rotation={[0, angle, 0]}>
      {/* Belt surface */}
      <mesh ref={beltRef} position={[0, 0.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial map={beltTexture} roughness={0.9} />
      </mesh>
      
      {/* Frame - main body */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[width + 0.15, 0.7, length]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.6} />
      </mesh>
      
      {/* Side rails */}
      <mesh position={[width / 2 + 0.06, 0.82, 0]}>
        <boxGeometry args={[0.06, 0.2, length]} />
        <meshStandardMaterial color="#60a5fa" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[-width / 2 - 0.06, 0.82, 0]}>
        <boxGeometry args={[0.06, 0.2, length]} />
        <meshStandardMaterial color="#60a5fa" roughness={0.3} metalness={0.7} />
      </mesh>
      
      {/* End rollers */}
      <mesh position={[0, 0.75, length / 2 - 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, width, 16]} />
        <meshStandardMaterial color="#71717a" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.75, -length / 2 + 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, width, 16]} />
        <meshStandardMaterial color="#71717a" roughness={0.4} metalness={0.7} />
      </mesh>
      
      {/* Support legs */}
      {Array.from({ length: legCount }, (_, i) => {
        const z = -length / 2 + length / (legCount + 1) * (i + 1);
        return (
          <group key={i}>
            <mesh position={[width / 2 + 0.1, 0.02, z]}>
              <boxGeometry args={[0.06, 0.04, 0.06]} />
              <meshStandardMaterial color="#1f2937" roughness={0.8} />
            </mesh>
            <mesh position={[-width / 2 - 0.1, 0.02, z]}>
              <boxGeometry args={[0.06, 0.04, 0.06]} />
              <meshStandardMaterial color="#1f2937" roughness={0.8} />
            </mesh>
            {/* Diagonal braces */}
            <mesh position={[width / 2 + 0.15, 0.2, z]} rotation={[0, 0, 0.3]}>
              <boxGeometry args={[0.03, 0.35, 0.03]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.5} metalness={0.5} />
            </mesh>
            <mesh position={[-width / 2 - 0.15, 0.2, z]} rotation={[0, 0, -0.3]}>
              <boxGeometry args={[0.03, 0.35, 0.03]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.5} metalness={0.5} />
            </mesh>
          </group>
        );
      })}
      
      {/* Motor drive unit */}
      <mesh position={[width / 2 + 0.25, 0.5, -length / 2 + 0.5]}>
        <boxGeometry args={[0.3, 0.25, 0.4]} />
        <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.5} />
      </mesh>
    </group>
  );
}

function ConveyorSystem() {
  return (
    <group>
      {/* Main line */}
      <ConveyorBelt start={[-22, 0, -4]} end={[22, 0, -4]} width={0.9} color="#1d4ed8" />
      
      {/* Secondary lines */}
      <ConveyorBelt start={[-15, 0, 5]} end={[8, 0, 5]} width={0.6} color="#1e40af" />
      
      {/* Branch conveyor */}
      <ConveyorBelt start={[10, 0, 5]} end={[10, 0, -4]} width={0.5} color="#1e40af" />
      
      {/* Output conveyor */}
      <ConveyorBelt start={[16, 0, -8]} end={[24, 0, -8]} width={0.7} color="#1d4ed8" />
      
      {/* Items on conveyor (boxes) */}
      {[
        { pos: [-18, 1.05, -4], size: [0.4, 0.3, 0.3], color: '#854d0e' },
        { pos: [-12, 1.05, -4], size: [0.35, 0.35, 0.35], color: '#78350f' },
        { pos: [-5, 1.05, -4], size: [0.45, 0.25, 0.35], color: '#92400e' },
        { pos: [3, 1.05, -4], size: [0.4, 0.4, 0.4], color: '#713f12' },
        { pos: [15, 1.05, -4], size: [0.35, 0.3, 0.35], color: '#854d0e' },
        { pos: [-8, 1, 5], size: [0.3, 0.25, 0.3], color: '#78350f' },
        { pos: [0, 1, 5], size: [0.35, 0.3, 0.35], color: '#92400e' },
      ].map((box, i) => (
        <mesh key={i} position={box.pos} castShadow>
          <boxGeometry args={box.size} />
          <meshStandardMaterial color={box.color} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// ROBOTIC ARM (Animated)
// ============================================

function RoboticArm({ position, color = '#f97316', speed = 1 }) {
  const baseRef = useRef();
  const shoulderRef = useRef();
  const elbowRef = useRef();
  const wristRef = useRef();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    if (baseRef.current) baseRef.current.rotation.y = Math.sin(t * 0.4) * 1.2;
    if (shoulderRef.current) shoulderRef.current.rotation.z = Math.sin(t * 0.6) * 0.4 - 0.3;
    if (elbowRef.current) elbowRef.current.rotation.z = Math.sin(t * 0.8 + 1) * 0.5 + 0.5;
    if (wristRef.current) wristRef.current.rotation.x = Math.sin(t * 1.2) * 0.6;
  });

  return (
    <group position={position}>
      {/* Heavy base plate */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.7, 0.1, 32]} />
        <meshStandardMaterial color="#18181b" roughness={0.7} metalness={0.4} />
      </mesh>
      
      {/* Rotating base */}
      <group ref={baseRef}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.5, 0.3, 24]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.6} />
        </mesh>
        
        {/* Shoulder assembly */}
        <group ref={shoulderRef} position={[0, 0.4, 0]}>
          {/* Shoulder joint */}
          <mesh position={[0, 0.15, 0]} castShadow>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.7} />
          </mesh>
          
          {/* Upper arm */}
          <mesh position={[0, 0.7, 0]} castShadow>
            <boxGeometry args={[0.18, 1, 0.18]} />
            <meshStandardMaterial color={color} roughness={0.4} metalness={0.6} />
          </mesh>
          
          {/* Elbow assembly */}
          <group ref={elbowRef} position={[0, 1.2, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.7} />
            </mesh>
            
            {/* Forearm */}
            <mesh position={[0.4, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <boxGeometry args={[0.14, 0.8, 0.14]} />
              <meshStandardMaterial color={color} roughness={0.4} metalness={0.6} />
            </mesh>
            
            {/* Wrist assembly */}
            <group ref={wristRef} position={[0.8, 0, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.1, 0.1, 0.2, 16]} />
                <meshStandardMaterial color="#52525b" roughness={0.4} metalness={0.6} />
              </mesh>
              
              {/* Gripper */}
              <mesh position={[0.15, 0.06, 0]} castShadow>
                <boxGeometry args={[0.2, 0.025, 0.06]} />
                <meshStandardMaterial color="#18181b" roughness={0.3} metalness={0.8} />
              </mesh>
              <mesh position={[0.15, -0.06, 0]} castShadow>
                <boxGeometry args={[0.2, 0.025, 0.06]} />
                <meshStandardMaterial color="#18181b" roughness={0.3} metalness={0.8} />
              </mesh>
            </group>
          </group>
        </group>
        
        {/* Cable conduit */}
        <mesh position={[0.25, 0.6, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
          <meshStandardMaterial color="#1f2937" roughness={0.8} />
        </mesh>
      </group>
      
      {/* Control box */}
      <mesh position={[0.7, 0.3, 0]} castShadow>
        <boxGeometry args={[0.25, 0.5, 0.3]} />
        <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.4} />
      </mesh>
      
      {/* Status light */}
      <mesh position={[0.7, 0.6, 0]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
    </group>
  );
}

// ============================================
// STORAGE TANKS
// ============================================

function StorageTank({ position, height = 4, radius = 1, color = '#22c55e', label = '' }) {
  return (
    <group position={position}>
      {/* Main tank body */}
      <mesh position={[0, height / 2 + 0.3, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, height, 32]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.7} />
      </mesh>
      
      {/* Domed top */}
      <mesh position={[0, height + 0.3, 0]} castShadow>
        <sphereGeometry args={[radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.7} />
      </mesh>
      
      {/* Reinforcement rings */}
      {[0.3, height * 0.35, height * 0.65, height * 0.9].map((y, i) => (
        <mesh key={i} position={[0, y + 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius + 0.02, 0.04, 8, 32]} />
          <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
      
      {/* Base/skirt */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[radius + 0.15, radius + 0.2, 0.3, 32]} />
        <meshStandardMaterial color="#52525b" roughness={0.7} metalness={0.3} />
      </mesh>
      
      {/* Ladder */}
      {Array.from({ length: Math.floor(height * 3) }, (_, i) => (
        <mesh key={i} position={[radius + 0.12, 0.4 + i * 0.35, 0]} castShadow>
          <boxGeometry args={[0.04, 0.04, 0.25]} />
          <meshStandardMaterial color="#a1a1aa" roughness={0.5} metalness={0.5} />
        </mesh>
      ))}
      <mesh position={[radius + 0.12, height / 2 + 0.3, 0.15]}>
        <boxGeometry args={[0.025, height, 0.025]} />
        <meshStandardMaterial color="#a1a1aa" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[radius + 0.12, height / 2 + 0.3, -0.15]}>
        <boxGeometry args={[0.025, height, 0.025]} />
        <meshStandardMaterial color="#a1a1aa" roughness={0.5} metalness={0.5} />
      </mesh>
      
      {/* Level sight glass */}
      <mesh position={[radius + 0.08, height / 2, 0.5]} castShadow>
        <boxGeometry args={[0.06, height * 0.5, 0.12]} />
        <meshStandardMaterial color="#0ea5e9" roughness={0.1} metalness={0.2} transparent opacity={0.7} />
      </mesh>
      
      {/* Outlet valve */}
      <mesh position={[radius, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.25, 12]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} metalness={0.6} />
      </mesh>
      
      {/* Tank label */}
      {label && (
        <mesh position={[0, height * 0.7, radius + 0.02]}>
          <planeGeometry args={[0.6, 0.3]} />
          <meshBasicMaterial color="#1f2937" />
        </mesh>
      )}
    </group>
  );
}

// ============================================
// SAFETY CAGE / RAILING
// ============================================

function SafetyCage({ position, width = 3, depth = 3, height = 2 }) {
  const posts = [
    [-width/2, 0, -depth/2], [width/2, 0, -depth/2],
    [-width/2, 0, depth/2], [width/2, 0, depth/2],
  ];
  
  return (
    <group position={position}>
      {/* Posts */}
      {posts.map((pos, i) => (
        <mesh key={i} position={[pos[0], height/2, pos[2]]} castShadow>
          <boxGeometry args={[0.06, height, 0.06]} />
          <meshStandardMaterial color="#a3a3a3" roughness={0.5} metalness={0.5} />
        </mesh>
      ))}
      
      {/* Top rail - yellow safety color */}
      {[
        { pos: [0, height, -depth/2], size: [width, 0.04, 0.04] },
        { pos: [0, height, depth/2], size: [width, 0.04, 0.04] },
        { pos: [-width/2, height, 0], size: [0.04, 0.04, depth] },
        { pos: [width/2, height, 0], size: [0.04, 0.04, depth] },
      ].map((rail, i) => (
        <mesh key={i} position={rail.pos}>
          <boxGeometry args={rail.size} />
          <meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.6} />
        </mesh>
      ))}
      
      {/* Mid rail */}
      {[
        { pos: [0, height * 0.5, -depth/2], size: [width, 0.03, 0.03] },
        { pos: [0, height * 0.5, depth/2], size: [width, 0.03, 0.03] },
        { pos: [-width/2, height * 0.5, 0], size: [0.03, 0.03, depth] },
        { pos: [width/2, height * 0.5, 0], size: [0.03, 0.03, depth] },
      ].map((rail, i) => (
        <mesh key={`mid-${i}`} position={rail.pos}>
          <boxGeometry args={rail.size} />
          <meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.6} />
        </mesh>
      ))}
      
      {/* Mesh panels */}
      {[
        { pos: [0, height/2, -depth/2], size: [width-0.1, height-0.1, 0.01] },
        { pos: [0, height/2, depth/2], size: [width-0.1, height-0.1, 0.01] },
        { pos: [-width/2, height/2, 0], size: [0.01, height-0.1, depth-0.1] },
        { pos: [width/2, height/2, 0], size: [0.01, height-0.1, depth-0.1] },
      ].map((panel, i) => (
        <mesh key={`mesh-${i}`} position={panel.pos}>
          <boxGeometry args={panel.size} />
          <meshStandardMaterial color="#525252" transparent opacity={0.15} wireframe />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// CONTROL PANEL / HMI STATION
// ============================================

function ControlPanel({ position, rotation = [0, 0, 0] }) {
  const screenRef = useRef();
  
  useFrame((state) => {
    if (screenRef.current) {
      const t = state.clock.getElapsedTime();
      screenRef.current.material.emissiveIntensity = 0.3 + Math.sin(t * 2) * 0.1;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Main cabinet */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[1, 1.8, 0.45]} />
        <meshStandardMaterial color="#404040" roughness={0.7} metalness={0.3} />
      </mesh>
      
      {/* Screen */}
      <mesh ref={screenRef} position={[0, 1.3, 0.24]}>
        <boxGeometry args={[0.7, 0.5, 0.02]} />
        <meshStandardMaterial color="#0f172a" emissive="#1e40af" emissiveIntensity={0.3} roughness={0.2} />
      </mesh>
      
      {/* Screen bezel */}
      <mesh position={[0, 1.3, 0.23]}>
        <boxGeometry args={[0.75, 0.55, 0.01]} />
        <meshStandardMaterial color="#1f2937" roughness={0.5} />
      </mesh>
      
      {/* Indicator lights */}
      {[
        { x: -0.25, color: '#22c55e' },
        { x: -0.1, color: '#22c55e' },
        { x: 0.05, color: '#eab308' },
        { x: 0.2, color: '#ef4444' },
      ].map((light, i) => (
        <mesh key={i} position={[light.x, 0.9, 0.24]}>
          <circleGeometry args={[0.03, 16]} />
          <meshBasicMaterial color={light.color} />
        </mesh>
      ))}
      
      {/* Button panel */}
      <mesh position={[0, 0.55, 0.24]}>
        <boxGeometry args={[0.5, 0.25, 0.02]} />
        <meshStandardMaterial color="#374151" roughness={0.6} />
      </mesh>
      
      {/* Buttons */}
      {[
        { pos: [-0.15, 0.55, 0.26], color: '#22c55e' },
        { pos: [0, 0.55, 0.26], color: '#3b82f6' },
        { pos: [0.15, 0.55, 0.26], color: '#ef4444' },
      ].map((btn, i) => (
        <mesh key={i} position={btn.pos} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
          <meshStandardMaterial color={btn.color} roughness={0.3} metalness={0.5} />
        </mesh>
      ))}
      
      {/* Emergency stop */}
      <mesh position={[0.35, 0.35, 0.24]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.03, 16]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} metalness={0.5} />
      </mesh>
      
      {/* Keyboard shelf */}
      <mesh position={[0, 0.15, 0.35]} castShadow>
        <boxGeometry args={[0.6, 0.03, 0.25]} />
        <meshStandardMaterial color="#525252" roughness={0.6} metalness={0.3} />
      </mesh>
    </group>
  );
}

// ============================================
// INDUSTRIAL MACHINE GEOMETRIES
// ============================================

function MotorGeometry({ color, emissiveIntensity }) {
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
      
      {/* Shaft */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.2, 16]} />
        <meshStandardMaterial color="#d4d4d4" roughness={0.2} metalness={0.9} />
      </mesh>
      
      {/* Cooling fins */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[0, 0.5, 0]} rotation={[0, (i * Math.PI) / 3, 0]} castShadow>
          <boxGeometry args={[0.48, 0.45, 0.025]} />
          <meshStandardMaterial color="#71717a" roughness={0.5} metalness={0.5} />
        </mesh>
      ))}
      
      {/* Junction box */}
      <mesh position={[0.35, 0.65, 0]} castShadow>
        <boxGeometry args={[0.15, 0.2, 0.12]} />
        <meshStandardMaterial color="#404040" roughness={0.6} metalness={0.4} />
      </mesh>
      
      {/* Base mount */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.65, 0.2, 0.65]} />
        <meshStandardMaterial color="#525252" roughness={0.7} metalness={0.3} />
      </mesh>
      
      {/* Mounting bolts */}
      {[[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.02, z]}>
          <cylinderGeometry args={[0.03, 0.03, 0.04, 8]} />
          <meshStandardMaterial color="#71717a" roughness={0.4} metalness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function PumpGeometry({ color, emissiveIntensity }) {
  return (
    <group>
      {/* Pump casing */}
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
      
      {/* Volute/impeller housing */}
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
      
      {/* Inlet flange */}
      <mesh position={[-0.4, 0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.2, 16]} />
        <meshStandardMaterial color="#a1a1aa" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[-0.52, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.14, 0.14, 0.03, 16]} />
        <meshStandardMaterial color="#78716c" roughness={0.5} metalness={0.6} />
      </mesh>
      
      {/* Outlet flange */}
      <mesh position={[0.4, 0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.2, 16]} />
        <meshStandardMaterial color="#a1a1aa" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0.52, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.14, 0.14, 0.03, 16]} />
        <meshStandardMaterial color="#78716c" roughness={0.5} metalness={0.6} />
      </mesh>
      
      {/* Pressure gauge */}
      <mesh position={[0.15, 0.92, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
        <meshStandardMaterial color="#e5e5e5" roughness={0.3} metalness={0.4} />
      </mesh>
      
      {/* Base plate */}
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
      {/* Tank body */}
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
      
      {/* Motor unit */}
      <mesh position={[0.4, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.35, 16]} />
        <meshStandardMaterial color="#404040" roughness={0.5} metalness={0.5} />
      </mesh>
      
      {/* Control box */}
      <mesh position={[0.38, 0.75, 0]} castShadow>
        <boxGeometry args={[0.18, 0.3, 0.22]} />
        <meshStandardMaterial color="#525252" roughness={0.5} metalness={0.4} />
      </mesh>
      
      {/* Pressure gauge */}
      <mesh position={[0, 0.95, 0.2]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.025, 16]} />
        <meshStandardMaterial color="#e5e5e5" roughness={0.3} metalness={0.5} />
      </mesh>
      
      {/* Relief valve */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.1, 12]} />
        <meshStandardMaterial color="#dc2626" roughness={0.5} metalness={0.5} />
      </mesh>
      
      {/* Outlet fitting */}
      <mesh position={[-0.35, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.15, 12]} />
        <meshStandardMaterial color="#a1a1aa" roughness={0.4} metalness={0.7} />
      </mesh>
      
      {/* Base */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.42, 0.16, 24]} />
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
      {/* Concrete pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <boxGeometry args={[1.5, 1.5, 0.08]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} metalness={0.1} />
      </mesh>
      
      {/* Status ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.65, 0.72, 48]} />
        <meshBasicMaterial color={statusColor} transparent opacity={isCritical ? 0.6 : 0.3} />
      </mesh>
      
      {/* Inner platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <circleGeometry args={[0.62, 32]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.3} />
      </mesh>
    </group>
  );
}

// ============================================
// MACHINE COMPONENT (Connected to API)
// ============================================

function Machine({ machine, config, onSelect }) {
  const groupRef = useRef();
  const alertLightRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  const isCritical = machine.failureRisk >= 70;
  const hasVibration = machine.vibration === 1;
  
  const statusColor = useMemo(() => getStatusColor(machine.failureRisk), [machine.failureRisk]);
  const machineColor = useMemo(() => getMachineColor(machine.failureRisk), [machine.failureRisk]);
  
  const emissiveIntensity = isCritical ? 0.4 : 0;

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    
    if (hasVibration) {
      groupRef.current.position.x = config.position[0] + Math.sin(t * 30) * 0.006;
      groupRef.current.position.z = config.position[2] + Math.cos(t * 35) * 0.004;
    }
    
    if (alertLightRef.current && isCritical) {
      alertLightRef.current.intensity = 1.2 + Math.sin(t * 8) * 0.6;
    }
  });

  const GeometryComponent = {
    motor: MotorGeometry,
    pump: PumpGeometry,
    compressor: CompressorGeometry,
  }[config.type] || MotorGeometry;

  return (
    <group>
      <MachinePlatform position={config.position} statusColor={statusColor} isCritical={isCritical} />
      
      <group
        ref={groupRef}
        position={config.position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onSelect(machine)}
      >
        <GeometryComponent color={machineColor} emissiveIntensity={emissiveIntensity} />
        
        {isCritical && (
          <pointLight ref={alertLightRef} position={[0, 1.5, 0]} color="#ef4444" intensity={1.2} distance={3} />
        )}
        
        {hovered && (
          <Html position={[0, 1.8, 0]} center distanceFactor={8}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: `2px solid ${statusColor}`,
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#f1f5f9',
              fontSize: '12px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              minWidth: '150px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
              <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '8px', color: statusColor }}>
                {config.label} - {machine.name}
              </div>
              <div style={{ display: 'grid', gap: '5px' }}>
                <div>🌡️ Temp: <span style={{ color: '#fbbf24', fontWeight: 600 }}>{machine.temperature}°C</span></div>
                <div>📊 Health: <span style={{ color: statusColor, fontWeight: 600 }}>{machine.healthScore}%</span></div>
                <div>⚠️ Risk: <span style={{ color: statusColor, fontWeight: 600 }}>{machine.failureRisk}%</span></div>
                <div>📳 Vibration: <span style={{ color: hasVibration ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                  {hasVibration ? 'ALERT' : 'Normal'}
                </span></div>
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

// ============================================
// ELECTRICAL CABINET
// ============================================

function ElectricalCabinet({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[0.8, 2, 0.5]} />
        <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.4} />
      </mesh>
      
      {/* Door handle */}
      <mesh position={[0.3, 1, 0.26]}>
        <boxGeometry args={[0.05, 0.15, 0.03]} />
        <meshStandardMaterial color="#71717a" roughness={0.4} metalness={0.6} />
      </mesh>
      
      {/* Vents */}
      {[1.6, 1.4, 0.6, 0.4].map((y, i) => (
        <mesh key={i} position={[0, y, 0.26]}>
          <boxGeometry args={[0.5, 0.08, 0.01]} />
          <meshStandardMaterial color="#1f2937" roughness={0.8} />
        </mesh>
      ))}
      
      {/* Warning label */}
      <mesh position={[0, 1.8, 0.26]}>
        <planeGeometry args={[0.25, 0.15]} />
        <meshBasicMaterial color="#eab308" />
      </mesh>
    </group>
  );
}

// ============================================
// FORKLIFT
// ============================================

function Forklift({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1, 0.7, 1.8]} />
        <meshStandardMaterial color="#eab308" roughness={0.4} metalness={0.5} />
      </mesh>
      
      {/* Cabin frame */}
      <mesh position={[0, 1.1, -0.2]} castShadow>
        <boxGeometry args={[0.9, 0.8, 0.9]} />
        <meshStandardMaterial color="#eab308" roughness={0.4} metalness={0.5} />
      </mesh>
      
      {/* Roof */}
      <mesh position={[0, 1.6, -0.2]}>
        <boxGeometry args={[1, 0.08, 1]} />
        <meshStandardMaterial color="#27272a" roughness={0.5} metalness={0.4} />
      </mesh>
      
      {/* Mast */}
      {[-0.3, 0, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 1.1, 0.95]} castShadow>
          <boxGeometry args={[0.1, 2.2, 0.1]} />
          <meshStandardMaterial color="#52525b" roughness={0.5} metalness={0.6} />
        </mesh>
      ))}
      
      {/* Forks */}
      <mesh position={[0.2, 0.25, 1.5]} castShadow>
        <boxGeometry args={[0.1, 0.06, 1]} />
        <meshStandardMaterial color="#78716c" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[-0.2, 0.25, 1.5]} castShadow>
        <boxGeometry args={[0.1, 0.06, 1]} />
        <meshStandardMaterial color="#78716c" roughness={0.4} metalness={0.7} />
      </mesh>
      
      {/* Wheels */}
      {[[0.4, 0.6], [-0.4, 0.6], [0.4, -0.6], [-0.4, -0.6]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.15, z]} rotation={[0, 0, Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.12, 16]} />
          <meshStandardMaterial color="#1f2937" roughness={0.9} />
        </mesh>
      ))}
      
      {/* Warning beacon */}
      <mesh position={[0, 1.7, -0.2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.08, 12]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>
    </group>
  );
}

// ============================================
// PALLET STACK
// ============================================

function PalletStack({ position, boxes = 3 }) {
  return (
    <group position={position}>
      {/* Pallet */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[1.1, 0.12, 0.9]} />
        <meshStandardMaterial color="#92400e" roughness={0.9} />
      </mesh>
      
      {/* Boxes */}
      {Array.from({ length: boxes }, (_, i) => (
        <mesh key={i} position={[
          (Math.random() - 0.5) * 0.3,
          0.35 + i * 0.35,
          (Math.random() - 0.5) * 0.2
        ]} castShadow>
          <boxGeometry args={[0.4 + Math.random() * 0.15, 0.3 + Math.random() * 0.1, 0.35 + Math.random() * 0.1]} />
          <meshStandardMaterial color={['#854d0e', '#78350f', '#713f12'][i % 3]} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// TOOL BOARD
// ============================================

function ToolBoard({ position }) {
  return (
    <group position={position}>
      {/* Board */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[1.5, 1.2, 0.05]} />
        <meshStandardMaterial color="#78716c" roughness={0.8} />
      </mesh>
      
      {/* Tools (simplified) */}
      {[
        { x: -0.5, y: 1.4, w: 0.08, h: 0.4 },
        { x: -0.3, y: 1.3, w: 0.06, h: 0.35 },
        { x: -0.1, y: 1.35, w: 0.1, h: 0.25 },
        { x: 0.15, y: 1.4, w: 0.05, h: 0.4 },
        { x: 0.35, y: 1.25, w: 0.15, h: 0.15 },
        { x: 0.55, y: 1.35, w: 0.08, h: 0.3 },
      ].map((tool, i) => (
        <mesh key={i} position={[tool.x, tool.y, 0.04]}>
          <boxGeometry args={[tool.w, tool.h, 0.02]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#dc2626' : '#3b82f6'} roughness={0.5} metalness={0.5} />
        </mesh>
      ))}
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
        shadow-bias={-0.0001}
      />
      
      <directionalLight position={[-15, 15, -10]} intensity={0.5} color="#dbeafe" />
      
      {/* Overhead industrial lights */}
      {[
        [-12, 6, -6], [0, 6, -6], [12, 6, -6],
        [-12, 6, 2], [0, 6, 2], [12, 6, 2],
        [-12, 6, 8], [0, 6, 8], [12, 6, 8],
      ].map((pos, i) => (
        <group key={i}>
          <mesh position={pos}>
            <boxGeometry args={[1.2, 0.12, 0.35]} />
            <meshStandardMaterial color="#404040" roughness={0.6} metalness={0.4} />
          </mesh>
          <mesh position={[pos[0], pos[1] - 0.08, pos[2]]}>
            <boxGeometry args={[1, 0.04, 0.25]} />
            <meshBasicMaterial color="#fef9c3" />
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
      {/* Back wall */}
      <mesh position={[0, 3.5, -17]}>
        <boxGeometry args={[50, 7, 0.25]} />
        <meshStandardMaterial color="#334155" roughness={0.85} />
      </mesh>
      
      {/* Side walls */}
      <mesh position={[-25, 3.5, 0]}>
        <boxGeometry args={[0.25, 7, 35]} />
        <meshStandardMaterial color="#334155" roughness={0.85} />
      </mesh>
      <mesh position={[25, 3.5, 0]}>
        <boxGeometry args={[0.25, 7, 35]} />
        <meshStandardMaterial color="#334155" roughness={0.85} />
      </mesh>
      
      {/* Windows */}
      {[-15, -5, 5, 15].map((x, i) => (
        <mesh key={i} position={[x, 4.5, -16.8]}>
          <boxGeometry args={[3.5, 2.5, 0.08]} />
          <meshStandardMaterial color="#0c4a6e" roughness={0.1} metalness={0.2} transparent opacity={0.5} />
        </mesh>
      ))}
      
      {/* Roller door */}
      <mesh position={[20, 2.5, -16.8]}>
        <boxGeometry args={[5, 5, 0.15]} />
        <meshStandardMaterial color="#52525b" roughness={0.6} metalness={0.4} />
      </mesh>
      
      {/* Warning stripe at door */}
      <mesh position={[20, 0.08, -16.5]}>
        <boxGeometry args={[5.5, 0.15, 0.5]} />
        <meshBasicMaterial color="#eab308" />
      </mesh>
    </group>
  );
}

// ============================================
// MAIN FACTORY CONTENT
// ============================================

function FactoryContent({ machines, onMachineSelect, cameraMode, playerRef }) {
  return (
    <>
      <IndustrialLighting />
      <fog attach="fog" args={['#1e293b', 25, 60]} />
      
      <FactoryFloor />
      <Walls />
      <PipeNetwork />
      <ConveyorSystem />
      
      {/* Robotic Arms */}
      <RoboticArm position={[-10, 0, -4]} color="#f97316" speed={0.8} />
      <RoboticArm position={[-4, 0, -4]} color="#f97316" speed={1.1} />
      <RoboticArm position={[4, 0, -4]} color="#f97316" speed={0.9} />
      <RoboticArm position={[10, 0, -4]} color="#f97316" speed={1.0} />
      
      {/* Safety Cages */}
      <SafetyCage position={[-10, 0, -4]} width={2.8} depth={2.8} height={2.2} />
      <SafetyCage position={[-4, 0, -4]} width={2.8} depth={2.8} height={2.2} />
      <SafetyCage position={[4, 0, -4]} width={2.8} depth={2.8} height={2.2} />
      <SafetyCage position={[10, 0, -4]} width={2.8} depth={2.8} height={2.2} />
      
      {/* Storage Tanks */}
      <StorageTank position={[18, 0, 0]} height={5} radius={1.3} color="#22c55e" label="T-101" />
      <StorageTank position={[21.5, 0, 0]} height={5} radius={1.3} color="#22c55e" label="T-102" />
      <StorageTank position={[19.75, 0, -5]} height={4} radius={1} color="#0ea5e9" label="T-103" />
      
      {/* Control Panels */}
      <ControlPanel position={[-18, 0, 8]} rotation={[0, 0, 0]} />
      <ControlPanel position={[-15, 0, 8]} rotation={[0, 0, 0]} />
      <ControlPanel position={[14, 0, -12]} rotation={[0, Math.PI, 0]} />
      
      {/* Electrical Cabinets */}
      <ElectricalCabinet position={[-22, 0, -8]} />
      <ElectricalCabinet position={[-22, 0, -5]} />
      <ElectricalCabinet position={[-22, 0, -2]} />
      
      {/* Forklift */}
      <Forklift position={[15, 0, 10]} rotation={[0, -0.5, 0]} />
      
      {/* Pallets */}
      <PalletStack position={[18, 0, 8]} boxes={3} />
      <PalletStack position={[20, 0, 8]} boxes={4} />
      <PalletStack position={[19, 0, 10]} boxes={2} />
      <PalletStack position={[-20, 0, 5]} boxes={3} />
      <PalletStack position={[-18, 0, 5]} boxes={2} />
      
      {/* Tool Board */}
      <ToolBoard position={[-22, 0, 3]} />
      
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
          />
        );
      })}
      
      {/* Player Character - visible only in orbit mode */}
      <PlayerCharacter 
        position={[0, 0, 12]} 
        visible={cameraMode === CAMERA_MODES.ORBIT} 
      />
      
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
      
      <FirstPersonController 
        isActive={cameraMode === CAMERA_MODES.WALK} 
        playerRef={playerRef}
      />
      
      <DroneController 
        isActive={cameraMode === CAMERA_MODES.DRONE} 
      />
    </>
  );
}

// ============================================
// MAIN EXPORT
// ============================================

export default function FactoryScene({ machines = [], onMachineSelect = () => {} }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [cameraMode, setCameraMode] = useState(CAMERA_MODES.ORBIT);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const canvasRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle keyboard shortcuts for mode switching
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
        fontFamily: 'system-ui'
      }}>
        Loading Factory...
      </div>
    );
  }

  return (
    <div 
      ref={canvasRef}
      onClick={handleCanvasClick}
      style={{ width: '100%', height: '100%', background: '#0f172a', position: 'relative', cursor: cameraMode !== CAMERA_MODES.ORBIT ? 'crosshair' : 'auto' }}
    >
      <Canvas
        shadows
        camera={{ position: [20, 15, 25], fov: 50, near: 0.1, far: 150 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      >
        <FactoryContent 
          machines={machines} 
          onMachineSelect={onMachineSelect}
          cameraMode={cameraMode}
          playerRef={playerRef}
        />
      </Canvas>
      
      {/* Camera Mode Toggle UI */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '4px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderRadius: '10px',
        padding: '6px',
        backdropFilter: 'blur(12px)',
        border: '1px solid #334155',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}>
        {[
          { mode: CAMERA_MODES.ORBIT, label: 'Orbit', icon: '🔭', key: '1' },
          { mode: CAMERA_MODES.WALK, label: 'Walk', icon: '🚶', key: '2' },
          { mode: CAMERA_MODES.DRONE, label: 'Drone', icon: '🚁', key: '3' },
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
              fontFamily: 'system-ui',
              transition: 'all 0.2s ease',
              background: cameraMode === mode 
                ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
                : 'transparent',
              color: cameraMode === mode ? '#fff' : '#94a3b8',
              boxShadow: cameraMode === mode ? '0 2px 8px rgba(59,130,246,0.4)' : 'none',
            }}
          >
            <span style={{ fontSize: '14px' }}>{icon}</span>
            <span>{label}</span>
            <span style={{ 
              fontSize: '9px', 
              opacity: 0.6,
              background: 'rgba(255,255,255,0.1)',
              padding: '2px 5px',
              borderRadius: '3px',
            }}>{key}</span>
          </button>
        ))}
      </div>
      
      {/* Controls Help - Context sensitive */}
      {(cameraMode === CAMERA_MODES.WALK || cameraMode === CAMERA_MODES.DRONE) && (
        <div style={{
          position: 'absolute',
          top: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: isPointerLocked ? 'rgba(15, 23, 42, 0.85)' : 'rgba(59, 130, 246, 0.9)',
          borderRadius: '8px',
          padding: '10px 16px',
          fontSize: '11px',
          color: '#fff',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${isPointerLocked ? '#334155' : '#60a5fa'}`,
          textAlign: 'center',
          transition: 'all 0.3s ease',
        }}>
          {!isPointerLocked ? (
            <div style={{ fontWeight: '600' }}>🖱️ Click to enable {cameraMode === CAMERA_MODES.WALK ? 'walking' : 'flying'} controls</div>
          ) : (
            <>
              <div style={{ marginBottom: '4px', fontWeight: '600' }}>
                {cameraMode === CAMERA_MODES.WALK ? '🚶 Walk Mode' : '🚁 Drone Mode'}
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <span><b>WASD</b> Move</span>
                <span><b>Mouse</b> Look</span>
                <span><b>Shift</b> Sprint</span>
                {cameraMode === CAMERA_MODES.DRONE && (
                  <>
                    <span><b>Space</b> Up</span>
                    <span><b>Ctrl</b> Down</span>
                  </>
                )}
                <span><b>ESC</b> Release</span>
              </div>
            </>
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
        backdropFilter: 'blur(8px)',
        border: '1px solid #334155',
      }}>
        <div style={{ fontWeight: '600', marginBottom: '6px', color: '#e2e8f0' }}>Digital Twin - Factory Floor</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span><span style={{ color: '#22c55e' }}>●</span> Normal</span>
          <span><span style={{ color: '#eab308' }}>●</span> Warning</span>
          <span><span style={{ color: '#f97316' }}>●</span> Elevated</span>
          <span><span style={{ color: '#ef4444' }}>●</span> Critical</span>
        </div>
        <div style={{ marginTop: '5px', fontSize: '10px', color: '#64748b' }}>
          {cameraMode === CAMERA_MODES.ORBIT 
            ? 'Drag to rotate • Scroll to zoom • Hover machines for data'
            : 'Press 1 to return to orbit view • Hover machines for data'}
        </div>
      </div>
      
      {/* Mini-map hint */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        right: '12px',
        background: 'rgba(15, 23, 42, 0.92)',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '10px',
        color: '#64748b',
        backdropFilter: 'blur(8px)',
        border: '1px solid #334155',
      }}>
        <div style={{ color: '#94a3b8', fontWeight: '600', marginBottom: '4px' }}>Quick Switch</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ color: cameraMode === CAMERA_MODES.ORBIT ? '#3b82f6' : '#64748b' }}>[1] Orbit</span>
          <span style={{ color: cameraMode === CAMERA_MODES.WALK ? '#3b82f6' : '#64748b' }}>[2] Walk</span>
          <span style={{ color: cameraMode === CAMERA_MODES.DRONE ? '#3b82f6' : '#64748b' }}>[3] Drone</span>
        </div>
      </div>
    </div>
  );
}
