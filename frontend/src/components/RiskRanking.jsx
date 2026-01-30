/**
 * Risk Ranking Component
 * Shows machines ranked by failure risk percentage
 */

import React from 'react';

const RiskRanking = ({ rankedMachines, topRiskMachine }) => {
  const getRiskColor = (risk) => {
    if (risk >= 70) return '#ef4444';
    if (risk >= 50) return '#f97316';
    if (risk >= 30) return '#eab308';
    return '#22c55e';
  };

  const getMedalEmoji = (index) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}.`;
    }
  };

  return (
    <div className="risk-ranking" style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      borderRadius: 16,
      padding: 20,
      border: '1px solid #334155',
      height: '100%'
    }}>
      <h3 style={{ 
        margin: '0 0 16px', 
        color: '#f8fafc', 
        fontSize: 16, 
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        🏆 Risk Ranking
      </h3>

      {/* Top Risk Highlight */}
      {topRiskMachine && (
        <div style={{
          background: topRiskMachine.failureRisk >= 70 
            ? 'linear-gradient(135deg, #450a0a, #7f1d1d)'
            : 'linear-gradient(135deg, #1e3a5f, #1e293b)',
          border: `2px solid ${getRiskColor(topRiskMachine.failureRisk)}`,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
            Top Machine at Risk
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10
          }}>
            <span style={{ fontSize: 28 }}>{topRiskMachine.icon}</span>
            <div>
              <div style={{ 
                fontSize: 20, 
                fontWeight: 700, 
                color: '#f8fafc' 
              }}>
                {topRiskMachine.name}
              </div>
              <div style={{ 
                fontSize: 28, 
                fontWeight: 800, 
                color: getRiskColor(topRiskMachine.failureRisk),
                textShadow: `0 0 20px ${getRiskColor(topRiskMachine.failureRisk)}80`
              }}>
                {topRiskMachine.failureRisk.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ranking List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rankedMachines.map((machine, index) => (
          <div
            key={machine.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: index === 0 ? 'rgba(239, 68, 68, 0.1)' : '#0f172a',
              borderRadius: 10,
              border: index === 0 
                ? '1px solid rgba(239, 68, 68, 0.3)'
                : '1px solid transparent'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <span style={{ fontSize: 18, width: 28 }}>{getMedalEmoji(index)}</span>
              <span style={{ fontSize: 18 }}>{machine.icon}</span>
              <div>
                <div style={{ 
                  color: '#f8fafc', 
                  fontWeight: 500,
                  fontSize: 14
                }}>
                  {machine.name}
                </div>
                <div style={{ 
                  fontSize: 11, 
                  color: '#64748b' 
                }}>
                  {machine.type}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: 18,
                fontWeight: 700,
                color: getRiskColor(machine.failureRisk)
              }}>
                {machine.failureRisk.toFixed(1)}%
              </div>
              <div style={{
                fontSize: 10,
                color: '#64748b',
                textTransform: 'uppercase'
              }}>
                Risk
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RiskRanking;
