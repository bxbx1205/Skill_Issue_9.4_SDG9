import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import './Gauge.css';

function Gauge({ value, max, label, unit, color, inverted = false }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  // Animate value from 0 to target
  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);
    return () => clearTimeout(timeout);
  }, [value]);
  
  // Calculate percentage and rotation
  const percentage = (animatedValue / max) * 100;
  const rotation = (percentage / 100) * 180 - 90; // -90 to 90 degrees
  
  // Color selection
  const colorMap = {
    green: 'var(--green-500)',
    amber: 'var(--amber-400)',
    red: 'var(--red-500)',
    cyan: 'var(--cyan-500)'
  };
  
  // For inverted gauges (risk %), higher is worse
  let gaugeColor = colorMap[color] || colorMap.green;
  if (inverted) {
    if (percentage > 70) gaugeColor = colorMap.red;
    else if (percentage > 40) gaugeColor = colorMap.amber;
    else gaugeColor = colorMap.green;
  }
  
  return (
    <div className="gauge-container">
      <div className="gauge-label">{label}</div>
      
      <div className="gauge">
        {/* Background arc */}
        <svg className="gauge-svg" viewBox="0 0 200 120">
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="var(--steel-100)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          
          {/* Value arc with animation */}
          <motion.path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={gaugeColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="251.2"
            initial={{ strokeDashoffset: 251.2 }}
            animate={{ 
              strokeDashoffset: 251.2 - (percentage / 100) * 251.2 
            }}
            transition={{ 
              duration: 1.5, 
              ease: [0.25, 0.1, 0.25, 1]
            }}
            style={{
              filter: 'drop-shadow(0 0 8px currentColor)',
              opacity: 0.9
            }}
          />
          
          {/* Center dot */}
          <circle cx="100" cy="100" r="4" fill={gaugeColor} />
          
          {/* Needle */}
          <motion.line
            x1="100"
            y1="100"
            x2="100"
            y2="35"
            stroke={gaugeColor}
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ rotate: -90 }}
            animate={{ rotate: rotation }}
            transition={{ 
              duration: 1.5, 
              ease: [0.25, 0.1, 0.25, 1]
            }}
            style={{ 
              transformOrigin: '100px 100px',
              filter: 'drop-shadow(0 0 4px currentColor)'
            }}
          />
        </svg>
        
        {/* Value display */}
        <div className="gauge-value">
          <motion.span 
            className="value-number numeric"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {Math.round(animatedValue)}
          </motion.span>
          <span className="value-unit">{unit}</span>
        </div>
      </div>
      
      {/* Threshold markers */}
      <div className="gauge-markers">
        <span className="marker marker-low">0</span>
        <span className="marker marker-mid">{max / 2}</span>
        <span className="marker marker-high">{max}</span>
      </div>
    </div>
  );
}

export default Gauge;
