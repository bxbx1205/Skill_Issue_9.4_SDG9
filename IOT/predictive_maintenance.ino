/*
 * Predictive Maintenance System - Arduino Sketch
 * PS 9.4 - SDG 9: Industry Innovation
 * 
 * Hardware Components:
 * - Arduino UNO
 * - DHT11 Temperature Sensor (DATA → Pin D2)
 * - SW-420 Vibration Sensor (DO → Pin D7)
 * 
 * Wiring:
 * DHT11: VCC→5V, DATA→D2, GND→GND
 * SW-420: VCC→5V, DO→D7, GND→GND
 * 
 * Output Format: temperature,vibration (via Serial at 9600 baud)
 * Example: 34.5,0 or 52.2,1
 */

#include <DHT.h>

// Pin Definitions
#define DHT_PIN 2          // DHT11 data pin
#define VIBRATION_PIN 7    // SW-420 digital output pin
#define DHT_TYPE DHT11     // DHT sensor type

// Initialize DHT sensor
DHT dht(DHT_PIN, DHT_TYPE);

// Variables
float temperature = 0.0;
int vibration = 0;
unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL = 1000; // Read every 1 second

void setup() {
  // Initialize Serial communication
  Serial.begin(9600);
  
  // Initialize DHT sensor
  dht.begin();
  
  // Configure vibration sensor pin as input
  pinMode(VIBRATION_PIN, INPUT);
  
  // Startup message
  Serial.println("Predictive Maintenance System Initialized");
  Serial.println("Format: temperature,vibration");
  Serial.println("-----------------------------------");
  
  // Allow sensor to stabilize
  delay(2000);
}

void loop() {
  unsigned long currentTime = millis();
  
  // Read sensors every READ_INTERVAL milliseconds
  if (currentTime - lastReadTime >= READ_INTERVAL) {
    lastReadTime = currentTime;
    
    // Read temperature from DHT11
    temperature = dht.readTemperature();
    
    // Read vibration from SW-420 (HIGH = vibration detected, LOW = no vibration)
    vibration = digitalRead(VIBRATION_PIN);
    
    // Check if temperature reading is valid
    if (isnan(temperature)) {
      // If reading fails, use last known value or default
      temperature = 25.0; // Default room temperature
    }
    
    // Clamp temperature to realistic range (0-100°C)
    temperature = constrain(temperature, 0.0, 100.0);
    
    // Send data via Serial in CSV format: temperature,vibration
    Serial.print(temperature, 1); // 1 decimal place
    Serial.print(",");
    Serial.println(vibration);
  }
}

/*
 * Expected Serial Output Examples:
 * 25.5,0  → Normal temperature, no vibration
 * 34.2,0  → Elevated temperature, no vibration
 * 45.8,1  → High temperature, vibration detected
 * 52.1,1  → Critical temperature, vibration detected
 * 
 * Vibration Values:
 * 0 = No vibration/fault detected
 * 1 = Vibration/fault detected
 * 
 * The backend will use this data to calculate:
 * - Health Score (0-100)
 * - Failure Risk Percentage
 * - Alert generation for critical conditions
 */
