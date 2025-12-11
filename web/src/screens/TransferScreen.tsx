import React from 'react';
import { useTheme } from '../theme/ThemeContext';
import { Header } from '../components/Header';
import './TransferScreen.css';

export const TransferScreen: React.FC = () => {
  const { colors: themeColors } = useTheme();

  return (
    <div className="transfer-screen" style={{ backgroundColor: themeColors.bgPrimary }}>
      <Header showMenu={true} />
      <div className="transfer-screen-content">
        <h2 style={{ color: themeColors.textPrimary }}>Transfer</h2>
        <p style={{ color: themeColors.textSecondary }}>Transfer functionality coming soon</p>
      </div>
    </div>
  );
};

