/**
 * Factory Scene Constants
 * ========================
 * Centralized configuration for the industrial digital twin visualization.
 * All spatial coordinates, thresholds, and visual parameters defined here
 * for easy tuning and maintenance.
 */

import * as THREE from 'three';

// ============================================
// ANOMALY STATUS DEFINITIONS
// ============================================
export const STATUS = {
  NORMAL: 'normal',
  WARNING: 'warning',
  CRITICAL: 'critical',
  OFFLINE: 'offline'
};

// ============================================
// STATUS COLOR PALETTE (INDUSTRIAL STANDARD)
// ============================================
export const STATUS_COLORS = {
  [STATUS.NORMAL]: {
    primary: '#2d5a3d',      // Muted industrial green
    emissive: '#1a3d28',
    glow: '#3d7a52',
    intensity: 0.1
  },
  [STATUS.WARNING]: {
    primary: '#b8860b',      // Pulsing amber
    emissive: '#d4a000',
    glow: '#ffc107',
    intensity: 0.4
  },
  [STATUS.CRITICAL]: {
    primary: '#8b0000',      // Deep red
    emissive: '#ff0000',
    glow: '#ff4444',
    intensity: 0.8
  },
  [STATUS.OFFLINE]: {
    primary: '#3a3a3a',      // Dark grey
    emissive: '#1a1a1a',
    glow: '#2a2a2a',
    intensity: 0
  }
};

// ============================================
// MACHINE TYPE DEFINITIONS
// ============================================
export const MACHINE_TYPES = {
  VIBRATION_MOTOR: 'vibration-motor',
  INDUSTRIAL_MOTOR: 'industrial-motor',
  THERMAL_PUMP: 'thermal-pump',
  HEAT_EXCHANGER: 'heat-exchanger',
  HUMIDITY_CONTROLLER: 'humidity-controller',
  AIR_COMPRESSOR: 'air-compressor',
  GAS_DETECTOR: 'gas-detector',
  GAS_PIPELINE: 'gas-pipeline'
};

// ============================================
// FACTORY LAYOUT - PRODUCTION FLOOR
// ============================================
export const FACTORY_ZONES = {
  // Zone A: Motor Section (High vibration area)
  MOTOR_SECTION: {
    bounds: { minX: -30, maxX: -10, minZ: -15, maxZ: 15 },
    color: '#4a5568',
    label: 'MOTOR SECTION A'
  },
  // Zone B: Pump Station (Thermal management)
  PUMP_STATION: {
    bounds: { minX: -10, maxX: 10, minZ: -15, maxZ: 15 },
    color: '#4a5568',
    label: 'PUMP STATION B'
  },
  // Zone C: Gas Processing (Hazardous)
  GAS_PROCESSING: {
    bounds: { minX: 10, maxX: 30, minZ: -15, maxZ: 15 },
    color: '#4a5568',
    label: 'GAS PROCESSING C'
  },
  // Zone D: Control Room (Elevated)
  CONTROL_ROOM: {
    bounds: { minX: -15, maxX: 15, minZ: 18, maxZ: 25 },
    color: '#2d3748',
    label: 'CONTROL ROOM'
  }
};

// ============================================
// MACHINE CONFIGURATIONS
// Spatial placement with sensor mapping
// ============================================
export const MACHINE_CONFIGS = {
  'vibration-motor': {
    position: [-22, 0, -8],
    rotation: [0, Math.PI / 4, 0],
    type: MACHINE_TYPES.VIBRATION_MOTOR,
    label: 'VIB-MOTOR-001',
    sensorType: 'VIB',
    zone: 'MOTOR_SECTION',
    scale: 1.2,
    description: 'Primary Vibration Motor - 500kW'
  },
  'industrial-motor-1': {
    position: [-22, 0, 0],
    rotation: [0, 0, 0],
    type: MACHINE_TYPES.INDUSTRIAL_MOTOR,
    label: 'IND-MOTOR-002',
    sensorType: 'VIB',
    zone: 'MOTOR_SECTION',
    scale: 1.0,
    description: 'Industrial Drive Motor - 350kW'
  },
  'industrial-motor-2': {
    position: [-22, 0, 8],
    rotation: [0, -Math.PI / 4, 0],
    type: MACHINE_TYPES.INDUSTRIAL_MOTOR,
    label: 'IND-MOTOR-003',
    sensorType: 'VIB',
    zone: 'MOTOR_SECTION',
    scale: 1.0,
    description: 'Auxiliary Drive Motor - 350kW'
  },
  'temp-pump': {
    position: [-4, 0, -8],
    rotation: [0, 0, 0],
    type: MACHINE_TYPES.THERMAL_PUMP,
    label: 'THERM-PUMP-001',
    sensorType: 'TEMP',
    zone: 'PUMP_STATION',
    scale: 1.1,
    description: 'Primary Thermal Circulation Pump'
  },
  'heat-exchanger': {
    position: [4, 0, -8],
    rotation: [0, Math.PI, 0],
    type: MACHINE_TYPES.HEAT_EXCHANGER,
    label: 'HEAT-EX-001',
    sensorType: 'TEMP',
    zone: 'PUMP_STATION',
    scale: 1.3,
    description: 'Shell & Tube Heat Exchanger'
  },
  'humidity-compressor': {
    position: [0, 0, 6],
    rotation: [0, Math.PI / 2, 0],
    type: MACHINE_TYPES.HUMIDITY_CONTROLLER,
    label: 'HUM-CTRL-001',
    sensorType: 'HUM',
    zone: 'PUMP_STATION',
    scale: 1.0,
    description: 'Humidity Control Unit'
  },
  'air-compressor': {
    position: [-8, 0, 6],
    rotation: [0, 0, 0],
    type: MACHINE_TYPES.AIR_COMPRESSOR,
    label: 'AIR-COMP-001',
    sensorType: 'HUM',
    zone: 'PUMP_STATION',
    scale: 1.2,
    description: 'Industrial Air Compressor - 150 PSI'
  },
  'gas-detector': {
    position: [18, 0, 0],
    rotation: [0, -Math.PI / 2, 0],
    type: MACHINE_TYPES.GAS_DETECTOR,
    label: 'GAS-DET-001',
    sensorType: 'GAS',
    zone: 'GAS_PROCESSING',
    scale: 0.8,
    description: 'Multi-Gas Detection Unit'
  },
  'gas-detector-2': {
    position: [22, 0, -8],
    rotation: [0, Math.PI, 0],
    type: MACHINE_TYPES.GAS_DETECTOR,
    label: 'GAS-DET-002',
    sensorType: 'GAS',
    zone: 'GAS_PROCESSING',
    scale: 0.8,
    description: 'Backup Gas Detection Unit'
  }
};

// ============================================
// PIPELINE NETWORK CONFIGURATION
// ============================================
export const PIPELINE_NETWORK = {
  mainGasLine: {
    segments: [
      { start: [-30, 3.5, -12], end: [30, 3.5, -12], radius: 0.15, type: 'gas' },
      { start: [-30, 3.5, 12], end: [30, 3.5, 12], radius: 0.15, type: 'gas' }
    ],
    branches: [
      { start: [-22, 3.5, -12], end: [-22, 1.5, -8], radius: 0.08 },
      { start: [-4, 3.5, -12], end: [-4, 1.5, -8], radius: 0.08 },
      { start: [18, 3.5, -12], end: [18, 1.5, 0], radius: 0.08 },
      { start: [22, 3.5, -12], end: [22, 1.5, -8], radius: 0.08 }
    ],
    valvePositions: [
      { position: [-15, 3.5, -12], id: 'valve-1' },
      { position: [0, 3.5, -12], id: 'valve-2' },
      { position: [15, 3.5, -12], id: 'valve-3' }
    ]
  },
  thermalLoop: {
    segments: [
      { start: [-10, 2, -8], end: [10, 2, -8], radius: 0.1, type: 'thermal' }
    ],
    color: '#ff6b35'
  },
  airSupply: {
    segments: [
      { start: [-15, 4, 6], end: [5, 4, 6], radius: 0.08, type: 'air' }
    ],
    color: '#4da6ff'
  }
};

// ============================================
// CAMERA PRESETS
// ============================================
export const CAMERA_MODES = {
  CONTROL_ROOM: 'control-room',
  FIRST_PERSON: 'first-person',
  DRONE: 'drone'
};

export const CAMERA_PRESETS = {
  [CAMERA_MODES.CONTROL_ROOM]: {
    position: new THREE.Vector3(0, 35, 40),
    target: new THREE.Vector3(0, 0, 0),
    fov: 45,
    near: 0.1,
    far: 200
  },
  [CAMERA_MODES.FIRST_PERSON]: {
    position: new THREE.Vector3(0, 1.7, 15),
    target: new THREE.Vector3(0, 1.7, 0),
    fov: 75,
    near: 0.1,
    far: 150,
    eyeHeight: 1.7,
    walkSpeed: 5,
    sprintSpeed: 10
  },
  [CAMERA_MODES.DRONE]: {
    position: new THREE.Vector3(0, 12, 30),
    target: new THREE.Vector3(0, 0, 0),
    fov: 60,
    near: 0.1,
    far: 200,
    flightSpeed: 8,
    fastSpeed: 20,
    minHeight: 2,
    maxHeight: 25
  }
};

// ============================================
// DRONE INSPECTION WAYPOINTS
// ============================================
export const DRONE_PATROL_ROUTES = {
  standard: [
    { position: [-25, 8, -10], lookAt: [-22, 0, -8], duration: 4000, label: 'Motor Section Scan' },
    { position: [-25, 8, 10], lookAt: [-22, 0, 8], duration: 3000, label: 'Motor Section Cont.' },
    { position: [0, 10, -10], lookAt: [0, 0, 0], duration: 4000, label: 'Pump Station Overview' },
    { position: [0, 6, 10], lookAt: [0, 0, 6], duration: 3000, label: 'Humidity Control Check' },
    { position: [20, 8, -5], lookAt: [18, 0, 0], duration: 4000, label: 'Gas Processing Scan' },
    { position: [25, 10, 5], lookAt: [22, 0, -8], duration: 3000, label: 'Gas Detector Inspection' }
  ],
  emergency: [
    // Dynamic route generated based on anomaly locations
  ]
};

// ============================================
// VISUAL EFFECT PARAMETERS
// ============================================
export const EFFECT_PARAMS = {
  vibrationShake: {
    intensity: 0.015,
    frequency: 25
  },
  heatDistortion: {
    intensity: 0.3,
    speed: 2
  },
  gasLeak: {
    particleCount: 150,
    particleSize: 0.08,
    emissionRate: 30,
    spreadRadius: 1.5,
    riseSpeed: 0.8
  },
  alertRing: {
    expandSpeed: 1.5,
    maxRadius: 3,
    fadeSpeed: 0.8
  },
  criticalFlicker: {
    frequency: 8,
    minIntensity: 0.3,
    maxIntensity: 1.0
  }
};

// ============================================
// FACTORY DIMENSIONS
// ============================================
export const FACTORY_BOUNDS = {
  floor: { width: 70, depth: 50 },
  walls: { height: 12, thickness: 0.3 },
  ceiling: { height: 12 },
  playerBounds: {
    minX: -32,
    maxX: 32,
    minZ: -22,
    maxZ: 22
  },
  droneBounds: {
    minX: -35,
    maxX: 35,
    minY: 2,
    maxY: 25,
    minZ: -25,
    maxZ: 25
  }
};

// ============================================
// PBR MATERIAL PRESETS
// ============================================
export const MATERIALS = {
  wornMetal: {
    color: '#6b7280',
    roughness: 0.7,
    metalness: 0.8
  },
  paintedSteel: {
    color: '#4b5563',
    roughness: 0.5,
    metalness: 0.6
  },
  rustySurface: {
    color: '#8b4513',
    roughness: 0.9,
    metalness: 0.3
  },
  oilStained: {
    color: '#1f2937',
    roughness: 0.8,
    metalness: 0.2
  },
  concrete: {
    color: '#4a5568',
    roughness: 0.95,
    metalness: 0.05
  },
  safetyYellow: {
    color: '#fbbf24',
    roughness: 0.6,
    metalness: 0.1
  },
  warningRed: {
    color: '#dc2626',
    roughness: 0.5,
    metalness: 0.2
  },
  pipeGas: {
    color: '#eab308',
    roughness: 0.3,
    metalness: 0.7
  },
  pipeThermal: {
    color: '#ff6b35',
    roughness: 0.4,
    metalness: 0.6
  },
  pipeAir: {
    color: '#60a5fa',
    roughness: 0.3,
    metalness: 0.7
  }
};

// ============================================
// THRESHOLD CONFIGURATIONS
// ============================================
export const THRESHOLDS = {
  temperature: {
    normal: { min: 0, max: 45 },
    warning: { min: 45, max: 60 },
    critical: { min: 60, max: Infinity }
  },
  vibration: {
    normal: 0,
    warning: 0.5,
    critical: 1
  },
  humidity: {
    normal: { min: 30, max: 60 },
    warning: { min: 20, max: 70 },
    critical: { min: 0, max: 100 }
  },
  gasLevel: {
    normal: { min: 0, max: 200 },
    warning: { min: 200, max: 400 },
    critical: { min: 400, max: Infinity }
  },
  failureRisk: {
    normal: { min: 0, max: 30 },
    warning: { min: 30, max: 60 },
    critical: { min: 60, max: 100 }
  }
};

// ============================================
// LIGHTING CONFIGURATION
// Significantly brighter for better visibility
// ============================================
export const LIGHTING = {
  ambient: {
    color: '#ffffff',
    intensity: 1.2  // Much brighter ambient
  },
  main: {
    color: '#ffffff',
    intensity: 2.5,  // Strong directional
    position: [30, 50, 30],
    castShadow: true
  },
  fill: {
    color: '#d4e5ff',
    intensity: 1.0,  // Stronger fill
    position: [-25, 30, -20]
  },
  // Optimized industrial lights - fewer for performance
  industrial: [
    { position: [-20, 9, -8], color: '#fff8f0', intensity: 3.0 },
    { position: [0, 9, -8], color: '#fff8f0', intensity: 3.5 },
    { position: [20, 9, -8], color: '#fff8f0', intensity: 3.0 },
    { position: [-20, 9, 8], color: '#fff8f0', intensity: 3.0 },
    { position: [0, 9, 8], color: '#ffffff', intensity: 4.0 },
    { position: [20, 9, 8], color: '#fff8f0', intensity: 3.0 }
  ],
  // Alert lighting (activated during anomalies)
  alert: {
    color: '#ff0000',
    intensity: 3.0,
    distance: 25
  }
};
