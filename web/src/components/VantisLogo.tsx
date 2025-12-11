import React from 'react';
import { colors, spacing, borderRadius } from '../theme/colors';
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
      iconSize: 24,
      iconContainerSize: 32,
      fontSize: 16,
      spacing: spacing.xs,
    },
    medium: {
      iconSize: 32,
      iconContainerSize: 44,
      fontSize: 20,
      spacing: spacing.sm,
    },
    large: {
      iconSize: 48,
      iconContainerSize: 64,
      fontSize: 28,
      spacing: spacing.md,
    },
  };

  const config = sizeConfig[size];
  const goldColor = colors.accentTeal;
  const logoColor = variant === 'light' ? goldColor : '#FFFFFF';

  const containerSize = config.iconContainerSize;
  const padding = containerSize * 0.15;
  const vSize = containerSize - (padding * 2);
  const centerX = containerSize / 2;
  const centerY = containerSize / 2;

  return (
    <div className="vantis-logo-container" style={style}>
      <div
        className="vantis-logo-icon-container"
        style={{
          width: containerSize,
          height: containerSize,
          borderRadius: borderRadius.small,
          border: `2.5px solid ${logoColor}`,
          backgroundColor: 'transparent',
          boxShadow: `0 2px 4px rgba(0, 0, 0, 0.3)`,
        }}>
        <svg
          width={containerSize}
          height={containerSize}
          viewBox={`0 0 ${containerSize} ${containerSize}`}
          className="vantis-logo-svg">
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
              <stop offset="50%" stopColor={goldColor} stopOpacity="1" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path
            d={`M ${centerX - vSize * 0.35} ${centerY - vSize * 0.4} L ${centerX} ${centerY + vSize * 0.4}`}
            stroke="url(#goldGradient)"
            strokeWidth={vSize * 0.12}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d={`M ${centerX + vSize * 0.35} ${centerY - vSize * 0.4} L ${centerX} ${centerY + vSize * 0.4}`}
            stroke="url(#goldGradient)"
            strokeWidth={vSize * 0.08}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      {showText && (
        <div
          className="vantis-logo-text"
          style={{
            fontSize: config.fontSize,
            color: logoColor,
            marginTop: config.spacing,
          }}>
          VANTIS
        </div>
      )}
    </div>
  );
};

