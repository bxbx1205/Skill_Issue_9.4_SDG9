/**
 * Effects System Module
 * =====================
 * Production-grade visual effects for anomaly visualization.
 * Includes particle systems, glow effects, alert rings,
 * heat distortion, gas leak visualization, and scene-level alerts.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STATUS_COLORS, STATUS, EFFECT_PARAMS } from './constants';

// ============================================
// ALERT RING EFFECT
// Expanding rings from faulty machines
// ============================================
export function AlertRing({ position, color = '#ef4444', maxRadius = 3, speed = 1.5 }) {
  const ringRef = useRef();
  
  useFrame((state) => {
    if (!ringRef.current) return;
    const t = state.clock.getElapsedTime() * speed;
    const progress = (t % 2) / 2;
    const scale = 0.5 + progress * maxRadius;
    const opacity = (1 - progress) * 0.5;
    
    ringRef.current.scale.setScalar(scale);
    ringRef.current.material.opacity = opacity;
  });

  return (
    <group position={[position[0], 0.05, position[2]]}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.0, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ============================================
// ATTENTION PARTICLES
// Floating warning particles for machines needing attention
// ============================================
export function AttentionParticles({ position, color = '#f59e0b', count = 8, radius = 1.2 }) {
  const particlesRef = useRef();
  
  // Limit max particles for performance
  const actualCount = Math.min(count, 10);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < actualCount; i++) {
      const angle = (i / actualCount) * Math.PI * 2;
      temp.push({
        angle,
        speed: 0.5 + Math.random() * 0.3,
        offset: Math.random() * Math.PI * 2,
        size: 0.04
      });
    }
    return temp;
  }, [actualCount]);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const t = state.clock.getElapsedTime();
    
    particlesRef.current.children.forEach((particle, i) => {
      const p = particles[i];
      particle.position.y = (t * p.speed + p.offset) % 2.5;
      particle.position.x = Math.cos(p.angle) * radius;
      particle.position.z = Math.sin(p.angle) * radius;
    });
  });

  return (
    <group ref={particlesRef} position={position}>
      {particles.map((p, i) => (
        <mesh key={i}>
          <sphereGeometry args={[p.size, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// GAS LEAK PARTICLE SYSTEM
// Simplified for performance
// ============================================
export function GasLeakParticles({ position, intensity = 1, color = '#22c55e' }) {
  const particlesRef = useRef();
  
  // Reduced particle count for performance
  const particleCount = Math.min(Math.floor(15 * intensity), 20);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < particleCount; i++) {
      temp.push({
        offset: Math.random() * 10,
        speed: 0.3 + Math.random() * 0.4,
        radius: Math.random() * 0.8,
        angle: Math.random() * Math.PI * 2
      });
    }
    return temp;
  }, [particleCount]);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const t = state.clock.getElapsedTime();
    
    particlesRef.current.children.forEach((particle, i) => {
      if (i >= particles.length) return;
      const p = particles[i];
      const progress = ((t * p.speed + p.offset) % 3) / 3;
      
      particle.position.x = Math.cos(p.angle) * p.radius * (1 + progress * 0.3);
      particle.position.y = progress * 3;
      particle.position.z = Math.sin(p.angle) * p.radius * (1 + progress * 0.3);
      particle.material.opacity = (1 - progress) * 0.4;
    });
  });

  return (
    <group ref={particlesRef} position={position}>
      {particles.map((p, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
      <pointLight color={color} intensity={intensity * 1.5} distance={4} />
    </group>
  );
}

// ============================================
// HEAT DISTORTION EFFECT
// Visual indicator for thermal anomalies
// ============================================
export function HeatDistortion({ position, temperature = 50, radius = 1 }) {
  const distortionRef = useRef();
  const wavesRef = useRef([]);
  
  const intensity = Math.min((temperature - 40) / 40, 1); // Normalize 40-80°C to 0-1
  
  // Color gradient based on temperature
  const heatColor = useMemo(() => {
    if (temperature < 50) return '#fbbf24'; // Warm yellow
    if (temperature < 65) return '#f97316'; // Orange
    return '#ef4444'; // Red hot
  }, [temperature]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (distortionRef.current) {
      // Shimmer effect
      distortionRef.current.material.opacity = 0.1 + Math.sin(t * 5) * 0.05 * intensity;
      distortionRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.05 * intensity);
    }
    
    // Animate heat waves
    wavesRef.current.forEach((wave, i) => {
      if (!wave) return;
      const offset = i * 0.5;
      const progress = ((t * 0.5 + offset) % 1.5);
      wave.position.y = progress * 2;
      wave.material.opacity = (1 - progress / 1.5) * 0.15 * intensity;
      wave.scale.setScalar(1 + progress * 0.5);
    });
  });

  if (temperature < 45) return null;

  return (
    <group position={position}>
      {/* Heat glow sphere */}
      <mesh ref={distortionRef}>
        <sphereGeometry args={[radius, 24, 24]} />
        <meshBasicMaterial 
          color={heatColor} 
          transparent 
          opacity={0.12} 
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Rising heat waves */}
      {[0, 1, 2].map((i) => (
        <mesh 
          key={i} 
          ref={(el) => wavesRef.current[i] = el}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[radius * 0.3, radius * 0.5, 16]} />
          <meshBasicMaterial color={heatColor} transparent opacity={0.1} side={THREE.DoubleSide} />
        </mesh>
      ))}
      
      {/* Point light for glow effect */}
      <pointLight color={heatColor} intensity={intensity * 2} distance={4} />
    </group>
  );
}

// ============================================
// PIPELINE FLOW INDICATOR
// Internal glow to show flow status in pipelines
// ============================================
export function PipelineFlow({ 
  start, 
  end, 
  status = STATUS.NORMAL, 
  hasFlow = true,
  flowSpeed = 1 
}) {
  const flowRef = useRef();
  const colors = STATUS_COLORS[status];
  
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(endVec, startVec);
  const length = direction.length();
  
  useFrame((state) => {
    if (!flowRef.current || !hasFlow) return;
    const t = state.clock.getElapsedTime() * flowSpeed;
    
    // Animate flow position along pipe
    const progress = (t % 2) / 2;
    flowRef.current.position.copy(startVec.clone().lerp(endVec, progress));
    
    // Pulsing glow
    flowRef.current.material.emissiveIntensity = 0.5 + Math.sin(t * 4) * 0.3;
  });

  return (
    <group>
      {/* Flow indicator sphere */}
      {hasFlow && (
        <mesh ref={flowRef}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial
            color={colors.glow}
            emissive={colors.glow}
            emissiveIntensity={0.8}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
      
      {/* Status glow along pipe */}
      {status !== STATUS.NORMAL && (
        <pointLight
          position={startVec.clone().lerp(endVec, 0.5).toArray()}
          color={colors.glow}
          intensity={status === STATUS.CRITICAL ? 2 : 1}
          distance={3}
        />
      )}
    </group>
  );
}

// ============================================
// CRITICAL FLICKER EFFECT
// Scene-level lighting shift for critical failures
// ============================================
export function CriticalFlicker({ active = false, intensity = 1 }) {
  const lightRef = useRef();
  const { frequency, minIntensity, maxIntensity } = EFFECT_PARAMS.criticalFlicker;
  
  useFrame((state) => {
    if (!lightRef.current || !active) return;
    const t = state.clock.getElapsedTime();
    
    // Random flicker pattern
    const flicker = Math.sin(t * frequency) * Math.sin(t * frequency * 1.7) * Math.sin(t * frequency * 0.3);
    const flickerIntensity = minIntensity + (flicker * 0.5 + 0.5) * (maxIntensity - minIntensity);
    
    lightRef.current.intensity = flickerIntensity * intensity;
  });

  if (!active) return null;

  return (
    <pointLight
      ref={lightRef}
      color="#ff0000"
      intensity={0.5}
      distance={100}
      position={[0, 15, 0]}
    />
  );
}

// ============================================
// STATUS INDICATOR BEACON
// Rotating beacon light for critical machines
// ============================================
export function StatusBeacon({ position, status = STATUS.NORMAL }) {
  const beaconRef = useRef();
  const lightRef = useRef();
  
  const colors = STATUS_COLORS[status];
  const isActive = status === STATUS.CRITICAL || status === STATUS.WARNING;

  useFrame((state) => {
    if (!beaconRef.current || !isActive) return;
    const t = state.clock.getElapsedTime();
    
    // Rotate beacon
    beaconRef.current.rotation.y = t * (status === STATUS.CRITICAL ? 4 : 2);
    
    // Pulse light
    if (lightRef.current) {
      lightRef.current.intensity = 1 + Math.sin(t * (status === STATUS.CRITICAL ? 8 : 4)) * 0.5;
    }
  });

  if (!isActive) return null;

  return (
    <group position={position}>
      {/* Beacon base */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.05, 16]} />
        <meshStandardMaterial color="#1f2937" roughness={0.7} />
      </mesh>
      
      {/* Rotating beacon dome */}
      <group ref={beaconRef} position={[0, 0.08, 0]}>
        <mesh>
          <cylinderGeometry args={[0.06, 0.06, 0.1, 16]} />
          <meshStandardMaterial
            color={colors.glow}
            emissive={colors.glow}
            emissiveIntensity={0.8}
            transparent
            opacity={0.9}
          />
        </mesh>
        
        {/* Directional light beam */}
        <spotLight
          ref={lightRef}
          position={[0.1, 0, 0]}
          angle={0.4}
          penumbra={0.5}
          color={colors.glow}
          intensity={1}
          distance={8}
          target-position={[2, -1, 0]}
        />
      </group>
    </group>
  );
}

// ============================================
// MACHINE HIGHLIGHT OUTLINE
// Glowing outline for selected/alert machines
// ============================================
export function MachineHighlight({ position, size = [1.5, 1.5, 1.5], color = '#3b82f6', pulse = true }) {
  const outlineRef = useRef();
  
  useFrame((state) => {
    if (!outlineRef.current || !pulse) return;
    const t = state.clock.getElapsedTime();
    
    outlineRef.current.material.opacity = 0.15 + Math.sin(t * 3) * 0.1;
    outlineRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.03);
  });

  return (
    <mesh ref={outlineRef} position={position}>
      <boxGeometry args={size} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={0.2} 
        wireframe={false}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

// ============================================
// INSPECTION CONE
// Visual cone for drone inspection area
// ============================================
export function InspectionCone({ position, target, color = '#3b82f6', distance = 8, angle = 0.5 }) {
  const coneRef = useRef();
  
  // Calculate rotation to point at target
  const direction = new THREE.Vector3(...target).sub(new THREE.Vector3(...position)).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), direction);

  useFrame((state) => {
    if (!coneRef.current) return;
    const t = state.clock.getElapsedTime();
    
    // Pulsing opacity
    coneRef.current.material.opacity = 0.08 + Math.sin(t * 2) * 0.04;
  });

  return (
    <group position={position} quaternion={quaternion}>
      <mesh ref={coneRef}>
        <coneGeometry args={[Math.tan(angle) * distance, distance, 32, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Spotlight effect */}
      <spotLight
        position={[0, 0, 0]}
        angle={angle}
        penumbra={0.5}
        color={color}
        intensity={0.5}
        distance={distance}
        target-position={[0, -distance, 0]}
      />
    </group>
  );
}

// ============================================
// AMBIENT DUST PARTICLES
// Simplified for performance
// ============================================
export function AmbientDust({ count = 50 }) {
  // Reduced count for performance - static dust, no animation
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < Math.min(count, 50); i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 50,
          Math.random() * 8 + 1,
          (Math.random() - 0.5) * 35
        ],
        size: 0.015 + Math.random() * 0.02
      });
    }
    return temp;
  }, [count]);

  return (
    <group>
      {particles.map((p, i) => (
        <mesh key={i} position={p.position}>
          <sphereGeometry args={[p.size, 4, 4]} />
          <meshBasicMaterial color="#b0b8c4" transparent opacity={0.2} />
        </mesh>
      ))}
    </group>
  );
}
