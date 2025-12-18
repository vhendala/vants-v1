import React, { useMemo } from 'react';
import { spacing } from '../theme/colors';
import './VantisLogo.css';

interface VantisLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'light' | 'dark';
  showText?: boolean;
  style?: React.CSSProperties;
}

export const VantisLogo: React.FC<VantisLogoProps> = ({
  size = 'medium',
  variant = 'light',
  showText = true,
  style,
}) => {
  const sizeConfig = {
    small: {
      iconSize: 56,
      fontSize: 18,
      spacing: 12,
    },
    medium: {
      iconSize: 96,
      fontSize: 28,
      spacing: 20,
    },
    large: {
      iconSize: 140,
      fontSize: 42,
      spacing: 28,
    },
  };

  const config = sizeConfig[size];
  const uniqueId = useMemo(() => `vants-${size}-${Math.random().toString(36).substr(2, 9)}`, [size]);

  return (
    <div className="vantis-logo-container" style={style}>
      {/* Symbol: V in rounded square - exactly as in the image */}
      <div className="vantis-logo-symbol" style={{ width: config.iconSize, height: config.iconSize }}>
        <svg
          width={config.iconSize}
          height={config.iconSize}
          viewBox="0 0 200 200"
          className="vantis-logo-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Metallic gold gradient with 3D shine effect */}
            <linearGradient id={`gold-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DFB433" />
              <stop offset="20%" stopColor="#E8C55A" />
              <stop offset="40%" stopColor="#DFB433" />
              <stop offset="60%" stopColor="#C9A02A" />
              <stop offset="80%" stopColor="#B8860B" />
              <stop offset="100%" stopColor="#C9A02A" />
            </linearGradient>
            
            {/* 3D shadow for depth */}
            <filter id={`shadow3d-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="5"/>
              <feOffset dx="4" dy="4" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.35"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Rounded square outline - thicker stroke */}
          <rect
            x="15"
            y="15"
            width="170"
            height="170"
            rx="35"
            ry="35"
            fill="none"
            stroke={`url(#gold-${uniqueId})`}
            strokeWidth="14"
            filter={`url(#shadow3d-${uniqueId})`}
          />
          
          {/* Letter V - clean sans-serif, slightly thinner lines than square */}
          <path
            d="M 45 45 L 45 125 L 80 155 L 100 155 L 155 45 L 140 45 L 100 125 L 85 125 L 35 45 Z"
            fill={`url(#gold-${uniqueId})`}
            filter={`url(#shadow3d-${uniqueId})`}
          />
        </svg>
      </div>
      
      {/* Text: VANTS - bold sans-serif, metallic gold */}
      {showText && (
        <div
          className="vantis-logo-text"
          style={{
            fontSize: config.fontSize,
            marginTop: config.spacing,
          }}>
          VANTS
        </div>
      )}
    </div>
  );
};

