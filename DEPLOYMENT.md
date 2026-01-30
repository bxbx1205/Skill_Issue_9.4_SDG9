# 🚀 Deployment Guide

## Production Deployment Strategy

This guide covers deploying the Industrial IoT system beyond localhost.

---

## 🏗️ Architecture Tiers

### Tier 1: Local Development (Current Setup)
```
Arduino (USB) → Raspberry Pi (localhost:3000) → Laptop (localhost:5173)
```
**Use case**: Testing, development, demos

### Tier 2: Local Network Deployment
```
Arduino (USB) → Raspberry Pi (192.168.x.x:3000) → Any device on network
```
**Use case**: Factory floor monitoring within facility

### Tier 3: Cloud Deployment
```
Arduino (USB) → Raspberry Pi → Cloud Backend (AWS/Azure) → Global Access
```
**Use case**: Remote monitoring, multi-site management

---

## 📦 Tier 1: Local Development (No Changes Needed)

Already configured! Both servers run on localhost.

**Access**:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

---

## 🌐 Tier 2: Local Network Deployment

### Backend Configuration

1. **Find Raspberry Pi IP**:
```bash
# On Raspberry Pi
hostname -I
# Example output: 192.168.1.100
```

2. **Update backend to allow network access**:

Edit `backend/app.js`:
```javascript
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
```

3. **Configure firewall** (if needed):
```bash
# On Raspberry Pi
sudo ufw allow 3000/tcp
```

### Frontend Configuration

1. **Update API URL**:

Edit `frontend/src/App.jsx`:
```javascript
const API_URL = 'http://192.168.1.100:3000/api/fleet';
// Replace with your Raspberry Pi IP
```

2. **Build for production**:
```bash
cd frontend
npm run build
```

3. **Serve the build**:

**Option A: Using Vite preview**:
```bash
npm run preview -- --host 0.0.0.0 --port 5173
```

**Option B: Using serve**:
```bash
npm install -g serve
serve -s dist -l 5173
```

**Option C: Using Nginx** (recommended for production):
```bash
# Install Nginx
sudo apt install nginx

# Copy build files
sudo cp -r dist/* /var/www/html/

# Nginx serves on port 80 by default
```

### Access from Other Devices

From any device on the same network:
- Frontend: http://192.168.1.100:5173 (or :80 if using Nginx)
- Backend API: http://192.168.1.100:3000/api/fleet

---

## ☁️ Tier 3: Cloud Deployment

### Backend Deployment Options

#### Option A: AWS EC2

1. **Launch EC2 instance** (t2.micro eligible for free tier)
2. **Install Node.js**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

3. **Transfer backend code**:
```bash
scp -r backend/ ubuntu@your-ec2-ip:~/
```

4. **Install dependencies & run**:
```bash
ssh ubuntu@your-ec2-ip
cd backend
npm install
node app.js
```

5. **Use PM2 for process management**:
```bash
sudo npm install -g pm2
pm2 start app.js --name industrial-iot
pm2 startup
pm2 save
```

6. **Configure security group**:
- Allow inbound TCP on port 3000

#### Option B: Heroku

1. **Create `Procfile`**:
```
web: node backend/app.js
```

2. **Deploy**:
```bash
heroku create industrial-iot-backend
git push heroku main
```

3. **Set environment variables**:
```bash
heroku config:set SERIAL_PORT=/dev/ttyUSB0
```

### Frontend Deployment Options

#### Option A: Vercel (Recommended)

1. **Update API URL** in `frontend/src/App.jsx`:
```javascript
const API_URL = 'https://your-backend.herokuapp.com/api/fleet';
```

2. **Deploy**:
```bash
cd frontend
npm install -g vercel
vercel
```

3. **Custom domain** (optional):
```bash
vercel domains add industrial-iot.yourdomain.com
```

#### Option B: Netlify

1. **Build**:
```bash
cd frontend
npm run build
```

2. **Deploy**:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Option C: AWS S3 + CloudFront

1. **Build**:
```bash
npm run build
```

2. **Create S3 bucket** with static website hosting
3. **Upload files**:
```bash
aws s3 sync dist/ s3://your-bucket-name
```

4. **Setup CloudFront distribution** for HTTPS

---

## 🔒 Security Considerations

### Production Checklist

- [ ] **Use HTTPS** (Let's Encrypt for free SSL)
- [ ] **Environment variables** for sensitive data
- [ ] **Rate limiting** on API endpoints
- [ ] **CORS configuration** (whitelist specific domains)
- [ ] **Authentication** (if exposing to internet)
- [ ] **Input validation** on serial data
- [ ] **Error logging** (Winston, Sentry)
- [ ] **Uptime monitoring** (UptimeRobot, Pingdom)

### Backend CORS Configuration

```javascript
const cors = require('cors');

// Development
app.use(cors());

// Production
app.use(cors({
  origin: ['https://your-frontend-domain.com'],
  optionsSuccessStatus: 200
}));
```

### Environment Variables

Create `backend/.env`:
```bash
NODE_ENV=production
PORT=3000
SERIAL_PORT=/dev/ttyUSB0
ALLOWED_ORIGINS=https://your-frontend.com
```

Load in `app.js`:
```javascript
require('dotenv').config();
const PORT = process.env.PORT || 3000;
```

---

## 📊 Database Integration

### Moving from In-Memory to Persistent Storage

#### Option 1: MongoDB

**Install**:
```bash
npm install mongodb
```

**Update backend**:
```javascript
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGODB_URI);

async function saveMachineData(machine) {
  await client.db('iot').collection('machines').updateOne(
    { id: machine.id },
    { $set: machine },
    { upsert: true }
  );
}

async function saveEvent(event) {
  await client.db('iot').collection('events').insertOne(event);
}
```

#### Option 2: InfluxDB (Time-Series Data)

Perfect for sensor data:
```bash
npm install @influxdata/influxdb-client
```

```javascript
const { InfluxDB } = require('@influxdata/influxdb-client');
const influx = new InfluxDB({ url: process.env.INFLUX_URL, token: process.env.INFLUX_TOKEN });

function writeSensorData(machine) {
  const point = new Point('machine_status')
    .tag('machine_id', machine.id)
    .floatField('temperature', machine.temperature)
    .intField('vibration', machine.vibration)
    .floatField('health_score', machine.healthScore);
  
  writeApi.writePoint(point);
}
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Industrial IoT

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to EC2
        uses: easingthemes/ssh-deploy@main
        with:
          SSH_PRIVATE_KEY: ${{ secrets.EC2_SSH_KEY }}
          REMOTE_HOST: ${{ secrets.EC2_HOST }}
          REMOTE_USER: ubuntu
          SOURCE: "backend/"
          TARGET: "/home/ubuntu/backend"
          
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build
        run: |
          cd frontend
          npm install
          npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 🧪 Testing Checklist

Before deploying:

- [ ] Backend health check endpoint responds
- [ ] Frontend can fetch from backend API
- [ ] Serial fallback works (if Arduino disconnected)
- [ ] CORS is properly configured
- [ ] Error handling works (simulate failures)
- [ ] Frontend handles API timeout gracefully
- [ ] Mobile responsiveness tested
- [ ] Performance: page load < 3s
- [ ] Gauges animate correctly
- [ ] Real-time updates work (2s polling)

---

## 📈 Monitoring & Logging

### Backend Logging

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Usage
logger.info('Machine health updated', { machineId: 'MACHINE-A', health: 95 });
logger.error('Serial port error', { error: err.message });
```

### Uptime Monitoring

Sign up for:
- **UptimeRobot** (free): https://uptimerobot.com
- **Pingdom** (paid): https://www.pingdom.com

Monitor:
- Backend API endpoint: `/api/fleet`
- Frontend URL
- Alert on downtime > 5 minutes

---

## 🌍 Multi-Site Deployment

For factories in multiple locations:

```
Factory A (Location 1)
├── Arduino + RPi → Local Backend (192.168.1.x)
└── Posts data to Cloud Backend

Factory B (Location 2)
├── Arduino + RPi → Local Backend (192.168.2.x)
└── Posts data to Cloud Backend

Cloud Backend (AWS/Azure)
├── Aggregates data from all sites
└── Serves unified dashboard
```

**Update backend to post to cloud**:
```javascript
async function syncToCloud(machineData) {
  try {
    await fetch('https://cloud-backend.com/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId: 'FACTORY-A', data: machineData })
    });
  } catch (error) {
    logger.error('Cloud sync failed', error);
  }
}
```

---

## 🎯 Production Architecture Example

```
┌─────────────────────────────────────────────────────────────┐
│                        USERS                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   CDN (CloudFront)   │
              │   Frontend (React)   │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Load Balancer (ALB) │
              └──────────┬───────────┘
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
┌───────────────┐                 ┌───────────────┐
│   Backend EC2 │                 │   Backend EC2 │
│   Instance 1  │                 │   Instance 2  │
└───────┬───────┘                 └───────┬───────┘
        │                                 │
        └────────────┬────────────────────┘
                     ▼
            ┌────────────────┐
            │  MongoDB Atlas │
            │  (or InfluxDB) │
            └────────────────┘

Factory Floor (On-Premise)
┌──────────────────────────┐
│  Arduino + Raspberry Pi  │
│  Local data collection   │
│  Syncs to Cloud Backend  │
└──────────────────────────┘
```

---

## 📝 Deployment Costs Estimate

### Minimal (Prototype)
- **Raspberry Pi**: $35 one-time
- **Arduino**: $25 one-time
- **Hosting**: Free (localhost)
- **Total**: ~$60

### Small Scale (Single Factory)
- **Hardware**: $60 one-time
- **AWS EC2 t2.micro**: Free (1 year) then ~$10/month
- **Vercel hosting**: Free
- **Total**: ~$10/month after year 1

### Production (Multi-Site)
- **Hardware per site**: $60 × sites
- **AWS EC2 t3.medium**: ~$30/month
- **Load balancer**: ~$20/month
- **MongoDB Atlas M10**: ~$50/month
- **CloudFront CDN**: ~$10/month
- **Total**: ~$110/month + hardware

---

## 🚀 Quick Deploy Commands

### Development
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

### Production (Local Network)
```bash
# Backend
cd backend && pm2 start app.js

# Frontend
cd frontend && npm run build && serve -s dist
```

### Production (Cloud)
```bash
# Backend to Heroku
heroku create && git push heroku main

# Frontend to Vercel
vercel --prod
```

---

**Now your Industrial IoT system is production-ready! 🏭**
