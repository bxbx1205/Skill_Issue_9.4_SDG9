#include <Wire.h>
#include <I2Cdev.h>
#include <MPU6050.h>
#include "DHT.h"

// ---------------- PIN CONFIG ----------------
#define DHTPIN 4
#define DHTTYPE DHT11

#define MQ2_PIN A0
#define TRIG_PIN 9
#define ECHO_PIN 10
// -------------------------------------------

DHT dht(DHTPIN, DHTTYPE);
MPU6050 mpu;

// variables
float vibration = 0.0;
long duration;
float distanceCM;

void setup() {
  Serial.begin(9600);
  Wire.begin();

  // Initialize sensors
  dht.begin();
  mpu.initialize();

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // MPU6050 status
  if (mpu.testConnection()) {
    Serial.println("MPU6050 OK");
  } else {
    Serial.println("MPU6050 FAIL");
  }

  delay(2000);
}

void loop() {
  // -------- MPU6050 (Vibration) --------
  int16_t ax, ay, az;
  mpu.getAcceleration(&ax, &ay, &az);

  float axf = ax / 16384.0;
  float ayf = ay / 16384.0;
  float azf = az / 16384.0;

  vibration = sqrt(axf * axf + ayf * ayf + azf * azf);

  if (isnan(vibration) || vibration < 0) {
    vibration = 0.0;
  }

  // -------- DHT11 (Temperature & Humidity) --------
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  if (isnan(temperature) || isnan(humidity)) {
    temperature = -1;
    humidity = -1;
  }

  // -------- MQ-2 (Gas) --------
  int gasValue = analogRead(MQ2_PIN);

  // -------- HC-SR04 (Distance) --------
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  duration = pulseIn(ECHO_PIN, HIGH, 30000);

  if (duration == 0) {
    distanceCM = -1;
  } else {
    distanceCM = duration * 0.034 / 2;
  }

  // -------- SERIAL OUTPUT --------
  Serial.print("VIB=");
  Serial.print(vibration, 2);

  Serial.print(",TEMP=");
  Serial.print(temperature);

  Serial.print(",HUM=");
  Serial.print(humidity);

  Serial.print(",GAS=");
  Serial.print(gasValue);

  Serial.print(",DIST=");
  Serial.println(distanceCM);

  delay(1000); // 1 second interval
}
