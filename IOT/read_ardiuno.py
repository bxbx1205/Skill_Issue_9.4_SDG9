import serial
import time
import requests
import sys
import os

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


def send_to_backend(payload):
    try:
        r = requests.post(BACKEND_URL, json=payload, timeout=3)
        if r.status_code == 200:
            print("[SENT]", payload)
        else:
            print("[ERROR] Backend status:", r.status_code)
    except requests.exceptions.RequestException as e:
        print("[NETWORK ERROR]", e)


def main():
    ser = connect_serial()

    print("[START] Streaming data to backend...\n")

    while True:
        try:
            raw = ser.readline().decode("utf-8", errors="ignore").strip()

            if not raw:
                continue

            # Ignore Arduino boot messages
            if "MPU6050" in raw:
                continue

            payload = parse_line(raw)

            if payload is None:
                continue

            send_to_backend(payload)

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
