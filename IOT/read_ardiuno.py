import serial
import time
import requests
import sys
import os
from statistics import median
from collections import defaultdict

# ================= CONFIG =================
# Serial port: Update based on your system
# Windows: "COM3", "COM4", etc.
# Linux/Raspberry Pi: "/dev/ttyACM0", "/dev/ttyUSB0"
SERIAL_PORT = os.environ.get("SERIAL_PORT", "/dev/ttyACM0")
BAUD_RATE = 9600

# Backend URL: Set via environment variable or update here
# For local: "http://localhost:3000/api/iot-data"
# For Vercel: "https://your-backend.vercel.app/api/iot-data"
BACKEND_URL = os.environ.get("BACKEND_URL", "https://skill-issue-9-4-sdg-9.vercel.app/api/iot-data")

# Data collection interval (seconds) - collect data for this duration, then send median
# 3 seconds = 20 requests/min - realtime and accurate with noise filtering
DATA_COLLECTION_INTERVAL = 3
# ==========================================


def connect_serial():
    """Keep trying until Arduino is available"""
    while True:
        try:
            ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
            time.sleep(2)
            print(f"[OK] Connected to Arduino on {SERIAL_PORT}")
            return ser
        except serial.SerialException:
            print("[WAIT] Arduino not found, retrying...")
            time.sleep(3)


def parse_line(line):
    """
    Converts:
    VIB=1.05,TEMP=28.9,HUM=47,GAS=58,DIST=4.56
    into dict
    """
    data = {}
    parts = line.split(",")

    for part in parts:
        if "=" in part:
            key, value = part.split("=")
            try:
                data[key] = float(value)
            except ValueError:
                return None
    return data


def calculate_median_payload(data_buffer):
    """
    Calculate median for each sensor from collected data
    Returns dict with median values for each sensor key
    """
    if not data_buffer:
        return None
    
    median_payload = {}
    
    for key, values in data_buffer.items():
        if values:
            median_payload[key] = round(median(values), 2)
    
    return median_payload if median_payload else None


def send_to_backend(payload):
    try:
        r = requests.post(BACKEND_URL, json=payload, timeout=5)
        if r.status_code == 200:
            print("[SENT]", payload)
        elif r.status_code == 429:
            print("[RATE LIMITED] Backend is busy, will retry next interval")
        else:
            print("[ERROR] Backend status:", r.status_code)
    except requests.exceptions.RequestException as e:
        print("[NETWORK ERROR]", e)


def main():
    ser = connect_serial()

    print(f"[START] Collecting data every {DATA_COLLECTION_INTERVAL}s, sending median to backend...\n")

    while True:
        try:
            # Buffer to collect sensor readings over the interval
            data_buffer = defaultdict(list)
            interval_start = time.time()
            readings_count = 0
            
            # Collect data for DATA_COLLECTION_INTERVAL seconds
            while (time.time() - interval_start) < DATA_COLLECTION_INTERVAL:
                raw = ser.readline().decode("utf-8", errors="ignore").strip()

                if not raw:
                    continue

                # Ignore Arduino boot messages
                if "MPU6050" in raw:
                    continue

                payload = parse_line(raw)

                if payload is None:
                    continue

                # Add each sensor value to the buffer
                for key, value in payload.items():
                    data_buffer[key].append(value)
                
                readings_count += 1
            
            # Calculate and send median if we have data
            if readings_count > 0:
                median_payload = calculate_median_payload(data_buffer)
                
                if median_payload:
                    print(f"[MEDIAN] Calculated from {readings_count} readings")
                    send_to_backend(median_payload)
                else:
                    print("[SKIP] No valid data in this interval")
            else:
                print("[SKIP] No readings received in this interval")

        except serial.SerialException:
            print("[ERROR] Serial disconnected. Reconnecting...")
            ser.close()
            ser = connect_serial()

        except KeyboardInterrupt:
            print("\n[STOPPED] Exiting safely.")
            ser.close()
            sys.exit(0)


if __name__ == "__main__":
    main()
