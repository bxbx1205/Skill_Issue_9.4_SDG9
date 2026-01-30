/**
 * Camera System Module
 * ====================
 * Three distinct camera modes for industrial monitoring:
 * 1. Control Room View - Top-down/isometric overview
 * 2. First-Person Engineer Mode - WASD walking
 * 3. Autonomous Drone Mode - Flying inspection
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { CAMERA_MODES, CAMERA_PRESETS, FACTORY_BOUNDS, DRONE_PATROL_ROUTES } from './constants';

// ============================================
// CONTROL ROOM CAMERA
// Top-down/isometric view with smooth controls
// ============================================
export function ControlRoomCamera({ isActive, onMachineClick }) {
  const preset = CAMERA_PRESETS[CAMERA_MODES.CONTROL_ROOM];
  
  if (!isActive) return null;

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={preset.position.toArray()}
        fov={preset.fov}
        near={preset.near}
        far={preset.far}
      />
      <OrbitControls
        makeDefault
        target={preset.target.toArray()}
        minDistance={15}
        maxDistance={80}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.2}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        panSpeed={0.5}
        enablePan={true}
        screenSpacePanning={false}
      />
    </>
  );
}

// ============================================
// FIRST PERSON ENGINEER CONTROLLER
// WASD + Mouse look for walking through factory
// ============================================
export function FirstPersonController({ isActive, onPositionUpdate }) {
  const { camera, gl } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const isLocked = useRef(false);
  
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false
  });
  
  const preset = CAMERA_PRESETS[CAMERA_MODES.FIRST_PERSON];
  const { playerBounds } = FACTORY_BOUNDS;
  
  // Initialize camera position
  useEffect(() => {
    if (!isActive) return;
    
    camera.position.copy(preset.position);
    camera.fov = preset.fov;
    camera.near = preset.near;
    camera.far = preset.far;
    camera.updateProjectionMatrix();
    
    euler.current.set(0, 0, 0);
    camera.quaternion.setFromEuler(euler.current);
    
    // Reset velocity
    velocity.current.set(0, 0, 0);
    
  }, [isActive, camera, preset]);
  
  // Keyboard controls
  useEffect(() => {
    if (!isActive) return;
    
    const handleKeyDown = (e) => {
      if (e.repeat) return;
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
      
      // Clamp vertical look
      euler.current.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, euler.current.x));
      
      camera.quaternion.setFromEuler(euler.current);
    };
    
    const handlePointerLockChange = () => {
      // Check if any element is locked (could be canvas or container)
      isLocked.current = document.pointerLockElement !== null;
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      
      // Reset keys on cleanup
      Object.keys(keys.current).forEach(key => keys.current[key] = false);
    };
  }, [isActive, camera, gl.domElement]);
  
  // Movement update
  useFrame((state, delta) => {
    if (!isActive) return;
    
    const speed = keys.current.sprint ? preset.sprintSpeed : preset.walkSpeed;
    direction.current.set(0, 0, 0);
    
    // Get forward/right vectors (ignoring Y for ground movement)
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    
    // Build movement direction
    if (keys.current.forward) direction.current.add(forward);
    if (keys.current.backward) direction.current.sub(forward);
    if (keys.current.right) direction.current.add(right);
    if (keys.current.left) direction.current.sub(right);
    
    if (direction.current.length() > 0) {
      direction.current.normalize();
    }
    
    // Smooth velocity interpolation
    const targetVel = direction.current.clone().multiplyScalar(speed);
    velocity.current.lerp(targetVel, 0.15);
    
    // Apply movement with bounds checking
    const newX = camera.position.x + velocity.current.x * delta;
    const newZ = camera.position.z + velocity.current.z * delta;
    
    camera.position.x = Math.max(playerBounds.minX, Math.min(playerBounds.maxX, newX));
    camera.position.z = Math.max(playerBounds.minZ, Math.min(playerBounds.maxZ, newZ));
    camera.position.y = preset.eyeHeight;
    
    // Report position for HUD
    if (onPositionUpdate) {
      onPositionUpdate(camera.position.clone());
    }
  });
  
  return null;
}

// ============================================
// AUTONOMOUS DRONE CONTROLLER
// Flying drone with patrol routes and manual override
// ============================================
export function DroneController({ 
  isActive, 
  anomalyPositions = [], 
  autoPatrol = false,
  onPositionUpdate,
  onTargetAcquired 
}) {
  const { camera, gl } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const isLocked = useRef(false);
  
  // Patrol state
  const [currentWaypoint, setCurrentWaypoint] = useState(0);
  const [isPatrolling, setIsPatrolling] = useState(autoPatrol);
  const patrolProgress = useRef(0);
  
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    sprint: false
  });
  
  const preset = CAMERA_PRESETS[CAMERA_MODES.DRONE];
  const { droneBounds } = FACTORY_BOUNDS;
  
  // Get patrol route - use emergency route if anomalies exist
  const patrolRoute = anomalyPositions.length > 0 
    ? anomalyPositions.map(pos => ({
        position: [pos[0], 8, pos[2] + 5],
        lookAt: pos,
        duration: 3000,
        label: 'Anomaly Inspection'
      }))
    : DRONE_PATROL_ROUTES.standard;
  
  // Initialize camera
  useEffect(() => {
    if (!isActive) return;
    
    camera.position.copy(preset.position);
    camera.fov = preset.fov;
    camera.near = preset.near;
    camera.far = preset.far;
    camera.updateProjectionMatrix();
    
    euler.current.set(-0.3, 0, 0);
    camera.quaternion.setFromEuler(euler.current);
    
    velocity.current.set(0, 0, 0);
    setCurrentWaypoint(0);
    patrolProgress.current = 0;
    
  }, [isActive, camera, preset]);
  
  // Keyboard controls
  useEffect(() => {
    if (!isActive) return;
    
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      
      // Cancel patrol on any movement key
      if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space', 'ControlLeft', 'ControlRight'].includes(e.code)) {
        setIsPatrolling(false);
      }
      
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': keys.current.forward = true; break;
        case 'KeyS': case 'ArrowDown': keys.current.backward = true; break;
        case 'KeyA': case 'ArrowLeft': keys.current.left = true; break;
        case 'KeyD': case 'ArrowRight': keys.current.right = true; break;
        case 'Space': keys.current.up = true; e.preventDefault(); break;
        case 'ControlLeft': case 'ControlRight': keys.current.down = true; break;
        case 'ShiftLeft': case 'ShiftRight': keys.current.sprint = true; break;
        case 'KeyP': setIsPatrolling(p => !p); break; // Toggle patrol
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
      // Check if any element is locked (could be canvas or container)
      isLocked.current = document.pointerLockElement !== null;
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      Object.keys(keys.current).forEach(key => keys.current[key] = false);
    };
  }, [isActive, camera, gl.domElement]);
  
  // Movement and patrol update
  useFrame((state, delta) => {
    if (!isActive) return;
    
    if (isPatrolling && patrolRoute.length > 0) {
      // Autonomous patrol mode
      const waypoint = patrolRoute[currentWaypoint];
      const targetPos = new THREE.Vector3(...waypoint.position);
      const lookAtPos = new THREE.Vector3(...waypoint.lookAt);
      
      // Smooth movement to waypoint
      const moveSpeed = 0.5;
      camera.position.lerp(targetPos, moveSpeed * delta);
      
      // Smooth look at target
      const targetQuat = new THREE.Quaternion();
      const lookMatrix = new THREE.Matrix4().lookAt(camera.position, lookAtPos, new THREE.Vector3(0, 1, 0));
      targetQuat.setFromRotationMatrix(lookMatrix);
      camera.quaternion.slerp(targetQuat, 2 * delta);
      
      // Check if reached waypoint
      if (camera.position.distanceTo(targetPos) < 0.5) {
        patrolProgress.current += delta * 1000;
        
        if (patrolProgress.current >= waypoint.duration) {
          // Move to next waypoint
          patrolProgress.current = 0;
          setCurrentWaypoint((currentWaypoint + 1) % patrolRoute.length);
          
          if (onTargetAcquired) {
            onTargetAcquired(waypoint);
          }
        }
      }
    } else {
      // Manual flight mode
      const speed = keys.current.sprint ? preset.fastSpeed : preset.flightSpeed;
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
      
      if (moveDir.length() > 0) {
        moveDir.normalize();
      }
      
      const targetVel = moveDir.clone().multiplyScalar(speed);
      velocity.current.lerp(targetVel, 0.1);
      
      const newPos = camera.position.clone().add(velocity.current.clone().multiplyScalar(delta));
      
      camera.position.x = Math.max(droneBounds.minX, Math.min(droneBounds.maxX, newPos.x));
      camera.position.y = Math.max(droneBounds.minY, Math.min(droneBounds.maxY, newPos.y));
      camera.position.z = Math.max(droneBounds.minZ, Math.min(droneBounds.maxZ, newPos.z));
    }
    
    if (onPositionUpdate) {
      onPositionUpdate(camera.position.clone(), isPatrolling);
    }
  });
  
  return null;
}

// ============================================
// DRONE VISUAL MODEL
// 3D drone with animated propellers
// ============================================
export function DroneModel({ position, rotation = [0, 0, 0], isFlying = true }) {
  const propellerRefs = useRef([]);
  const bodyRef = useRef();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Propeller rotation
    propellerRefs.current.forEach((ref, i) => {
      if (ref) {
        ref.rotation.y = t * (isFlying ? 50 : 0) * (i % 2 === 0 ? 1 : -1);
      }
    });
    
    // Hovering bob
    if (bodyRef.current && isFlying) {
      bodyRef.current.position.y = position[1] + Math.sin(t * 3) * 0.05;
    }
  });

  return (
    <group ref={bodyRef} position={position} rotation={rotation}>
      {/* Main body */}
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.1, 0.2]} />
        <meshStandardMaterial color="#1f2937" roughness={0.4} metalness={0.6} />
      </mesh>
      
      {/* Arms and propellers */}
      {[[-0.25, 0, -0.15], [0.25, 0, -0.15], [-0.25, 0, 0.15], [0.25, 0, 0.15]].map((armPos, i) => (
        <group key={i} position={armPos}>
          {/* Arm */}
          <mesh>
            <cylinderGeometry args={[0.015, 0.015, 0.15, 8]} />
            <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.5} />
          </mesh>
          
          {/* Motor */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.04, 12]} />
            <meshStandardMaterial color="#4b5563" roughness={0.4} metalness={0.7} />
          </mesh>
          
          {/* Propeller */}
          <group ref={el => propellerRefs.current[i] = el} position={[0, 0.08, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[0.15, 0.01, 0.02]} />
              <meshStandardMaterial color="#9ca3af" transparent opacity={0.8} />
            </mesh>
            <mesh rotation={[0, Math.PI / 2, Math.PI / 2]}>
              <boxGeometry args={[0.15, 0.01, 0.02]} />
              <meshStandardMaterial color="#9ca3af" transparent opacity={0.8} />
            </mesh>
          </group>
        </group>
      ))}
      
      {/* Camera gimbal */}
      <mesh position={[0, -0.08, 0.05]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.5} />
      </mesh>
      
      {/* Spotlight */}
      <spotLight
        position={[0, -0.1, 0.1]}
        angle={0.6}
        penumbra={0.5}
        color="#ffffff"
        intensity={isFlying ? 2 : 0}
        distance={15}
        target-position={[0, -10, 2]}
        castShadow
      />
      
      {/* Status LEDs */}
      <mesh position={[0, 0.06, 0]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color={isFlying ? '#22c55e' : '#ef4444'} />
      </mesh>
    </group>
  );
}

// ============================================
// CAMERA MODE MANAGER
// Handles switching between camera modes
// ============================================
export function CameraModeManager({ 
  mode, 
  anomalyPositions = [],
  onPositionUpdate,
  onModeSwitch 
}) {
  const { camera } = useThree();
  const previousMode = useRef(mode);
  
  // Smooth transition between modes
  useEffect(() => {
    if (mode === previousMode.current) return;
    
    const targetPreset = CAMERA_PRESETS[mode];
    if (!targetPreset) return;
    
    // Animate camera to new position
    const startPos = camera.position.clone();
    const startTime = Date.now();
    const duration = 800;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      
      camera.position.lerpVectors(startPos, targetPreset.position, eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
    previousMode.current = mode;
    
  }, [mode, camera]);

  return (
    <>
      <ControlRoomCamera isActive={mode === CAMERA_MODES.CONTROL_ROOM} />
      <FirstPersonController 
        isActive={mode === CAMERA_MODES.FIRST_PERSON}
        onPositionUpdate={onPositionUpdate}
      />
      <DroneController 
        isActive={mode === CAMERA_MODES.DRONE}
        anomalyPositions={anomalyPositions}
        onPositionUpdate={onPositionUpdate}
      />
    </>
  );
}
