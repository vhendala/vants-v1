import React from 'react';
import { useTheme } from '../theme/ThemeContext';
import { Header } from '../components/Header';
import './DeFiScreen.css';

export const DeFiScreen: React.FC = () => {
  const { colors: themeColors } = useTheme();

  return (
    <div className="defi-screen" style={{ backgroundColor: themeColors.bgPrimary }}>
      <Header showMenu={true} />
      <div className="defi-screen-content">
        <h2 style={{ color: themeColors.textPrimary }}>DeFi</h2>
        <p style={{ color: themeColors.textSecondary }}>DeFi functionality coming soon</p>
      </div>
    </div>
  );
};

