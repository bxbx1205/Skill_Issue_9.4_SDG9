const express = require('express');
const cors = require('cors');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const PORT = 3000;

// ========================================
// MIDDLEWARE
// ========================================
app.use(cors());
app.use(express.json());

// ========================================
// FLEET STATE
// ========================================
// Machine A: Real sensor data from Arduino
// Machine B: Simulated (high temperature stress)
// Machine C: Simulated (vibration anomaly)
const fleetState = {
  machineA: {
    id: 'MACHINE-A',
    name: 'Hydraulic Press #1',
    location: 'Assembly Line A',
    temperature: 0,
    vibration: 0,
    healthScore: 100,
    riskPercent: 0,
    status: 'OPERATIONAL',
    lastUpdate: new Date().toISOString(),
    isReal: true
  },
  machineB: {
    id: 'MACHINE-B',
    name: 'CNC Mill #3',
    location: 'Fabrication Bay B',
    temperature: 0,
    vibration: 0,
    healthScore: 100,
    riskPercent: 0,
    status: 'OPERATIONAL',
    lastUpdate: new Date().toISOString(),
    isReal: false
  },
  machineC: {
    id: 'MACHINE-C',
    name: 'Conveyor Motor #7',
    location: 'Logistics Zone C',
    temperature: 0,
    vibration: 0,
    healthScore: 100,
    riskPercent: 0,
    status: 'OPERATIONAL',
    lastUpdate: new Date().toISOString(),
    isReal: false
  }
};

// Event log with severity levels
const eventLog = [];
const MAX_LOG_SIZE = 50;

// ========================================
// HEALTH CALCULATION ENGINE
// ========================================
/**
 * Calculate machine health score based on temperature and vibration.
 * 
 * Thresholds:
 * - Temperature: < 30°C (optimal), 30-40°C (warning), > 40°C (critical)
 * - Vibration: 0 (optimal), 1 (active/normal), sustained 1 (warning)
 * 
 * Health Score: 0-100 (100 = perfect health)
 * Risk %: Inverse of health with exponential scaling
 */
function calculateHealth(temperature, vibration) {
  let health = 100;
  
  // Temperature impact (exponential beyond thresholds)
  if (temperature > 40) {
    health -= (temperature - 40) * 3; // Critical: -3 per degree
  } else if (temperature > 30) {
    health -= (temperature - 30) * 1.5; // Warning: -1.5 per degree
  }
  
  // Vibration impact (binary: sustained vibration = degradation)
  if (vibration === 1) {
    health -= 15; // Active vibration penalty
  }
  
  // Floor at 0
  health = Math.max(0, health);
  
  // Risk calculation (exponential curve for dramatic effect)
  const riskPercent = Math.min(100, Math.pow((100 - health) / 100, 0.7) * 100);
  
  // Status determination
  let status = 'OPERATIONAL';
  if (health < 30) status = 'CRITICAL';
  else if (health < 60) status = 'WARNING';
  
  return {
    healthScore: Math.round(health),
    riskPercent: Math.round(riskPercent),
    status
  };
}

// ========================================
// EVENT LOGGING
// ========================================
function addEvent(machineId, severity, message) {
  const event = {
    timestamp: new Date().toISOString(),
    machineId,
    severity, // INFO, WARNING, CRITICAL
    message
  };
  
  eventLog.unshift(event);
  
  // Maintain max log size
  if (eventLog.length > MAX_LOG_SIZE) {
    eventLog.pop();
  }
}

// ========================================
// SERIAL PORT READING (ARDUINO)
// ========================================
let serialPort = null;
let parser = null;

function initializeSerial() {
  // Try to find Arduino port
  // Common ports: COM3, COM4 on Windows; /dev/ttyUSB0, /dev/ttyACM0 on Linux
  const portPath = process.env.SERIAL_PORT || 'COM3';
  
  try {
    serialPort = new SerialPort({
      path: portPath,
      baudRate: 9600
    });
    
    parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));
    
    parser.on('data', (data) => {
      parseArduinoData(data.trim());
    });
    
    serialPort.on('error', (err) => {
      console.error('Serial port error:', err.message);
      // Fall back to simulation if serial fails
      console.log('Falling back to full simulation mode');
    });
    
    console.log(`✓ Serial port opened: ${portPath}`);
    addEvent('MACHINE-A', 'INFO', 'Connected to Arduino sensor array');
    
  } catch (error) {
    console.error('Could not open serial port:', error.message);
    console.log('Running in simulation mode for all machines');
  }
}

// ========================================
// ARDUINO DATA PARSING
// ========================================
/**
 * Expected Arduino serial format:
 * TEMP:25.5,VIB:0
 * or
 * T:25.5,V:1
 */
function parseArduinoData(data) {
  try {
    // Parse format: TEMP:25.5,VIB:0
    const tempMatch = data.match(/T(?:EMP)?:(\d+\.?\d*)/);
    const vibMatch = data.match(/V(?:IB)?:(\d)/);
    
    if (tempMatch && vibMatch) {
      const temperature = parseFloat(tempMatch[1]);
      const vibration = parseInt(vibMatch[1]);
      
      updateMachine('machineA', temperature, vibration);
    }
  } catch (error) {
    console.error('Parse error:', error.message);
  }
}

// ========================================
// MACHINE UPDATE LOGIC
// ========================================
function updateMachine(machineKey, temperature, vibration) {
  const machine = fleetState[machineKey];
  const prevStatus = machine.status;
  
  machine.temperature = temperature;
  machine.vibration = vibration;
  machine.lastUpdate = new Date().toISOString();
  
  const health = calculateHealth(temperature, vibration);
  machine.healthScore = health.healthScore;
  machine.riskPercent = health.riskPercent;
  machine.status = health.status;
  
  // Log status changes
  if (prevStatus !== machine.status) {
    const severity = machine.status === 'CRITICAL' ? 'CRITICAL' : 
                     machine.status === 'WARNING' ? 'WARNING' : 'INFO';
    addEvent(machine.id, severity, `Status changed: ${prevStatus} → ${machine.status}`);
  }
  
  // Log critical thresholds
  if (temperature > 40 && prevStatus !== 'CRITICAL') {
    addEvent(machine.id, 'CRITICAL', `Temperature critical: ${temperature.toFixed(1)}°C`);
  }
}

// ========================================
// FLEET SIMULATION (MACHINES B & C)
// ========================================
function simulateFleet() {
  // Machine B: Gradual temperature increase (thermal stress scenario)
  const baseTemp = 28 + Math.sin(Date.now() / 10000) * 8;
  const tempNoise = Math.random() * 4;
  const machineB_temp = baseTemp + tempNoise;
  const machineB_vib = Math.random() > 0.7 ? 1 : 0;
  
  updateMachine('machineB', machineB_temp, machineB_vib);
  
  // Machine C: Intermittent vibration anomaly
  const machineC_temp = 24 + Math.random() * 6;
  const machineC_vib = Math.random() > 0.5 ? 1 : 0; // 50% vibration rate
  
  updateMachine('machineC', machineC_temp, machineC_vib);
}

// ========================================
// REST API
// ========================================

// Health check
app.get('/', (req, res) => {
  res.json({
    system: 'Industrial IoT Predictive Maintenance System',
    status: 'ONLINE',
    timestamp: new Date().toISOString()
  });
});

// Fleet data endpoint
app.get('/api/fleet', (req, res) => {
  const machines = Object.values(fleetState);
  
  res.json({
    timestamp: new Date().toISOString(),
    machineCount: machines.length,
    machines: machines,
    alerts: eventLog.filter(e => e.severity !== 'INFO').slice(0, 10),
    recentEvents: eventLog.slice(0, 20)
  });
});

// ========================================
// STARTUP
// ========================================
app.listen(PORT, () => {
  console.log(`\n┌─────────────────────────────────────────┐`);
  console.log(`│  Industrial IoT Backend Server          │`);
  console.log(`│  Running on http://localhost:${PORT}     │`);
  console.log(`└─────────────────────────────────────────┘\n`);
  
  // Initialize serial connection
  initializeSerial();
  
  // Start fleet simulation
  setInterval(simulateFleet, 2000); // Update every 2 seconds
  
  console.log('✓ Fleet simulation active');
  console.log('✓ API endpoint: /api/fleet\n');
});
