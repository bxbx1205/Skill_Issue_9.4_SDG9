/*
 * Industrial IoT - Arduino Sensor Interface
 * 
 * Hardware:
 * - Arduino UNO
 * - DHT11 Temperature & Humidity Sensor (Pin 2)
 * - SW-420 Vibration Sensor (Pin 3)
 * 
 * Serial Output Format: TEMP:25.5,VIB:0
 * 
 * This code reads sensor data and sends it to the Raspberry Pi
 * via serial communication at 9600 baud.
 */

#include <DHT.h>

// Pin definitions
#define DHT_PIN 2
#define DHT_TYPE DHT11
#define VIBRATION_PIN 3

// Sensor initialization
DHT dht(DHT_PIN, DHT_TYPE);

// Vibration detection
volatile int vibrationState = 0;

void setup() {
  Serial.begin(9600);
  
  // Initialize DHT sensor
  dht.begin();
  
  // Initialize vibration sensor
  pinMode(VIBRATION_PIN, INPUT);
  attachInterrupt(digitalPinToInterrupt(VIBRATION_PIN), detectVibration, RISING);
  
  // Startup indicator
  Serial.println("SYSTEM:READY");
  delay(2000);
}

void loop() {
  // Read temperature from DHT11
  float temperature = dht.readTemperature();
  
  // Check if reading failed
  if (isnan(temperature)) {
    Serial.println("ERROR:DHT_READ_FAILED");
    delay(2000);
    return;
  }
  
  // Read vibration state (reset after reading)
  int currentVibration = vibrationState;
  vibrationState = 0;
  
  // Send data in compact format
  Serial.print("TEMP:");
  Serial.print(temperature, 1);
  Serial.print(",VIB:");
  Serial.println(currentVibration);
  
  // Update every 2 seconds
  delay(2000);
}

// Interrupt handler for vibration detection
void detectVibration() {
  vibrationState = 1;
}
