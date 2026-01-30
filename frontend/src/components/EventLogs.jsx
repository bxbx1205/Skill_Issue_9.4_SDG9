/**
 * Event Logs Component - Material UI Version
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';

const EventLogs = ({ logs = [] }) => {
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'error';
      case 'medium':
      case 'warning':
        return 'warning';
      case 'low':
        return 'success';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card elevation={0} sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 2 }}>
        {/* Header */}
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
          Event Logs
        </Typography>

        {/* Table */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>
                  Time
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>
                  Machine
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>
                  Event
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>
                  Severity
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    <HistoryIcon sx={{ fontSize: 32, mb: 1, opacity: 0.5 }} />
                    <Typography variant="body2">No events recorded</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, index) => (
                  <TableRow 
                    key={index}
                    sx={{ 
                      '&:hover': { bgcolor: 'grey.50' },
                      '&:last-child td': { border: 0 },
                    }}
                  >
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary' }}>
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {log.machine || 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {log.event || log.message || 'Event logged'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.severity || 'info'}
                        color={getSeverityColor(log.severity)}
                        size="small"
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default EventLogs;
