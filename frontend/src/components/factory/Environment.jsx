/**
 * Factory Environment Module
 * ==========================
 * Production-grade industrial environment components.
 * Includes floor, walls, ceiling, catwalks, cable trays,
 * safety markings, storage tanks, and industrial lighting.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { FACTORY_BOUNDS, FACTORY_ZONES, MATERIALS, LIGHTING, PIPELINE_NETWORK } from './constants';

// ============================================
// FACTORY FLOOR WITH ZONE MARKINGS
// ============================================
export function FactoryFloor() {
  const { floor } = FACTORY_BOUNDS;
  
  return (
    <group>
      {/* Main concrete floor - brighter grey */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[floor.width, floor.depth]} />
        <meshStandardMaterial 
          color="#6b7280"
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
      
      {/* Grid lines (expansion joints) - lighter */}
      {Array.from({ length: Math.floor(floor.width / 5) + 1 }, (_, i) => {
        const x = -floor.width / 2 + i * 5;
        return (
          <mesh key={`v${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.001, 0]}>
            <planeGeometry args={[0.03, floor.depth]} />
            <meshBasicMaterial color="#525c69" />
          </mesh>
        );
      })}
      {Array.from({ length: Math.floor(floor.depth / 5) + 1 }, (_, i) => {
        const z = -floor.depth / 2 + i * 5;
        return (
          <mesh key={`h${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, z]}>
            <planeGeometry args={[floor.width, 0.03]} />
            <meshBasicMaterial color="#525c69" />
          </mesh>
        );
      })}
      
      {/* Zone markings */}
      <ZoneMarking zone={FACTORY_ZONES.MOTOR_SECTION} />
      <ZoneMarking zone={FACTORY_ZONES.PUMP_STATION} />
      <ZoneMarking zone={FACTORY_ZONES.GAS_PROCESSING} />
      
      {/* Safety walkways (yellow striped) */}
      <SafetyWalkway start={[-32, 0]} end={[32, 0]} />
      <SafetyWalkway start={[0, -22]} end={[0, 22]} />
    </group>
  );
}

// ============================================
// ZONE MARKING
// ============================================
function ZoneMarking({ zone }) {
  const { bounds, label } = zone;
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  
  return (
    <group position={[centerX, 0.005, centerZ]}>
      {/* Zone outline */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(width - 0.5, depth - 0.5)]} />
        <lineBasicMaterial color="#fbbf24" linewidth={2} />
      </lineSegments>
      
      {/* Zone label */}
      <Html position={[0, 0.1, -depth / 2 + 1]} rotation={[-Math.PI / 2, 0, 0]} transform>
        <div style={{
          color: '#fbbf24',
          fontSize: '14px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          textShadow: '0 0 10px rgba(251, 191, 36, 0.5)',
          whiteSpace: 'nowrap'
        }}>
          {label}
        </div>
      </Html>
    </group>
  );
}

// ============================================
// SAFETY WALKWAY (Yellow/Black stripes)
// ============================================
function SafetyWalkway({ start, end, width = 1.2 }) {
  const startVec = new THREE.Vector2(...start);
  const endVec = new THREE.Vector2(...end);
  const direction = new THREE.Vector2().subVectors(endVec, startVec);
  const length = direction.length();
  const center = startVec.clone().add(direction.clone().multiplyScalar(0.5));
  const angle = Math.atan2(direction.y, direction.x);
  
  return (
    <group position={[center.x, 0.003, center.y]} rotation={[-Math.PI / 2, 0, -angle]}>
      {/* Base walkway */}
      <mesh>
        <planeGeometry args={[length, width]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      
      {/* Yellow stripes */}
      {Array.from({ length: Math.floor(length / 1) }, (_, i) => (
        <mesh key={i} position={[-length / 2 + i * 1 + 0.25, 0, 0]}>
          <planeGeometry args={[0.15, width]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// FACTORY WALLS
// ============================================
export function FactoryWalls() {
  const { floor, walls } = FACTORY_BOUNDS;
  
  return (
    <group>
      {/* Back wall - lighter grey */}
      <mesh position={[0, walls.height / 2, -floor.depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[floor.width, walls.height, walls.thickness]} />
        <meshStandardMaterial color="#4a5568" roughness={0.8} metalness={0.1} />
      </mesh>
      
      {/* Side walls - lighter grey */}
      <mesh position={[-floor.width / 2, walls.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[walls.thickness, walls.height, floor.depth]} />
        <meshStandardMaterial color="#4a5568" roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[floor.width / 2, walls.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[walls.thickness, walls.height, floor.depth]} />
        <meshStandardMaterial color="#4a5568" roughness={0.8} metalness={0.1} />
      </mesh>
      
      {/* Wall details - corrugated panels - lighter */}
      <WallPanels position={[0, 0, -floor.depth / 2 + 0.2]} width={floor.width - 2} />
      
      {/* Emergency exit signs */}
      <EmergencySign position={[-floor.width / 2 + 1, 4, floor.depth / 2 - 2]} />
      <EmergencySign position={[floor.width / 2 - 1, 4, floor.depth / 2 - 2]} />
    </group>
  );
}

// ============================================
// WALL PANELS (Industrial corrugated)
// ============================================
function WallPanels({ position, width }) {
  const panelCount = Math.floor(width / 3);
  
  return (
    <group position={position}>
      {Array.from({ length: panelCount }, (_, i) => (
        <mesh key={i} position={[-width / 2 + i * 3 + 1.5, 5, 0.1]}>
          <boxGeometry args={[2.8, 9, 0.05]} />
          <meshStandardMaterial color="#5a6577" roughness={0.6} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// EMERGENCY EXIT SIGN
// ============================================
function EmergencySign({ position }) {
  const signRef = useRef();
  
  useFrame((state) => {
    if (signRef.current) {
      signRef.current.material.emissiveIntensity = 0.8 + Math.sin(state.clock.getElapsedTime() * 2) * 0.2;
    }
  });
  
  return (
    <group position={position}>
      <mesh ref={signRef}>
        <boxGeometry args={[0.8, 0.3, 0.05]} />
        <meshStandardMaterial 
          color="#22c55e" 
          emissive="#22c55e" 
          emissiveIntensity={0.8}
        />
      </mesh>
      <Html position={[0, 0, 0.03]} center>
        <div style={{
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
          textShadow: '0 0 5px #22c55e'
        }}>
          EXIT →
        </div>
      </Html>
    </group>
  );
}

// ============================================
// CEILING WITH INDUSTRIAL TRUSSES
// ============================================
export function FactoryCeiling() {
  const { floor, ceiling } = FACTORY_BOUNDS;
  
  return (
    <group>
      {/* Main ceiling */}
      <mesh position={[0, ceiling.height, 0]} receiveShadow>
        <boxGeometry args={[floor.width, 0.3, floor.depth]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      
      {/* Support trusses */}
      {Array.from({ length: 5 }, (_, i) => {
        const z = -floor.depth / 2 + 5 + i * 10;
        return <CeilingTruss key={i} position={[0, ceiling.height - 1, z]} width={floor.width - 4} />;
      })}
    </group>
  );
}

// ============================================
// CEILING TRUSS
// ============================================
function CeilingTruss({ position, width }) {
  return (
    <group position={position}>
      {/* Main beam */}
      <mesh castShadow>
        <boxGeometry args={[width, 0.3, 0.15]} />
        <meshStandardMaterial {...MATERIALS.paintedSteel} />
      </mesh>
      
      {/* Bottom chord */}
      <mesh position={[0, -0.8, 0]} castShadow>
        <boxGeometry args={[width, 0.15, 0.1]} />
        <meshStandardMaterial {...MATERIALS.paintedSteel} />
      </mesh>
      
      {/* Diagonal members */}
      {Array.from({ length: Math.floor(width / 2) }, (_, i) => {
        const x = -width / 2 + i * 2 + 1;
        return (
          <group key={i}>
            <mesh position={[x, -0.4, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
              <boxGeometry args={[1.2, 0.08, 0.08]} />
              <meshStandardMaterial {...MATERIALS.wornMetal} />
            </mesh>
            <mesh position={[x + 0.5, -0.4, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
              <boxGeometry args={[1.2, 0.08, 0.08]} />
              <meshStandardMaterial {...MATERIALS.wornMetal} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ============================================
// CABLE TRAYS
// ============================================
export function CableTrays() {
  return (
    <group>
      {/* Main cable run along back wall */}
      <CableTray start={[-30, 8, -20]} end={[30, 8, -20]} />
      
      {/* Cross runs to machines */}
      <CableTray start={[-20, 8, -20]} end={[-20, 8, -5]} />
      <CableTray start={[0, 8, -20]} end={[0, 8, -5]} />
      <CableTray start={[20, 8, -20]} end={[20, 8, -5]} />
      
      {/* Drops to floor level */}
      <CableDrop position={[-20, 8, -5]} height={6} />
      <CableDrop position={[0, 8, -5]} height={6} />
      <CableDrop position={[20, 8, -5]} height={6} />
    </group>
  );
}

function CableTray({ start, end }) {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(endVec, startVec);
  const length = direction.length();
  const midpoint = startVec.clone().add(direction.clone().multiplyScalar(0.5));
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction.clone().normalize());
  
  return (
    <group position={midpoint.toArray()} quaternion={quaternion}>
      {/* Tray bottom */}
      <mesh castShadow>
        <boxGeometry args={[length, 0.02, 0.3]} />
        <meshStandardMaterial color="#4b5563" roughness={0.6} metalness={0.5} />
      </mesh>
      
      {/* Tray sides */}
      <mesh position={[0, 0.05, 0.14]} castShadow>
        <boxGeometry args={[length, 0.1, 0.02]} />
        <meshStandardMaterial color="#4b5563" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.05, -0.14]} castShadow>
        <boxGeometry args={[length, 0.1, 0.02]} />
        <meshStandardMaterial color="#4b5563" roughness={0.6} metalness={0.5} />
      </mesh>
      
      {/* Cables inside */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.08, 0.08, length, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
    </group>
  );
}

function CableDrop({ position, height }) {
  return (
    <group position={position}>
      <mesh position={[0, -height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, height, 8]} />
        <meshStandardMaterial color="#374151" roughness={0.7} metalness={0.4} />
      </mesh>
    </group>
  );
}

// ============================================
// CATWALKS AND STAIRS
// ============================================
export function Catwalks() {
  return (
    <group>
      {/* Main observation catwalk */}
      <Catwalk start={[-25, 4, 18]} end={[25, 4, 18]} />
      
      {/* Access stairs */}
      <Staircase position={[-28, 0, 18]} height={4} />
      <Staircase position={[28, 0, 18]} height={4} rotation={Math.PI} />
    </group>
  );
}

function Catwalk({ start, end }) {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const length = startVec.distanceTo(endVec);
  const midpoint = startVec.clone().lerp(endVec, 0.5);
  
  return (
    <group position={midpoint.toArray()}>
      {/* Grating floor */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[length, 0.05, 1.2]} />
        <meshStandardMaterial color="#52525b" roughness={0.7} metalness={0.4} wireframe={false} />
      </mesh>
      
      {/* Support beams */}
      {Array.from({ length: Math.floor(length / 4) }, (_, i) => {
        const x = -length / 2 + i * 4 + 2;
        return (
          <group key={i}>
            <mesh position={[x, -2, 0.5]} castShadow>
              <boxGeometry args={[0.1, 4, 0.1]} />
              <meshStandardMaterial {...MATERIALS.paintedSteel} />
            </mesh>
            <mesh position={[x, -2, -0.5]} castShadow>
              <boxGeometry args={[0.1, 4, 0.1]} />
              <meshStandardMaterial {...MATERIALS.paintedSteel} />
            </mesh>
          </group>
        );
      })}
      
      {/* Handrails */}
      <mesh position={[0, 1, 0.55]} castShadow>
        <boxGeometry args={[length, 0.05, 0.05]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1, -0.55]} castShadow>
        <boxGeometry args={[length, 0.05, 0.05]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.5} metalness={0.3} />
      </mesh>
      
      {/* Rail posts */}
      {Array.from({ length: Math.floor(length / 2) + 1 }, (_, i) => {
        const x = -length / 2 + i * 2;
        return (
          <group key={i}>
            <mesh position={[x, 0.5, 0.55]} castShadow>
              <boxGeometry args={[0.04, 1, 0.04]} />
              <meshStandardMaterial color="#fbbf24" roughness={0.5} metalness={0.3} />
            </mesh>
            <mesh position={[x, 0.5, -0.55]} castShadow>
              <boxGeometry args={[0.04, 1, 0.04]} />
              <meshStandardMaterial color="#fbbf24" roughness={0.5} metalness={0.3} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Staircase({ position, height, rotation = 0 }) {
  const steps = Math.floor(height / 0.25);
  
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {Array.from({ length: steps }, (_, i) => (
        <mesh key={i} position={[i * 0.3, i * 0.25, 0]} castShadow>
          <boxGeometry args={[0.3, 0.05, 0.8]} />
          <meshStandardMaterial color="#52525b" roughness={0.7} metalness={0.4} />
        </mesh>
      ))}
      
      {/* Handrails */}
      <mesh position={[(steps * 0.3) / 2, height / 2 + 0.5, 0.45]} rotation={[0, 0, Math.atan2(height, steps * 0.3)]}>
        <boxGeometry args={[Math.sqrt(height * height + (steps * 0.3) * (steps * 0.3)), 0.04, 0.04]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.5} metalness={0.3} />
      </mesh>
    </group>
  );
}

// ============================================
// STORAGE TANKS
// ============================================
export function StorageTanks() {
  return (
    <group>
      <StorageTank position={[28, 0, -15]} height={6} radius={2} color="#22c55e" label="WATER" />
      <StorageTank position={[28, 0, -8]} height={5} radius={1.5} color="#3b82f6" label="COOLANT" />
      <StorageTank position={[28, 0, 0]} height={4} radius={1.2} color="#f97316" label="OIL" />
    </group>
  );
}

function StorageTank({ position, height = 4, radius = 1, color = '#22c55e', label }) {
  return (
    <group position={position}>
      {/* Tank body */}
      <mesh position={[0, height / 2 + 0.3, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, height, 32]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.7} />
      </mesh>
      
      {/* Dome top */}
      <mesh position={[0, height + 0.3, 0]} castShadow>
        <sphereGeometry args={[radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.7} />
      </mesh>
      
      {/* Base ring */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[radius + 0.15, radius + 0.2, 0.3, 32]} />
        <meshStandardMaterial {...MATERIALS.oilStained} />
      </mesh>
      
      {/* Support legs */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <mesh 
          key={i} 
          position={[Math.cos(angle) * (radius - 0.1), 0.15, Math.sin(angle) * (radius - 0.1)]}
          castShadow
        >
          <boxGeometry args={[0.15, 0.3, 0.15]} />
          <meshStandardMaterial {...MATERIALS.paintedSteel} />
        </mesh>
      ))}
      
      {/* Label */}
      <Html position={[0, height / 2 + 0.3, radius + 0.1]} center>
        <div style={{
          color: 'white',
          background: 'rgba(0,0,0,0.7)',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 'bold',
          fontFamily: 'monospace'
        }}>
          {label}
        </div>
      </Html>
      
      {/* Level indicator */}
      <mesh position={[radius + 0.05, height / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, height * 0.8, 8]} />
        <meshStandardMaterial color="#f1f5f9" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

// ============================================
// INDUSTRIAL LIGHTING SYSTEM
// Optimized for performance
// ============================================
export function IndustrialLighting({ criticalAlert = false }) {
  return (
    <group>
      {/* Strong ambient light for visibility */}
      <ambientLight 
        intensity={1.5} 
        color={criticalAlert ? '#ffe0e0' : '#ffffff'} 
      />
      
      {/* Hemisphere light for natural feel */}
      <hemisphereLight 
        args={['#ffffff', '#5a6577', 1.0]} 
        position={[0, 20, 0]} 
      />
      
      {/* Main directional (sun) - no shadows for performance */}
      <directionalLight
        position={[30, 50, 30]}
        intensity={2.0}
        color="#ffffff"
      />
      
      {/* Fill light */}
      <directionalLight
        position={[-25, 30, -20]}
        intensity={1.0}
        color="#d4e5ff"
      />
      
      {/* Simple point lights instead of complex fixtures */}
      <pointLight position={[-20, 8, -8]} color="#fff8f0" intensity={2.5} distance={25} />
      <pointLight position={[0, 8, -8]} color="#ffffff" intensity={3.0} distance={25} />
      <pointLight position={[20, 8, -8]} color="#fff8f0" intensity={2.5} distance={25} />
      <pointLight position={[-20, 8, 8]} color="#fff8f0" intensity={2.5} distance={25} />
      <pointLight position={[0, 8, 8]} color="#ffffff" intensity={3.5} distance={25} />
      <pointLight position={[20, 8, 8]} color="#fff8f0" intensity={2.5} distance={25} />
      
      {/* Critical alert lighting */}
      {criticalAlert && (
        <pointLight
          position={[0, 10, 0]}
          color="#ff4444"
          intensity={4.0}
          distance={50}
        />
      )}
    </group>
  );
}

// ============================================
// GAS PIPELINE NETWORK
// ============================================
export function PipelineNetwork({ hasLeak = false, leakPosition = null }) {
  const { mainGasLine, thermalLoop, airSupply } = PIPELINE_NETWORK;
  
  return (
    <group>
      {/* Main gas lines */}
      {mainGasLine.segments.map((segment, i) => (
        <Pipeline key={`gas-${i}`} {...segment} color={MATERIALS.pipeGas.color} hasLeak={hasLeak && i === 0} />
      ))}
      
      {/* Branch lines */}
      {mainGasLine.branches.map((branch, i) => (
        <Pipeline key={`branch-${i}`} {...branch} color={MATERIALS.pipeGas.color} />
      ))}
      
      {/* Valves */}
      {mainGasLine.valvePositions.map((valve, i) => (
        <PipelineValve key={`valve-${i}`} position={valve.position} isOpen={!hasLeak} />
      ))}
      
      {/* Thermal loop */}
      {thermalLoop.segments.map((segment, i) => (
        <Pipeline key={`thermal-${i}`} {...segment} color={thermalLoop.color} />
      ))}
      
      {/* Air supply */}
      {airSupply.segments.map((segment, i) => (
        <Pipeline key={`air-${i}`} {...segment} color={airSupply.color} />
      ))}
      
      {/* Pipe supports */}
      <PipeSupports />
    </group>
  );
}

function Pipeline({ start, end, radius = 0.1, color, hasLeak = false }) {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(endVec, startVec);
  const length = direction.length();
  const midpoint = startVec.clone().add(direction.clone().multiplyScalar(0.5));
  
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  
  const leakRef = useRef();
  
  useFrame((state) => {
    if (leakRef.current && hasLeak) {
      const t = state.clock.getElapsedTime();
      leakRef.current.material.opacity = 0.4 + Math.sin(t * 8) * 0.3;
      leakRef.current.scale.setScalar(1 + Math.sin(t * 5) * 0.2);
    }
  });

  return (
    <group>
      {/* Main pipe */}
      <mesh position={midpoint.toArray()} quaternion={quaternion} castShadow>
        <cylinderGeometry args={[radius, radius, length, 16]} />
        <meshStandardMaterial 
          color={hasLeak ? '#ef4444' : color} 
          roughness={0.3} 
          metalness={0.7}
          emissive={hasLeak ? '#ef4444' : '#000'}
          emissiveIntensity={hasLeak ? 0.3 : 0}
        />
      </mesh>
      
      {/* End flanges */}
      <mesh position={start} quaternion={quaternion}>
        <cylinderGeometry args={[radius * 1.3, radius * 1.3, 0.05, 16]} />
        <meshStandardMaterial {...MATERIALS.wornMetal} />
      </mesh>
      <mesh position={end} quaternion={quaternion}>
        <cylinderGeometry args={[radius * 1.3, radius * 1.3, 0.05, 16]} />
        <meshStandardMaterial {...MATERIALS.wornMetal} />
      </mesh>
      
      {/* Leak effect */}
      {hasLeak && (
        <mesh ref={leakRef} position={midpoint.toArray()}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

function PipelineValve({ position, isOpen = true }) {
  return (
    <group position={position}>
      {/* Valve body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
        <meshStandardMaterial color={isOpen ? '#22c55e' : '#ef4444'} roughness={0.4} metalness={0.6} />
      </mesh>
      
      {/* Handle */}
      <mesh position={[0, 0.15, 0]} rotation={[0, 0, isOpen ? 0 : Math.PI / 2]}>
        <boxGeometry args={[0.2, 0.05, 0.03]} />
        <meshStandardMaterial color="#1f2937" roughness={0.5} metalness={0.5} />
      </mesh>
    </group>
  );
}

function PipeSupports() {
  const positions = [
    [-25, 3.5, -12], [-15, 3.5, -12], [-5, 3.5, -12], [5, 3.5, -12], [15, 3.5, -12], [25, 3.5, -12],
    [-25, 3.5, 12], [-15, 3.5, 12], [-5, 3.5, 12], [5, 3.5, 12], [15, 3.5, 12], [25, 3.5, 12]
  ];
  
  return (
    <group>
      {positions.map((pos, i) => (
        <mesh key={i} position={[pos[0], pos[1] / 2, pos[2]]} castShadow>
          <boxGeometry args={[0.1, pos[1], 0.1]} />
          <meshStandardMaterial {...MATERIALS.paintedSteel} />
        </mesh>
      ))}
    </group>
  );
}
