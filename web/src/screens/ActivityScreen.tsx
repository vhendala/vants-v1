import React from 'react';
import { useTheme } from '../theme/ThemeContext';
import { Header } from '../components/Header';
import './ActivityScreen.css';

export const ActivityScreen: React.FC = () => {
  const { colors: themeColors } = useTheme();

  return (
    <div className="activity-screen" style={{ backgroundColor: themeColors.bgPrimary }}>
      <Header showMenu={true} />
      <div className="activity-screen-content">
        <h2 style={{ color: themeColors.textPrimary }}>Activity</h2>
        <p style={{ color: themeColors.textSecondary }}>Activity history coming soon</p>
      </div>
    </div>
  );
};

