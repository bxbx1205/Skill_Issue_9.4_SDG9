/**
 * Predictive Maintenance Dashboard
 * PS 9.4 - SDG 9: Industry Innovation
 * 
 * Material UI Version - Modern, Clean Interface
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  IconButton,
} from '@mui/material';
import {
  Factory as FactoryIcon,
  Refresh as RefreshIcon,
  Sensors as SensorsIcon,
  Computer as ComputerIcon,
} from '@mui/icons-material';
import theme from './theme';
import MachineCard from './components/MachineCard';
import AlertsPanel from './components/AlertsPanel';
import RiskRanking from './components/RiskRanking';
import EventLogs from './components/EventLogs';
import FleetStats from './components/FleetStats';
import FactoryScene from './components/FactoryScene';
import DataRecorder from './components/DataRecorder';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const REFRESH_INTERVAL = parseInt(import.meta.env.VITE_REFRESH_INTERVAL) || 3000;

function App() {
  const [fleetData, setFleetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const intervalRef = useRef(null);
  const backoffRef = useRef(REFRESH_INTERVAL);

  const fetchFleetData = useCallback(async () => {
    if (rateLimited) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/fleet`);
      
      if (response.status === 429) {
        const data = await response.json();
        setRateLimited(true);
        setError(`Rate limited. Retrying in ${data.retryAfter || 30} seconds...`);
        const retryAfter = (data.retryAfter || 30) * 1000;
        backoffRef.current = Math.min(retryAfter, 60000);
        setTimeout(() => {
          setRateLimited(false);
          setError(null);
          backoffRef.current = REFRESH_INTERVAL;
        }, retryAfter);
        return;
      }
      
      if (!response.ok) throw new Error('Failed to fetch fleet data');
      
      const data = await response.json();
      setFleetData(data);
      setLastUpdate(new Date());
      setError(null);
      setRateLimited(false);
      backoffRef.current = REFRESH_INTERVAL;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching fleet data:', err);
    } finally {
      setLoading(false);
    }
  }, [rateLimited]);

  useEffect(() => {
    fetchFleetData();
    intervalRef.current = setInterval(fetchFleetData, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchFleetData]);

  const topRiskMachineId = fleetData?.topRiskMachine?.name 
    ? fleetData.machines.find(m => m.name === fleetData.topRiskMachine.name)?.id 
    : null;

  // Loading State
  if (loading && !fleetData) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            gap: 3,
          }}
        >
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h5" fontWeight={600}>
            PREDICTIVE MAINTENANCE SYSTEM
          </Typography>
          <Typography color="text.secondary">
            Connecting to sensors...
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  // Error State
  if (error && !fleetData) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            gap: 3,
            p: 3,
          }}
        >
          <Typography variant="h1" sx={{ fontSize: '4rem', color: 'error.main' }}>!</Typography>
          <Typography variant="h5" fontWeight={600}>CONNECTION ERROR</Typography>
          <Alert severity="error" sx={{ maxWidth: 500 }}>{error}</Alert>
          <Typography color="text.secondary" textAlign="center">
            Make sure the backend server is running at {API_BASE_URL}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={fetchFleetData}
            size="large"
          >
            Retry Connection
          </Button>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        {/* Header AppBar */}
        <AppBar position="sticky" elevation={1}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FactoryIcon sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  PREDICTIVE MAINTENANCE SYSTEM
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Industrial IoT Monitoring Platform
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                icon={fleetData?.simulationMode ? <ComputerIcon /> : <SensorsIcon />}
                label={fleetData?.simulationMode ? 'SIMULATION' : 'LIVE'}
                color={fleetData?.simulationMode ? 'default' : 'success'}
                variant="filled"
                size="small"
                sx={{ bgcolor: fleetData?.simulationMode ? 'rgba(255,255,255,0.2)' : undefined, color: fleetData?.simulationMode ? 'white' : undefined }}
              />
              {isRecording && (
                <Chip
                  label="● REC"
                  size="small"
                  sx={{ 
                    bgcolor: 'error.main', 
                    color: 'white',
                    fontWeight: 700,
                    animation: 'pulse 1s infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.6 },
                    },
                  }}
                />
              )}
              {lastUpdate && (
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Updated: {lastUpdate.toLocaleTimeString()}
                </Typography>
              )}
              <IconButton onClick={fetchFleetData} sx={{ color: 'white' }}>
                <RefreshIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {/* Data Recorder */}
          <Box sx={{ mb: 3 }}>
            <DataRecorder 
              fleetData={fleetData}
              isRecording={isRecording}
              onRecordingChange={setIsRecording}
            />
          </Box>

          {/* Fleet Statistics */}
          {fleetData?.fleetStats && (
            <Box sx={{ mb: 3 }}>
              <FleetStats 
                stats={fleetData.fleetStats}
                simulationMode={fleetData.simulationMode}
                serialConnected={fleetData.serialConnected}
              />
            </Box>
          )}

          {/* Machine Cards Grid */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                Fleet Monitoring
              </Typography>
              <Chip 
                label={`${fleetData?.machines?.length || 0} Machines`}
                color="primary"
                variant="outlined"
              />
            </Box>
            <Grid container spacing={2}>
              {fleetData?.machines?.map((machine) => (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={machine.id}>
                  <MachineCard 
                    machine={machine}
                    isTopRisk={machine.id === topRiskMachineId}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* 3D Factory Scene */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
              3D Factory View
            </Typography>
            <Paper 
              elevation={0}
              sx={{ 
                height: 400, 
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <FactoryScene 
                machines={fleetData?.machines || []}
                onMachineSelect={(machine) => console.log('Selected:', machine)}
              />
            </Paper>
          </Box>

          {/* Bottom Row - Alerts and Ranking */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <AlertsPanel alerts={fleetData?.alerts || []} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <RiskRanking 
                rankedMachines={fleetData?.rankedMachines || []}
                topRiskMachine={fleetData?.topRiskMachine}
              />
            </Grid>
          </Grid>

          {/* Event Logs */}
          <EventLogs logs={fleetData?.logs || []} />
        </Container>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 2,
            px: 3,
            mt: 'auto',
            bgcolor: '#37474f',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            INDUSTRIAL IoT MONITORING PLATFORM | INDUSTRY 4.0 | SDG 9: INDUSTRY, INNOVATION AND INFRASTRUCTURE
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
