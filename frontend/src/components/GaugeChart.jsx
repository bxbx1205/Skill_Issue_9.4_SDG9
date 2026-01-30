/**
 * Custom Gauge Chart Component
 * Displays circular gauge meters for temperature, health score, and failure risk
 */

import React from 'react';

const GaugeChart = ({ 
  value = 0, 
  min = 0, 
  max = 100, 
  label = '', 
  unit = '%',
  size = 120,
  colorRanges = [
    { min: 0, max: 30, color: '#2e7d32' },    // Industrial Green
    { min: 30, max: 50, color: '#2e7d32' },   // Industrial Green
    { min: 50, max: 70, color: '#f57c00' },   // Industrial Orange
    { min: 70, max: 85, color: '#c62828' },   // Industrial Red
    { min: 85, max: 100, color: '#c62828' }   // Industrial Red
  ],
  reverseColors = false
}) => {
  // Normalize value to percentage
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  
  // Get color based on value
  const getColor = () => {
    const checkValue = reverseColors ? (100 - percentage) : percentage;
    for (const range of colorRanges) {
      if (checkValue >= range.min && checkValue < range.max) {
        return range.color;
      }
    }
    return colorRanges[colorRanges.length - 1].color;
  };
  
  const color = getColor();
  const radius = size / 2 - 12;
  const strokeWidth = 8;
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Calculate circumference and stroke offset for circle
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="gauge-container" style={{ width: size, textAlign: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
        {/* Background circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
        />
        
        {/* Value circle */}
        {percentage > 0 && (
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${centerX} ${centerY})`}
            style={{
              transition: 'all 0.3s ease'
            }}
          />
        )}
        
        {/* Center value display */}
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.18}
          fontWeight="600"
          fill="#333333"
        >
          {typeof value === 'number' ? value.toFixed(1) : value}
        </text>
      </svg>
      
      {/* Label below the circle */}
      <div style={{
        fontSize: 11,
        color: '#666666',
        marginTop: 4,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {label}
      </div>
    </div>
  );
};

export default GaugeChart;
