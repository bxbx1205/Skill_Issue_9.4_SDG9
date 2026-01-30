/**
 * Custom Gauge Chart Component
 * Displays radial gauge meters for temperature, health score, and failure risk
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
    { min: 0, max: 30, color: '#22c55e' },
    { min: 30, max: 50, color: '#84cc16' },
    { min: 50, max: 70, color: '#eab308' },
    { min: 70, max: 85, color: '#f97316' },
    { min: 85, max: 100, color: '#ef4444' }
  ],
  reverseColors = false
}) => {
  // Normalize value to percentage
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  
  // Calculate angle for the gauge (180 degrees arc)
  const angle = (percentage / 100) * 180;
  
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
  const radius = size / 2 - 10;
  const strokeWidth = 12;
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Arc path calculation
  const startAngle = 180;
  const endAngle = startAngle + angle;
  
  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const angleRad = (angleDeg - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad)
    };
  };
  
  const describeArc = (cx, cy, r, startAng, endAng) => {
    const start = polarToCartesian(cx, cy, r, endAng);
    const end = polarToCartesian(cx, cy, r, startAng);
    const largeArcFlag = endAng - startAng <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };
  
  return (
    <div className="gauge-container" style={{ width: size, textAlign: 'center' }}>
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        {/* Background arc */}
        <path
          d={describeArc(centerX, centerY, radius, 180, 360)}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Value arc */}
        {percentage > 0 && (
          <path
            d={describeArc(centerX, centerY, radius, startAngle, endAngle)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${color}80)`,
              transition: 'all 0.3s ease'
            }}
          />
        )}
        
        {/* Center value display */}
        <text
          x={centerX}
          y={centerY - 5}
          textAnchor="middle"
          fontSize={size * 0.18}
          fontWeight="bold"
          fill={color}
          style={{ transition: 'fill 0.3s ease' }}
        >
          {typeof value === 'number' ? value.toFixed(1) : value}
        </text>
        <text
          x={centerX}
          y={centerY + 12}
          textAnchor="middle"
          fontSize={size * 0.1}
          fill="#94a3b8"
        >
          {unit}
        </text>
      </svg>
      
      {/* Label */}
      <div style={{
        fontSize: size * 0.1,
        color: '#94a3b8',
        marginTop: -5,
        fontWeight: 500
      }}>
        {label}
      </div>
    </div>
  );
};

export default GaugeChart;
