/**
 * Alerts Panel Component - Material UI Version
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

const AlertsPanel = ({ alerts = [] }) => {
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'error';
      case 'medium':
      case 'warning':
        return 'warning';
      case 'low':
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'critical':
        return <ErrorIcon />;
      case 'medium':
      case 'warning':
        return <WarningIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Just now';
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card elevation={0} sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Active Alerts
          </Typography>
          {alerts.length > 0 && (
            <Chip 
              label={alerts.length} 
              color="error" 
              size="small"
              sx={{ fontWeight: 700 }}
            />
          )}
        </Box>

        {/* Alerts List */}
        {alerts.length === 0 ? (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              py: 4,
              color: 'text.secondary',
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="body2" fontWeight={500}>
              ALL SYSTEMS NORMAL
            </Typography>
            <Typography variant="caption" color="text.secondary">
              No active alerts
            </Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {alerts.map((alert, index) => (
              <ListItem key={index} disablePadding>
                <Alert
                  severity={getSeverityColor(alert.severity)}
                  icon={getSeverityIcon(alert.severity)}
                  sx={{ 
                    width: '100%', 
                    borderRadius: 2,
                    '& .MuiAlert-message': { width: '100%' },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {alert.machine || 'Unknown Machine'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {alert.message || 'Alert triggered'}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', ml: 2 }}>
                      {formatTimestamp(alert.timestamp)}
                    </Typography>
                  </Box>
                </Alert>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertsPanel;
