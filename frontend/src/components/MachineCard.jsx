/**
 * Machine Card Component - Industrial Design
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  Button,
  Alert,
  Divider,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as HealthyIcon,
  Error as CriticalIcon,
} from '@mui/icons-material';
import GaugeChart from './GaugeChart';

const MachineCard = ({ 
  machine, 
  isTopRisk = false,
  isShutdown = false,
  isValveClosed = false,
  isStopped = false,
  onShutdown = () => {},
  onValveClose = () => {},
  onMaintenance = () => {}
}) => {
  const getStatusConfig = (status) => {
    switch(status) {
      case 'Critical': return { color: 'error', icon: <CriticalIcon fontSize="small" />, label: 'CRITICAL' };
      case 'Warning': return { color: 'warning', icon: <WarningIcon fontSize="small" />, label: 'WARNING' };
      case 'Caution': return { color: 'warning', icon: <WarningIcon fontSize="small" />, label: 'CAUTION' };
      default: return { color: 'success', icon: <HealthyIcon fontSize="small" />, label: 'HEALTHY' };
    }
  };

  const isGasSensor = machine.sensorType === 'GAS';
  const hasGasLeak = isGasSensor && machine.gasLevel > 300;
  const isCriticalLeak = isGasSensor && machine.gasLevel > 500;
  const isCritical = machine.failureRisk >= 70 || machine.status === 'Critical';
  const isWarning = machine.failureRisk >= 50 || machine.status === 'Warning';
  
  const statusConfig = getStatusConfig(machine.status);

  const getSensorValueDisplay = () => {
    if (machine.sensorValue === undefined) return 'N/A';
    switch(machine.sensorType) {
      case 'TEMP': return `${machine.sensorValue?.toFixed(1)}C`;
      case 'HUM': return `${machine.sensorValue?.toFixed(1)}%`;
      case 'GAS': return `${machine.sensorValue?.toFixed(0)} ppm`;
      case 'VIB': return machine.sensorValue?.toFixed(2);
      default: return machine.sensorValue?.toFixed(2);
    }
  };

  const getSensorColor = () => {
    switch(machine.sensorType) {
      case 'TEMP': return '#c62828';
      case 'HUM': return '#0277bd';
      case 'GAS': return '#f57c00';
      case 'VIB': return '#2e7d32';
      default: return '#1565c0';
    }
  };

  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: isTopRisk ? 'error.main' : 'divider',
        borderLeft: isTopRisk ? '4px solid' : '1px solid',
        borderLeftColor: isTopRisk ? 'error.main' : 'divider',
        position: 'relative',
      }}
    >
      {/* Top Risk Badge */}
      {isTopRisk && (
        <Chip
          label="HIGH RISK"
          color="error"
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontWeight: 600,
            zIndex: 10,
            height: 20,
          }}
        />
      )}

      <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header Row */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
          {/* Name and Type */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="subtitle2" 
              fontWeight={700}
              sx={{ 
                lineHeight: 1.2,
                mb: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {machine.name}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {machine.type}
            </Typography>
          </Box>
        </Box>

        {/* Sensor Reading */}
        <Box
          sx={{
            p: 1.5,
            mb: 2,
            bgcolor: `${getSensorColor()}08`,
            border: '1px solid',
            borderColor: `${getSensorColor()}25`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            SENSOR VALUE
          </Typography>
          <Typography 
            variant="body1" 
            fontWeight={700}
            sx={{ 
              color: isCritical ? 'error.main' : isWarning ? 'warning.main' : 'success.main',
              fontFamily: 'monospace',
            }}
          >
            {getSensorValueDisplay()}
          </Typography>
        </Box>

        {/* Status */}
        <Box sx={{ mb: 2 }}>
          <Chip
            icon={statusConfig.icon}
            label={statusConfig.label}
            color={statusConfig.color}
            variant="filled"
            size="small"
            sx={{ fontWeight: 600, height: 24 }}
          />
        </Box>

        {/* Alert Banners */}
        {isCritical && !isGasSensor && !isShutdown && (
          <Alert 
            severity="error" 
            sx={{ mb: 1.5, py: 0 }}
            action={
              <Button color="inherit" size="small" onClick={onShutdown}>
                SHUTDOWN
              </Button>
            }
          >
            SENSOR CRITICAL
          </Alert>
        )}

        {hasGasLeak && !isValveClosed && (
          <Alert 
            severity={isCriticalLeak ? 'error' : 'warning'}
            sx={{ mb: 1.5, py: 0 }}
            action={
              <Button color="inherit" size="small" onClick={onValveClose}>
                CLOSE VALVE
              </Button>
            }
          >
            {isCriticalLeak ? 'CRITICAL GAS LEAK' : 'GAS LEAK DETECTED'}
          </Alert>
        )}

        {isValveClosed && isGasSensor && (
          <Alert severity="info" sx={{ mb: 1.5, py: 0 }}>
            VALVE CLOSED
          </Alert>
        )}

        {/* Gauges */}
        <Box sx={{ flex: 1, py: 2 }}>
          <Grid container spacing={2} justifyContent="center" alignItems="center">
            <Grid size={4}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <GaugeChart
                  value={machine.temperature}
                  min={0}
                  max={100}
                  label="TEMP"
                  unit="C"
                  size={70}
                />
              </Box>
            </Grid>
            <Grid size={4}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <GaugeChart
                  value={machine.healthScore}
                  min={0}
                  max={100}
                  label="HEALTH"
                  unit="%"
                  size={70}
                  reverseColors={true}
                />
              </Box>
            </Grid>
            <Grid size={4}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <GaugeChart
                  value={machine.failureRisk}
                  min={0}
                  max={100}
                  label="RISK"
                  unit="%"
                  size={70}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Bottom Stats */}
        <Grid container spacing={2}>
          <Grid size={6}>
            <Box sx={{ textAlign: 'center', py: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                VIBRATION
              </Typography>
              <Typography 
                variant="body2" 
                fontWeight={700}
                color={machine.vibration === 1 ? 'error.main' : 'success.main'}
              >
                {machine.vibration === 1 ? 'ALERT' : 'NORMAL'}
              </Typography>
            </Box>
          </Grid>
          <Grid size={6}>
            <Box sx={{ textAlign: 'center', py: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                UPDATED
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                {new Date(machine.lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Maintenance Button */}
        {isStopped && (
          <Button
            fullWidth
            variant="contained"
            color="success"
            onClick={onMaintenance}
            sx={{ mt: 1.5 }}
          >
            PERFORM MAINTENANCE
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MachineCard;
