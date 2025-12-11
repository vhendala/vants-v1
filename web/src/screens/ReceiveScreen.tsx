import React from 'react';
import { useTheme } from '../theme/ThemeContext';
import { Header } from '../components/Header';
import './ReceiveScreen.css';

export const ReceiveScreen: React.FC = () => {
  const { colors: themeColors } = useTheme();

  return (
    <div className="receive-screen" style={{ backgroundColor: themeColors.bgPrimary }}>
      <Header showMenu={true} />
      <div className="receive-screen-content">
        <h2 style={{ color: themeColors.textPrimary }}>Receive</h2>
        <p style={{ color: themeColors.textSecondary }}>Receive functionality coming soon</p>
      </div>
    </div>
  );
};

