/**
 * Predictive Maintenance System - Backend Server
 * PS 9.4 - SDG 9: Industry Innovation
 * 
 * Features:
 * - Serial port communication with Arduino
 * - Fleet simulation (3 machines)
 * - Health score & failure risk calculation
 * - Alert logging system
 * - REST API for React dashboard
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ==================== CONFIGURATION ====================

// Serial port configuration - Update this to match your Arduino port
// Windows: 'COM3', 'COM4', etc.
// Linux/Raspberry Pi: '/dev/ttyUSB0', '/dev/ttyACM0', etc.
const SERIAL_PORT_PATH = process.env.SERIAL_PORT || 'COM3';
const BAUD_RATE = 9600;

// Thresholds
const FAILURE_RISK_THRESHOLD = 70; // Alert threshold percentage
const MAX_LOGS = 5; // Maximum logs to store

// ==================== DATA STORAGE ====================

// Real sensor data from Arduino (Motor A)
let realSensorData = {
  temperature: 25.0,
  vibration: 0,
  lastUpdate: Date.now()
};

// Fleet machines data
let fleetData = {
  motorA: {
    id: 'motor-a',
    name: 'Motor A',
    type: 'Industrial Motor',
    icon: '⚙️',
    dataSource: 'Real Sensor',
    temperature: 25.0,
    vibration: 0,
    healthScore: 100,
    failureRisk: 0,
    status: 'Healthy',
    lastUpdate: Date.now()
  },
  pumpB: {
    id: 'pump-b',
    name: 'Pump B',
    type: 'Hydraulic Pump',
    icon: '💧',
    dataSource: 'Simulated',
    temperature: 28.0,
    vibration: 0,
    healthScore: 100,
    failureRisk: 0,
    status: 'Healthy',
    lastUpdate: Date.now()
  },
  compressorC: {
    id: 'compressor-c',
    name: 'Compressor C',
    type: 'Air Compressor',
    icon: '🌀',
    dataSource: 'Simulated',
    temperature: 30.0,
    vibration: 0,
    healthScore: 100,
    failureRisk: 0,
    status: 'Healthy',
    lastUpdate: Date.now()
  }
};

// Alert logs storage
let alertLogs = [];

// Serial port connection status
let serialConnected = false;

// ==================== HEALTH CALCULATIONS ====================

/**
 * Calculate health score based on temperature and vibration
 * Formula: Health Score = 100 - (temp × 1.2 + vibration × 30)
 */
function calculateHealthScore(temperature, vibration) {
  let score = 100 - (temperature * 1.2 + vibration * 30);
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

/**
 * Calculate failure risk percentage
 * Formula: Failure Risk = 100 - Health Score
 */
function calculateFailureRisk(healthScore) {
  return Math.round((100 - healthScore) * 10) / 10;
}

/**
 * Determine machine status based on failure risk
 */
function getStatus(failureRisk) {
  if (failureRisk >= 70) return 'Critical';
  if (failureRisk >= 50) return 'Warning';
  if (failureRisk >= 30) return 'Caution';
  return 'Healthy';
}

/**
 * Get status color for frontend
 */
function getStatusColor(status) {
  switch (status) {
    case 'Critical': return '#ef4444';
    case 'Warning': return '#f97316';
    case 'Caution': return '#eab308';
    default: return '#22c55e';
  }
}

// ==================== ALERT SYSTEM ====================

/**
 * Generate alert log entry
 */
function generateAlert(machine, eventMessage, severity) {
  const alert = {
    id: Date.now(),
    time: new Date().toISOString(),
    timeFormatted: new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    }),
    machine: machine.name,
    machineId: machine.id,
    event: eventMessage,
    severity: severity,
    temperature: machine.temperature,
    failureRisk: machine.failureRisk
  };
  
  // Add to beginning of logs array
  alertLogs.unshift(alert);
  
  // Keep only last MAX_LOGS entries
  if (alertLogs.length > MAX_LOGS) {
    alertLogs = alertLogs.slice(0, MAX_LOGS);
  }
  
  console.log(`🚨 ALERT: ${machine.name} - ${eventMessage} (${severity})`);
  return alert;
}

/**
 * Check and generate alerts for a machine
 */
function checkAndGenerateAlerts(machine, previousRisk) {
  const currentRisk = machine.failureRisk;
  
  // Generate alert when crossing threshold (going up)
  if (currentRisk >= FAILURE_RISK_THRESHOLD && previousRisk < FAILURE_RISK_THRESHOLD) {
    generateAlert(
      machine,
      `Failure risk exceeded ${FAILURE_RISK_THRESHOLD}% - Immediate attention required!`,
      'CRITICAL'
    );
  }
  
  // Generate warning alert
  if (currentRisk >= 50 && currentRisk < 70 && previousRisk < 50) {
    generateAlert(
      machine,
      `Failure risk elevated to ${currentRisk.toFixed(1)}% - Monitor closely`,
      'WARNING'
    );
  }
  
  // Temperature spike alert
  if (machine.temperature > 60 && previousRisk < currentRisk) {
    generateAlert(
      machine,
      `High temperature detected: ${machine.temperature.toFixed(1)}°C`,
      'WARNING'
    );
  }
  
  // Vibration alert
  if (machine.vibration === 1) {
    // Only alert occasionally to avoid spam
    const recentVibrationAlert = alertLogs.find(
      log => log.machineId === machine.id && 
             log.event.includes('Vibration') && 
             Date.now() - new Date(log.time).getTime() < 10000
    );
    
    if (!recentVibrationAlert) {
      generateAlert(
        machine,
        `Abnormal vibration detected - Check mechanical components`,
        'WARNING'
      );
    }
  }
}

// ==================== MACHINE UPDATE FUNCTIONS ====================

/**
 * Update Motor A with real sensor data
 */
function updateMotorA() {
  const previousRisk = fleetData.motorA.failureRisk;
  
  fleetData.motorA.temperature = realSensorData.temperature;
  fleetData.motorA.vibration = realSensorData.vibration;
  fleetData.motorA.healthScore = calculateHealthScore(
    fleetData.motorA.temperature,
    fleetData.motorA.vibration
  );
  fleetData.motorA.failureRisk = calculateFailureRisk(fleetData.motorA.healthScore);
  fleetData.motorA.status = getStatus(fleetData.motorA.failureRisk);
  fleetData.motorA.statusColor = getStatusColor(fleetData.motorA.status);
  fleetData.motorA.lastUpdate = Date.now();
  
  checkAndGenerateAlerts(fleetData.motorA, previousRisk);
}

/**
 * Simulate Pump B data (slightly varies from Motor A)
 */
function updatePumpB() {
  const previousRisk = fleetData.pumpB.failureRisk;
  
  // Base on real data with variations
  const baseTemp = realSensorData.temperature;
  const variation = (Math.random() - 0.5) * 10; // ±5°C variation
  
  fleetData.pumpB.temperature = Math.max(20, Math.min(80, baseTemp + variation + 3));
  fleetData.pumpB.vibration = Math.random() > 0.85 ? 1 : realSensorData.vibration;
  fleetData.pumpB.healthScore = calculateHealthScore(
    fleetData.pumpB.temperature,
    fleetData.pumpB.vibration
  );
  fleetData.pumpB.failureRisk = calculateFailureRisk(fleetData.pumpB.healthScore);
  fleetData.pumpB.status = getStatus(fleetData.pumpB.failureRisk);
  fleetData.pumpB.statusColor = getStatusColor(fleetData.pumpB.status);
  fleetData.pumpB.lastUpdate = Date.now();
  
  checkAndGenerateAlerts(fleetData.pumpB, previousRisk);
}

/**
 * Simulate Compressor C data (slightly varies from Motor A)
 */
function updateCompressorC() {
  const previousRisk = fleetData.compressorC.failureRisk;
  
  // Base on real data with variations
  const baseTemp = realSensorData.temperature;
  const variation = (Math.random() - 0.5) * 8; // ±4°C variation
  
  fleetData.compressorC.temperature = Math.max(22, Math.min(75, baseTemp + variation - 2));
  fleetData.compressorC.vibration = Math.random() > 0.9 ? 1 : 0;
  fleetData.compressorC.healthScore = calculateHealthScore(
    fleetData.compressorC.temperature,
    fleetData.compressorC.vibration
  );
  fleetData.compressorC.failureRisk = calculateFailureRisk(fleetData.compressorC.healthScore);
  fleetData.compressorC.status = getStatus(fleetData.compressorC.failureRisk);
  fleetData.compressorC.statusColor = getStatusColor(fleetData.compressorC.status);
  fleetData.compressorC.lastUpdate = Date.now();
  
  checkAndGenerateAlerts(fleetData.compressorC, previousRisk);
}

/**
 * Update all fleet machines
 */
function updateFleet() {
  updateMotorA();
  updatePumpB();
  updateCompressorC();
}

// ==================== SERIAL PORT SETUP ====================

let serialPort = null;
let parser = null;

async function setupSerialPort() {
  // Skip serial port setup on Vercel (serverless environment)
  if (process.env.VERCEL || process.env.SERVERLESS) {
    console.log('☁️  Running on Vercel - Serial port disabled');
    console.log('   Waiting for IoT data via POST /api/iot-data');
    startSimulationMode();
    return;
  }
  
  try {
    // Dynamically import serialport (ES module)
    const { SerialPort } = await import('serialport');
    const { ReadlineParser } = await import('@serialport/parser-readline');
    
    serialPort = new SerialPort({
      path: SERIAL_PORT_PATH,
      baudRate: BAUD_RATE,
      autoOpen: false
    });
    
    parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    
    serialPort.open((err) => {
      if (err) {
        console.log(`⚠️  Serial port ${SERIAL_PORT_PATH} not available. Using simulation mode.`);
        console.log(`   To connect Arduino, update SERIAL_PORT_PATH in app.js or set SERIAL_PORT env variable.`);
        serialConnected = false;
        startSimulationMode();
        return;
      }
      
      console.log(`✅ Serial port ${SERIAL_PORT_PATH} connected successfully!`);
      serialConnected = true;
    });
    
    // Handle incoming serial data
    parser.on('data', (data) => {
      try {
        // Skip initialization messages
        if (data.includes('Predictive') || data.includes('Format') || data.includes('---')) {
          return;
        }
        
        const parts = data.trim().split(',');
        if (parts.length === 2) {
          const temp = parseFloat(parts[0]);
          const vib = parseInt(parts[1]);
          
          if (!isNaN(temp) && !isNaN(vib)) {
            realSensorData.temperature = temp;
            realSensorData.vibration = vib;
            realSensorData.lastUpdate = Date.now();
            
            // Update fleet with new data
            updateFleet();
            
            console.log(`📊 Sensor: Temp=${temp.toFixed(1)}°C, Vibration=${vib}`);
          }
        }
      } catch (error) {
        console.error('Error parsing serial data:', error.message);
      }
    });
    
    serialPort.on('error', (err) => {
      console.error('Serial port error:', err.message);
      serialConnected = false;
    });
    
    serialPort.on('close', () => {
      console.log('Serial port closed');
      serialConnected = false;
    });
    
  } catch (error) {
    console.log(`⚠️  Could not initialize serial port: ${error.message}`);
    console.log('   Starting in simulation mode...');
    startSimulationMode();
  }
}

// ==================== SIMULATION MODE ====================

let simulationInterval = null;

function startSimulationMode() {
  console.log('🔄 Running in SIMULATION MODE');
  console.log('   Generating synthetic sensor data...');
  
  // Simulate sensor data updates
  simulationInterval = setInterval(() => {
    // Simulate temperature fluctuations (20-70°C range)
    const timeComponent = Math.sin(Date.now() / 10000) * 15; // Slow wave
    const noise = (Math.random() - 0.5) * 5; // Random noise
    realSensorData.temperature = Math.max(20, Math.min(70, 35 + timeComponent + noise));
    
    // Simulate occasional vibration events
    realSensorData.vibration = Math.random() > 0.9 ? 1 : 0;
    realSensorData.lastUpdate = Date.now();
    
    // Update fleet
    updateFleet();
    
  }, 1000);
}

// ==================== REST API ENDPOINTS ====================

/**
 * GET /api/fleet
 * Returns all fleet machine data, health scores, and recent logs
 */
app.get('/api/fleet', (req, res) => {
  // Get fleet array sorted by failure risk (highest first)
  const machines = [
    fleetData.motorA,
    fleetData.pumpB,
    fleetData.compressorC
  ].map(machine => ({
    ...machine,
    temperatureFormatted: `${machine.temperature.toFixed(1)}°C`,
    healthScoreFormatted: `${machine.healthScore.toFixed(1)}%`,
    failureRiskFormatted: `${machine.failureRisk.toFixed(1)}%`,
    vibrationStatus: machine.vibration === 1 ? 'Detected' : 'Normal'
  }));
  
  // Sort by failure risk for ranking
  const rankedMachines = [...machines].sort((a, b) => b.failureRisk - a.failureRisk);
  
  // Get top machine at risk
  const topRiskMachine = rankedMachines[0];
  
  // Calculate fleet statistics
  const avgHealthScore = machines.reduce((sum, m) => sum + m.healthScore, 0) / machines.length;
  const avgFailureRisk = machines.reduce((sum, m) => sum + m.failureRisk, 0) / machines.length;
  const criticalCount = machines.filter(m => m.status === 'Critical').length;
  const warningCount = machines.filter(m => m.status === 'Warning' || m.status === 'Caution').length;
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    serialConnected,
    simulationMode: !serialConnected,
    
    // Fleet machines data
    machines,
    
    // Risk ranking
    rankedMachines,
    topRiskMachine: {
      name: topRiskMachine.name,
      icon: topRiskMachine.icon,
      failureRisk: topRiskMachine.failureRisk,
      status: topRiskMachine.status,
      statusColor: topRiskMachine.statusColor
    },
    
    // Fleet statistics
    fleetStats: {
      totalMachines: machines.length,
      avgHealthScore: Math.round(avgHealthScore * 10) / 10,
      avgFailureRisk: Math.round(avgFailureRisk * 10) / 10,
      criticalCount,
      warningCount,
      healthyCount: machines.length - criticalCount - warningCount
    },
    
    // Recent logs (last 5)
    logs: alertLogs.slice(0, MAX_LOGS),
    
    // Raw sensor data
    rawSensorData: {
      temperature: realSensorData.temperature,
      vibration: realSensorData.vibration,
      lastUpdate: realSensorData.lastUpdate
    }
  });
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    serialConnected,
    simulationMode: !serialConnected
  });
});

/**
 * GET /api/logs
 * Returns only alert logs
 */
app.get('/api/logs', (req, res) => {
  res.json({
    success: true,
    logs: alertLogs
  });
});

/**
 * POST /api/iot-data
 * Receive real sensor data from read_arduino.py (Raspberry Pi)
 * Expected payload: { VIB: 1.05, TEMP: 28.9, HUM: 47, GAS: 58, DIST: 4.56 }
 */
app.post('/api/iot-data', (req, res) => {
  try {
    const { VIB, TEMP, HUM, GAS, DIST } = req.body;
    
    // Update real sensor data from Arduino
    if (TEMP !== undefined) {
      realSensorData.temperature = parseFloat(TEMP);
    }
    if (VIB !== undefined) {
      // Convert vibration value to binary (0/1) based on threshold
      realSensorData.vibration = parseFloat(VIB) > 1.5 ? 1 : 0;
    }
    realSensorData.lastUpdate = Date.now();
    
    // Store additional sensor data
    realSensorData.humidity = HUM !== undefined ? parseFloat(HUM) : null;
    realSensorData.gasLevel = GAS !== undefined ? parseFloat(GAS) : null;
    realSensorData.distance = DIST !== undefined ? parseFloat(DIST) : null;
    
    // Mark as receiving real data
    serialConnected = true;
    
    // Update fleet with new data
    updateFleet();
    
    console.log(`📡 IoT Data: TEMP=${TEMP}°C, VIB=${VIB}, HUM=${HUM}%, GAS=${GAS}, DIST=${DIST}cm`);
    
    res.json({
      success: true,
      message: 'Sensor data received',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing IoT data:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/iot-data
 * Receive sensor data from read_arduino.py (Python IoT bridge)
 * Expects: { VIB: number, TEMP: number, HUM?: number, GAS?: number, DIST?: number }
 */
app.post('/api/iot-data', (req, res) => {
  try {
    const { VIB, TEMP, HUM, GAS, DIST } = req.body;
    
    // Validate required fields
    if (TEMP === undefined || VIB === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: TEMP and VIB'
      });
    }
    
    // Update real sensor data
    realSensorData.temperature = parseFloat(TEMP);
    realSensorData.vibration = parseFloat(VIB) > 0.5 ? 1 : 0; // Threshold for vibration detection
    realSensorData.lastUpdate = Date.now();
    
    // Store additional sensor data if provided
    if (HUM !== undefined) realSensorData.humidity = parseFloat(HUM);
    if (GAS !== undefined) realSensorData.gasLevel = parseFloat(GAS);
    if (DIST !== undefined) realSensorData.distance = parseFloat(DIST);
    
    // Mark as connected (not simulation)
    serialConnected = true;
    
    // Stop simulation if running
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
      console.log('✅ Switched from simulation to live IoT data');
    }
    
    // Update fleet with new sensor data
    updateFleet();
    
    console.log(`📡 IoT Data: Temp=${TEMP}°C, Vib=${VIB}, Hum=${HUM || 'N/A'}%, Gas=${GAS || 'N/A'}, Dist=${DIST || 'N/A'}cm`);
    
    res.json({
      success: true,
      message: 'Sensor data received',
      data: {
        temperature: realSensorData.temperature,
        vibration: realSensorData.vibration,
        humidity: realSensorData.humidity,
        gasLevel: realSensorData.gasLevel,
        distance: realSensorData.distance,
        timestamp: realSensorData.lastUpdate
      }
    });
  } catch (error) {
    console.error('Error processing IoT data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/test-alert
 * Generate a test alert (for demo purposes)
 */
app.post('/api/test-alert', (req, res) => {
  const testMachine = {
    name: 'Test Machine',
    id: 'test',
    temperature: 75,
    failureRisk: 85
  };
  
  const alert = generateAlert(testMachine, 'Test alert generated', 'CRITICAL');
  
  res.json({
    success: true,
    message: 'Test alert generated',
    alert
  });
});

/**
 * GET /
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Predictive Maintenance System API',
    version: '1.0.0',
    description: 'Industry 4.0 IoT Backend - PS 9.4 SDG 9',
    endpoints: {
      '/api/fleet': 'GET - Fleet machine data, health scores, and logs',
      '/api/health': 'GET - Server health check',
      '/api/logs': 'GET - Alert logs only',
      '/api/iot-data': 'POST - Receive sensor data from Arduino/Python bridge',
      '/api/test-alert': 'POST - Generate test alert'
    },
    serialPort: SERIAL_PORT_PATH,
    serialConnected,
    simulationMode: !serialConnected
  });
});

// ==================== SERVER STARTUP ====================

app.listen(PORT, () => {
  console.log('\n========================================');
  console.log('🏭 PREDICTIVE MAINTENANCE SYSTEM');
  console.log('   PS 9.4 - SDG 9: Industry Innovation');
  console.log('========================================');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Serial port: ${SERIAL_PORT_PATH}`);
  console.log('----------------------------------------');
  
  // Initialize serial connection
  setupSerialPort();
  
  // Update fleet every second (even without new serial data)
  setInterval(() => {
    if (serialConnected) {
      // Only update simulated machines when serial is connected
      // Real machine updates from serial data handler
      updatePumpB();
      updateCompressorC();
    }
  }, 1000);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  if (serialPort && serialPort.isOpen) {
    serialPort.close();
  }
  if (simulationInterval) {
    clearInterval(simulationInterval);
  }
  process.exit(0);
});

module.exports = app;