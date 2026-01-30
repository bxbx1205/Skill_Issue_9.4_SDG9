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

// Real sensor data from Arduino/IoT
let realSensorData = {
  temperature: 25.0,   // TEMP sensor
  vibration: 0,        // VIB sensor (raw value)
  humidity: 50.0,      // HUM sensor
  gasLevel: 100.0,     // GAS sensor
  distance: 0,         // DIST sensor
  lastUpdate: Date.now()
};

// Fleet machines data - Each machine controlled by a DIFFERENT sensor
let fleetData = {
  // Vibration Motor - Controlled by VIB sensor
  vibrationMotor: {
    id: 'vibration-motor',
    name: 'Vibration Motor',
    type: 'Industrial Motor',
    icon: '⚙️',
    dataSource: 'VIB Sensor',
    sensorType: 'VIB',
    temperature: 25.0,
    vibration: 0,
    sensorValue: 0,
    healthScore: 100,
    failureRisk: 0,
    status: 'Healthy',
    lastUpdate: Date.now()
  },
  // Temperature Pump - Controlled by TEMP sensor
  tempPump: {
    id: 'temp-pump',
    name: 'Thermal Pump',
    type: 'Heat Exchange Pump',
    icon: '🌡️',
    dataSource: 'TEMP Sensor',
    sensorType: 'TEMP',
    temperature: 25.0,
    vibration: 0,
    sensorValue: 25.0,
    healthScore: 100,
    failureRisk: 0,
    status: 'Healthy',
    lastUpdate: Date.now()
  },
  // Humidity Compressor - Controlled by HUM sensor
  humidityCompressor: {
    id: 'humidity-compressor',
    name: 'Humidity Controller',
    type: 'Air Compressor',
    icon: '💧',
    dataSource: 'HUM Sensor',
    sensorType: 'HUM',
    temperature: 25.0,
    vibration: 0,
    sensorValue: 50.0,
    healthScore: 100,
    failureRisk: 0,
    status: 'Healthy',
    lastUpdate: Date.now()
  },
  // Gas Detector - Controlled by GAS sensor
  gasDetector: {
    id: 'gas-detector',
    name: 'Gas Detector',
    type: 'Gas Pipeline Monitor',
    icon: '🔥',
    dataSource: 'GAS Sensor',
    sensorType: 'GAS',
    temperature: 25.0,
    vibration: 0,
    sensorValue: 100.0,
    gasLevel: 100.0,
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
 * Calculate health and risk for VIB sensor
 * Vibration > 1.5 = abnormal, > 2.5 = critical
 */
function calculateVibrationHealth(vibValue) {
  if (vibValue > 2.5) return { health: 20, risk: 80, status: 'Critical' };
  if (vibValue > 2.0) return { health: 40, risk: 60, status: 'Warning' };
  if (vibValue > 1.5) return { health: 60, risk: 40, status: 'Caution' };
  if (vibValue > 1.0) return { health: 80, risk: 20, status: 'Healthy' };
  return { health: 100, risk: 0, status: 'Healthy' };
}

/**
 * Calculate health and risk for TEMP sensor
 * Temp > 50 = warning, > 70 = critical
 */
function calculateTempHealth(tempValue) {
  if (tempValue > 70) return { health: 15, risk: 85, status: 'Critical' };
  if (tempValue > 60) return { health: 35, risk: 65, status: 'Warning' };
  if (tempValue > 50) return { health: 55, risk: 45, status: 'Caution' };
  if (tempValue > 40) return { health: 75, risk: 25, status: 'Healthy' };
  return { health: 100, risk: 0, status: 'Healthy' };
}

/**
 * Calculate health and risk for HUM sensor
 * Humidity < 30 or > 70 = warning, < 20 or > 80 = critical
 */
function calculateHumidityHealth(humValue) {
  if (humValue < 20 || humValue > 80) return { health: 20, risk: 80, status: 'Critical' };
  if (humValue < 30 || humValue > 70) return { health: 50, risk: 50, status: 'Warning' };
  if (humValue < 35 || humValue > 65) return { health: 70, risk: 30, status: 'Caution' };
  return { health: 100, risk: 0, status: 'Healthy' };
}

/**
 * Calculate health and risk for GAS sensor
 * Gas > 300 = leak detected, > 500 = critical leak
 */
function calculateGasHealth(gasValue) {
  if (gasValue > 500) return { health: 10, risk: 90, status: 'Critical' };
  if (gasValue > 300) return { health: 30, risk: 70, status: 'Warning' };
  if (gasValue > 200) return { health: 60, risk: 40, status: 'Caution' };
  if (gasValue > 150) return { health: 80, risk: 20, status: 'Healthy' };
  return { health: 100, risk: 0, status: 'Healthy' };
}

/**
 * Update Vibration Motor with VIB sensor data
 */
function updateVibrationMotor() {
  const previousRisk = fleetData.vibrationMotor.failureRisk;
  const vibValue = realSensorData.vibration;
  
  const { health, risk, status } = calculateVibrationHealth(vibValue);
  
  fleetData.vibrationMotor.sensorValue = vibValue;
  fleetData.vibrationMotor.temperature = 25 + (vibValue * 10); // Correlate temp with vibration
  fleetData.vibrationMotor.vibration = vibValue > 1.5 ? 1 : 0;
  fleetData.vibrationMotor.healthScore = health;
  fleetData.vibrationMotor.failureRisk = risk;
  fleetData.vibrationMotor.status = status;
  fleetData.vibrationMotor.statusColor = getStatusColor(status);
  fleetData.vibrationMotor.lastUpdate = Date.now();
  
  checkAndGenerateAlerts(fleetData.vibrationMotor, previousRisk);
}

/**
 * Update Thermal Pump with TEMP sensor data
 */
function updateTempPump() {
  const previousRisk = fleetData.tempPump.failureRisk;
  const tempValue = realSensorData.temperature;
  
  const { health, risk, status } = calculateTempHealth(tempValue);
  
  fleetData.tempPump.sensorValue = tempValue;
  fleetData.tempPump.temperature = tempValue;
  fleetData.tempPump.vibration = tempValue > 60 ? 1 : 0; // High temp causes vibration
  fleetData.tempPump.healthScore = health;
  fleetData.tempPump.failureRisk = risk;
  fleetData.tempPump.status = status;
  fleetData.tempPump.statusColor = getStatusColor(status);
  fleetData.tempPump.lastUpdate = Date.now();
  
  checkAndGenerateAlerts(fleetData.tempPump, previousRisk);
}

/**
 * Update Humidity Controller with HUM sensor data
 */
function updateHumidityCompressor() {
  const previousRisk = fleetData.humidityCompressor.failureRisk;
  const humValue = realSensorData.humidity;
  
  const { health, risk, status } = calculateHumidityHealth(humValue);
  
  fleetData.humidityCompressor.sensorValue = humValue;
  fleetData.humidityCompressor.temperature = 25 + Math.abs(humValue - 50) * 0.5; // Temp varies with humidity deviation
  fleetData.humidityCompressor.vibration = (humValue < 30 || humValue > 70) ? 1 : 0;
  fleetData.humidityCompressor.humidity = humValue;
  fleetData.humidityCompressor.healthScore = health;
  fleetData.humidityCompressor.failureRisk = risk;
  fleetData.humidityCompressor.status = status;
  fleetData.humidityCompressor.statusColor = getStatusColor(status);
  fleetData.humidityCompressor.lastUpdate = Date.now();
  
  checkAndGenerateAlerts(fleetData.humidityCompressor, previousRisk);
}

/**
 * Update Gas Detector with GAS sensor data
 */
function updateGasDetector() {
  const previousRisk = fleetData.gasDetector.failureRisk;
  const gasValue = realSensorData.gasLevel;
  
  const { health, risk, status } = calculateGasHealth(gasValue);
  
  fleetData.gasDetector.sensorValue = gasValue;
  fleetData.gasDetector.gasLevel = gasValue;
  fleetData.gasDetector.temperature = 25 + (gasValue > 300 ? (gasValue - 300) * 0.1 : 0); // Gas leak may cause heat
  fleetData.gasDetector.vibration = gasValue > 300 ? 1 : 0; // Leak triggers vibration alert
  fleetData.gasDetector.healthScore = health;
  fleetData.gasDetector.failureRisk = risk;
  fleetData.gasDetector.status = status;
  fleetData.gasDetector.statusColor = getStatusColor(status);
  fleetData.gasDetector.lastUpdate = Date.now();
  
  checkAndGenerateAlerts(fleetData.gasDetector, previousRisk);
}

/**
 * Update all fleet machines with their respective sensor data
 */
function updateFleet() {
  updateVibrationMotor();
  updateTempPump();
  updateHumidityCompressor();
  updateGasDetector();
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
  console.log('🔄 Running in REAL DATA MODE');
  console.log('   Waiting for IoT sensor data via POST /api/iot-data');
  console.log('   Expected format: { VIB: 0.83, TEMP: 29.3, HUM: 46.0, GAS: 143.0 }');
  console.log('   Each sensor controls a different machine:');
  console.log('   - VIB → Vibration Motor');
  console.log('   - TEMP → Thermal Pump');
  console.log('   - HUM → Humidity Controller');
  console.log('   - GAS → Gas Detector');
  
  // Initialize fleet with default safe values (waiting for real data)
  updateFleet();
}

// ==================== REST API ENDPOINTS ====================

/**
 * GET /api/fleet
 * Returns all fleet machine data, health scores, and recent logs
 */
app.get('/api/fleet', (req, res) => {
  // Get fleet array sorted by failure risk (highest first)
  const machines = [
    fleetData.vibrationMotor,
    fleetData.tempPump,
    fleetData.humidityCompressor,
    fleetData.gasDetector
  ].map(machine => ({
    ...machine,
    temperatureFormatted: `${machine.temperature.toFixed(1)}°C`,
    healthScoreFormatted: `${machine.healthScore.toFixed(1)}%`,
    failureRiskFormatted: `${machine.failureRisk.toFixed(1)}%`,
    vibrationStatus: machine.vibration === 1 ? 'Detected' : 'Normal',
    sensorValueFormatted: machine.sensorType === 'GAS' ? `${machine.sensorValue.toFixed(0)} ppm` :
                          machine.sensorType === 'HUM' ? `${machine.sensorValue.toFixed(1)}%` :
                          machine.sensorType === 'TEMP' ? `${machine.sensorValue.toFixed(1)}°C` :
                          `${machine.sensorValue.toFixed(2)}`
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
 * Expected payload: { VIB: 0.83, TEMP: 29.3, HUM: 46.0, GAS: 143.0 }
 * Each sensor controls a different industrial machine:
 * - VIB -> Vibration Motor
 * - TEMP -> Thermal Pump
 * - HUM -> Humidity Controller
 * - GAS -> Gas Detector
 */
app.post('/api/iot-data', (req, res) => {
  try {
    const { VIB, TEMP, HUM, GAS, DIST } = req.body;
    
    // Update all sensor data from IoT device
    if (VIB !== undefined) {
      realSensorData.vibration = parseFloat(VIB);
    }
    if (TEMP !== undefined) {
      realSensorData.temperature = parseFloat(TEMP);
    }
    if (HUM !== undefined) {
      realSensorData.humidity = parseFloat(HUM);
    }
    if (GAS !== undefined) {
      realSensorData.gasLevel = parseFloat(GAS);
    }
    if (DIST !== undefined) {
      realSensorData.distance = parseFloat(DIST);
    }
    
    realSensorData.lastUpdate = Date.now();
    
    // Mark as receiving real data
    serialConnected = true;
    
    // Update all fleet machines with their respective sensor data
    updateFleet();
    
    console.log(`📡 IoT Data Received:`);
    console.log(`   VIB=${VIB} → Vibration Motor`);
    console.log(`   TEMP=${TEMP}°C → Thermal Pump`);
    console.log(`   HUM=${HUM}% → Humidity Controller`);
    console.log(`   GAS=${GAS} ppm → Gas Detector`);
    
    res.json({
      success: true,
      message: 'Sensor data received and machines updated',
      timestamp: new Date().toISOString(),
      machineStatus: {
        vibrationMotor: fleetData.vibrationMotor.status,
        tempPump: fleetData.tempPump.status,
        humidityCompressor: fleetData.humidityCompressor.status,
        gasDetector: fleetData.gasDetector.status
      }
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