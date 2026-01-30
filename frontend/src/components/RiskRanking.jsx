/**
 * Risk Ranking Component - Material UI Version
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  List,
  ListItem,
  Paper,
  Avatar,
} from '@mui/material';
import { EmojiEvents as TrophyIcon } from '@mui/icons-material';

const RiskRanking = ({ rankedMachines = [], topRiskMachine = null }) => {
  const getRiskColor = (risk) => {
    if (risk >= 70) return '#ea4335';
    if (risk >= 50) return '#fbbc04';
    if (risk >= 30) return '#fbbc04';
    return '#34a853';
  };

  const getRiskBgColor = (risk) => {
    if (risk >= 70) return 'error';
    if (risk >= 50) return 'warning';
    if (risk >= 30) return 'warning';
    return 'success';
  };

  return (
    <Card elevation={0} sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 2 }}>
        {/* Header */}
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
          Risk Ranking
        </Typography>

        {/* Top Risk Highlight */}
        {topRiskMachine && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              background: 'linear-gradient(135deg, rgba(198, 40, 40, 0.1) 0%, rgba(245, 124, 0, 0.05) 100%)',
              border: '1px solid rgba(198, 40, 40, 0.3)',
              textAlign: 'center',
            }}
          >
            <Typography variant="overline" color="text.secondary" fontWeight={600}>
              HIGHEST RISK ASSET
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 1 }}>
              <Box sx={{ 
                width: 48, 
                height: 48, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'error.main',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.6rem',
              }}>
                {topRiskMachine.icon}
              </Box>
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {topRiskMachine.name}
                </Typography>
                <Typography 
                  variant="h4" 
                  fontWeight={700}
                  sx={{ color: 'error.main' }}
                >
                  {topRiskMachine.failureRisk.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}

        {/* Ranking List */}
        <List disablePadding>
          {rankedMachines.map((machine, index) => (
            <ListItem
              key={machine.id}
              sx={{
                px: 1.5,
                py: 1,
                mb: 0.5,
                bgcolor: 'grey.50',
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              <Typography 
                variant="body2" 
                fontWeight={700}
                sx={{ width: 30, color: 'text.secondary' }}
              >
                {index + 1}.
              </Typography>
              <Typography 
                variant="body2" 
                fontWeight={500}
                sx={{ flex: 1, minWidth: 100 }}
              >
                {machine.name}
              </Typography>
              <Box sx={{ flex: 2, mx: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={machine.failureRisk}
                  color={getRiskBgColor(machine.failureRisk)}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: 'grey.200',
                  }}
                />
              </Box>
              <Typography 
                variant="body2" 
                fontWeight={700}
                sx={{ 
                  width: 50, 
                  textAlign: 'right',
                  color: getRiskColor(machine.failureRisk),
                  fontFamily: 'monospace',
                }}
              >
                {machine.failureRisk.toFixed(0)}%
              </Typography>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default RiskRanking;
