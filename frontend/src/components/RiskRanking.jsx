/**
 * Risk Ranking Component
 * Shows machines ranked by failure risk percentage
 */

import React from 'react';

const RiskRanking = ({ rankedMachines, topRiskMachine }) => {
  const getRiskColor = (risk) => {
    if (risk >= 70) return 'var(--color-danger)';
    if (risk >= 50) return 'var(--color-warning)';
    if (risk >= 30) return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  return (
    <div className="card risk-ranking-card">
      <div className="card-header">
        <h3 className="card-title">
          <span className="icon">🏆</span> Risk Ranking
        </h3>
      </div>

      {/* Top Risk Highlight */}
      {topRiskMachine && (
        <div className="top-risk-banner">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Highest Risk Asset
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16
          }}>
            <span style={{ fontSize: 48, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>{topRiskMachine.icon}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ 
                fontSize: '1.25rem', 
                fontWeight: 700, 
                color: 'var(--text-primary)' 
              }}>
                {topRiskMachine.name}
              </div>
              <div className="risk-score-large">
                {topRiskMachine.failureRisk.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ranking List */}
      <div className="ranking-list">
        {rankedMachines.map((machine, index) => (
          <div key={machine.id} className="ranking-item">
            <span className="rank-index">
              {index + 1}.
            </span>
            <span style={{ fontWeight: 500, color: 'var(--text-secondary)', minWidth: 100 }}>{machine.name}</span>
            
            <div className="risk-bar-container">
              <div className="risk-bar-fill" style={{
                width: `${machine.failureRisk}%`,
                background: getRiskColor(machine.failureRisk)
              }}></div>
            </div>
            
            <span style={{ 
              width: 50, 
              textAlign: 'right', 
              fontSize: '0.85rem',
              fontWeight: 600,
              color: getRiskColor(machine.failureRisk),
              fontFamily: 'var(--font-mono)'
            }}>
              {machine.failureRisk.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RiskRanking;
