/*
 * Predictive Maintenance System - Arduino Sketch
 * PS 9.4 - SDG 9: Industry Innovation
 * 
 * Hardware Components:
 * - Arduino UNO
 * - MQ2 Gas Sensor (A0 → Pin A0)
 * - IR Sensor (OUT → Pin D7)
 * - DHT11 Temperature/Humidity Sensor (DATA → Pin D4)
 * - MPU6050 Accelerometer/Gyroscope (SDA → A4, SCL → A5)
 * - HCSR04 Ultrasonic Sensor (Trig → D9, Echo → D10)
 * 
 * Wiring:
 * MQ2:     A0→A0, VCC→5V, GND→GND
 * IR:      OUT→D7, VCC→5V, GND→GND
 * DHT11:   DATA→D4, VCC→5V, GND→GND
 * MPU6050: SDA→A4, SCL→A5, VCC→5V, GND→GND
 * HCSR04:  Trig→D9, Echo→D10, VCC→5V, GND→GND
 * 
 * Output Format: temperature,humidity,gas,distance,vibration,accelX,accelY,accelZ
 */

#include <DHT.h>
#include <Wire.h>

// Pin Definitions
#define DHT_PIN 4              // DHT11 data pin (D4)
#define DHT_TYPE DHT11         // DHT sensor type
#define MQ2_PIN A0             // MQ2 gas sensor analog pin
#define IR_PIN 7               // IR sensor digital output pin (D7)
#define TRIG_PIN 9             // HCSR04 trigger pin (D9)
#define ECHO_PIN 10            // HCSR04 echo pin (D10)
#define MPU6050_ADDR 0x68      // MPU6050 I2C address

// Initialize DHT sensor
DHT dht(DHT_PIN, DHT_TYPE);

// Variables
float temperature = 0.0;
float humidity = 0.0;
int gasValue = 0;
float distance = 0.0;
int irDetected = 0;
float accelX = 0.0, accelY = 0.0, accelZ = 0.0;
float gyroX = 0.0, gyroY = 0.0, gyroZ = 0.0;
unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL = 1000; // Read every 1 second

void setup() {
  // Initialize Serial communication
  Serial.begin(9600);
  
  // Initialize I2C for MPU6050
  Wire.begin();
  
  // Initialize MPU6050
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x6B);  // PWR_MGMT_1 register
  Wire.write(0);     // Wake up MPU6050
  Wire.endTransmission(true);
  
  // Initialize DHT sensor
  dht.begin();
  
  // Configure pins
  pinMode(IR_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(MQ2_PIN, INPUT);
  
  // Startup message
  Serial.println("Predictive Maintenance System Initialized");
  Serial.println("Format: temp,humidity,gas,distance,ir,accelX,accelY,accelZ");
  Serial.println("-----------------------------------");
  
  // Allow sensors to stabilize
  delay(2000);
}

// Function to read HCSR04 ultrasonic sensor
float readUltrasonic() {
  // Clear trigger
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  
  // Send 10µs pulse
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Read echo time
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  
  // Calculate distance in cm (speed of sound = 343 m/s)
  float dist = duration * 0.034 / 2;
  
  // Return 0 if out of range
  if (dist <= 0 || dist > 400) {
    return 0;
  }
  return dist;
}

// Function to read MPU6050 accelerometer/gyroscope
void readMPU6050() {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x3B);  // Starting register for accelerometer data
  Wire.endTransmission(false);
  Wire.requestFrom((uint8_t)MPU6050_ADDR, (uint8_t)14, (uint8_t)true);
  
  // Read accelerometer data (raw values)
  int16_t accelXRaw = (Wire.read() << 8) | Wire.read();
  int16_t accelYRaw = (Wire.read() << 8) | Wire.read();
  int16_t accelZRaw = (Wire.read() << 8) | Wire.read();
  
  // Skip temperature (2 bytes)
  int16_t tempRaw = (Wire.read() << 8) | Wire.read();
  (void)tempRaw; // Suppress unused variable warning
  
  // Read gyroscope data (raw values)
  int16_t gyroXRaw = (Wire.read() << 8) | Wire.read();
  int16_t gyroYRaw = (Wire.read() << 8) | Wire.read();
  int16_t gyroZRaw = (Wire.read() << 8) | Wire.read();
  
  // Convert to g (±2g range, 16384 LSB/g)
  accelX = accelXRaw / 16384.0;
  accelY = accelYRaw / 16384.0;
  accelZ = accelZRaw / 16384.0;
  
  // Convert to degrees/second (±250°/s range, 131 LSB/°/s)
  gyroX = gyroXRaw / 131.0;
  gyroY = gyroYRaw / 131.0;
  gyroZ = gyroZRaw / 131.0;
}

void loop() {
  unsigned long currentTime = millis();
  
  // Read sensors every READ_INTERVAL milliseconds
  if (currentTime - lastReadTime >= READ_INTERVAL) {
    lastReadTime = currentTime;
    
    // Read temperature and humidity from DHT11
    temperature = dht.readTemperature();
    humidity = dht.readHumidity();
    
    // Read gas value from MQ2 (0-1023)
    gasValue = analogRead(MQ2_PIN);
    
    // Read IR sensor (HIGH = object detected, LOW = no object)
    irDetected = digitalRead(IR_PIN);
    
    // Read ultrasonic distance
    distance = readUltrasonic();
    
    // Read MPU6050 accelerometer/gyroscope
    readMPU6050();
    
    // Check if temperature reading is valid
    if (isnan(temperature)) {
      temperature = 25.0; // Default room temperature
    }
    if (isnan(humidity)) {
      humidity = 50.0; // Default humidity
    }
    
    // Clamp values to realistic ranges
    temperature = constrain(temperature, 0.0, 100.0);
    humidity = constrain(humidity, 0.0, 100.0);
    
    // Send data via Serial in CSV format
    // Format: temp,humidity,gas,distance,ir,accelX,accelY,accelZ
    Serial.print(temperature, 1);
    Serial.print(",");
    Serial.print(humidity, 1);
    Serial.print(",");
    Serial.print(gasValue);
    Serial.print(",");
    Serial.print(distance, 1);
    Serial.print(",");
    Serial.print(irDetected);
    Serial.print(",");
    Serial.print(accelX, 2);
    Serial.print(",");
    Serial.print(accelY, 2);
    Serial.print(",");
    Serial.println(accelZ, 2);
  }
}

/*
 * Expected Serial Output Examples:
 * 25.5,60.0,150,45.2,0,0.02,-0.01,1.00
 * 
 * Data Fields:
 * - temperature (°C): DHT11 temperature reading
 * - humidity (%): DHT11 humidity reading
 * - gas (0-1023): MQ2 analog value (higher = more gas)
 * - distance (cm): HCSR04 ultrasonic distance
 * - ir (0/1): IR sensor detection (1 = object detected)
 * - accelX, accelY, accelZ (g): MPU6050 acceleration values
 * 
 * The backend will use this data to calculate:
 * - Health Score (0-100)
 * - Failure Risk Percentage
 * - Vibration analysis from accelerometer
 * - Gas leak detection
 * - Proximity/obstacle detection
 */
