import React from 'react';
import './VantsLogo.css';

interface VantsLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
}

export const VantsLogo: React.FC<VantsLogoProps> = ({
  size = 'large',
  showText = true,
  className = '',
}) => {
  const sizeConfig = {
    small: {
      iconSize: 48,
      fontSize: 20,
      gap: 12,
    },
    medium: {
      iconSize: 64,
      fontSize: 28,
      gap: 16,
    },
    large: {
      iconSize: 96,
      fontSize: 40,
      gap: 24,
    },
  };

  const config = sizeConfig[size];

  return (
    <div className={`vants-logo-container ${className}`}>
      {/* Symbol: V in rounded square */}
      <div className="vants-logo-symbol" style={{ width: config.iconSize, height: config.iconSize }}>
        <svg
          width={config.iconSize}
          height={config.iconSize}
          viewBox="0 0 120 120"
          className="vants-logo-svg"
        >
          <defs>
            {/* Gold gradient with metallic effect */}
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
              <stop offset="30%" stopColor="#FFE44D" stopOpacity="1" />
              <stop offset="50%" stopColor="#FFD700" stopOpacity="1" />
              <stop offset="70%" stopColor="#D4AF37" stopOpacity="1" />
              <stop offset="100%" stopColor="#B8860B" stopOpacity="1" />
            </linearGradient>
            
            {/* Shadow filter for 3D effect */}
            <filter id="shadow3D" x="-50%" y="-50%" width="200%" height="200%">
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
            stroke="url(#goldGradient)"
            strokeWidth="6"
            filter="url(#shadow3D)"
          />
          
          {/* Letter V - Clean sans-serif style */}
          <path
            d="M 30 30 L 30 75 L 50 95 L 60 95 L 90 30 L 80 30 L 55 75 L 45 75 L 25 30 Z"
            fill="url(#goldGradient)"
            filter="url(#shadow3D)"
          />
        </svg>
      </div>
      
      {/* Text: VANTS */}
      {showText && (
        <div
          className="vants-logo-text"
          style={{
            fontSize: config.fontSize,
            marginTop: config.gap,
          }}>
          VANTS
        </div>
      )}
    </div>
  );
};

