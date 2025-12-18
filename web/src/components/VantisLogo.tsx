import React from 'react';
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
      iconSize: 40,
      fontSize: 14,
      spacing: spacing.xs,
    },
    medium: {
      iconSize: 60,
      fontSize: 20,
      spacing: spacing.sm,
    },
    large: {
      iconSize: 96,
      fontSize: 32,
      spacing: spacing.md,
    },
  };

  const config = sizeConfig[size];
  const uniqueId = `vantis-logo-${size}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="vantis-logo-container" style={style}>
      {/* Symbol: V in rounded square */}
      <div className="vantis-logo-symbol" style={{ width: config.iconSize, height: config.iconSize }}>
        <svg
          width={config.iconSize}
          height={config.iconSize}
          viewBox="0 0 120 120"
          className="vantis-logo-svg"
        >
          <defs>
            {/* Metallic gold gradient */}
            <linearGradient id={`goldGradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
              <stop offset="30%" stopColor="#FFE44D" stopOpacity="1" />
              <stop offset="50%" stopColor="#FFD700" stopOpacity="1" />
              <stop offset="70%" stopColor="#D4AF37" stopOpacity="1" />
              <stop offset="100%" stopColor="#B8860B" stopOpacity="1" />
            </linearGradient>
            
            {/* 3D shadow effect */}
            <filter id={`shadow3D-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="2" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.4"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Rounded square outline */}
          <rect
            x="10"
            y="10"
            width="100"
            height="100"
            rx="20"
            ry="20"
            fill="none"
            stroke={`url(#goldGradient-${uniqueId})`}
            strokeWidth="5"
            filter={`url(#shadow3D-${uniqueId})`}
          />
          
          {/* Letter V - clean sans-serif style, slightly thinner than square */}
          <path
            d="M 30 30 L 30 75 L 50 95 L 60 95 L 90 30 L 80 30 L 55 75 L 45 75 L 25 30 Z"
            fill={`url(#goldGradient-${uniqueId})`}
            filter={`url(#shadow3D-${uniqueId})`}
          />
        </svg>
      </div>
      
      {/* Text: VANTS */}
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

