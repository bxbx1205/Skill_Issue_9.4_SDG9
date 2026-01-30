/**
 * Fleet Statistics Component - Material UI Version
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  Paper,
} from '@mui/material';
import {
  Factory as FactoryIcon,
  Favorite as HealthIcon,
  Warning as RiskIcon,
  CheckCircle as HealthyIcon,
  Error as CriticalIcon,
  Info as WarningIcon,
  Sensors as SensorsIcon,
} from '@mui/icons-material';

const FleetStats = ({ stats, simulationMode, serialConnected }) => {
  const statCards = [
    {
      label: 'TOTAL MACHINES',
      value: stats.totalMachines,
      icon: <FactoryIcon sx={{ fontSize: 32 }} />,
      color: '#1565c0',
      bgColor: 'rgba(21, 101, 192, 0.1)',
    },
    {
      label: 'AVG HEALTH SCORE',
      value: `${stats.avgHealthScore.toFixed(1)}%`,
      icon: <HealthIcon sx={{ fontSize: 32 }} />,
      color: stats.avgHealthScore >= 70 ? '#2e7d32' : stats.avgHealthScore >= 50 ? '#f57c00' : '#c62828',
      bgColor: stats.avgHealthScore >= 70 ? 'rgba(46, 125, 50, 0.1)' : stats.avgHealthScore >= 50 ? 'rgba(245, 124, 0, 0.1)' : 'rgba(198, 40, 40, 0.1)',
    },
    {
      label: 'AVG FAILURE RISK',
      value: `${stats.avgFailureRisk.toFixed(1)}%`,
      icon: <RiskIcon sx={{ fontSize: 32 }} />,
      color: stats.avgFailureRisk < 30 ? '#2e7d32' : stats.avgFailureRisk < 50 ? '#f57c00' : '#c62828',
      bgColor: stats.avgFailureRisk < 30 ? 'rgba(46, 125, 50, 0.1)' : stats.avgFailureRisk < 50 ? 'rgba(245, 124, 0, 0.1)' : 'rgba(198, 40, 40, 0.1)',
    },
  ];

  const statusCounts = [
    { label: 'CRITICAL', value: stats.criticalCount, color: '#c62828', icon: <CriticalIcon /> },
    { label: 'WARNING', value: stats.warningCount, color: '#f57c00', icon: <WarningIcon /> },
    { label: 'HEALTHY', value: stats.healthyCount, color: '#2e7d32', icon: <HealthyIcon /> },
  ];

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Fleet Overview
          </Typography>
          <Chip
            icon={<SensorsIcon />}
            label={serialConnected ? 'Live Sensor' : 'Simulation Mode'}
            color={serialConnected ? 'success' : 'info'}
            size="small"
            variant="filled"
          />
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {statCards.map((stat, index) => (
            <Grid size={{ xs: 12, md: 4 }} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  bgcolor: stat.bgColor,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: stat.color,
                  },
                }}
              >
                <Box sx={{ color: stat.color }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ color: stat.color }}>
                    {stat.value}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Status Counts */}
        <Grid container spacing={2}>
          {statusCounts.map((item, idx) => (
            <Grid size={4} key={idx}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  bgcolor: 'background.default',
                  borderRadius: 2,
                  borderTop: `4px solid ${item.color}`,
                }}
              >
                <Typography variant="h4" fontWeight={800} color="text.primary">
                  {item.value}
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ color: item.color }}>
                  {item.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default FleetStats;
