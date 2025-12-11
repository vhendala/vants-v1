import React from 'react';
import { useTheme } from '../theme/ThemeContext';
import { Header } from '../components/Header';
import './PaymentScreen.css';

export const PaymentScreen: React.FC = () => {
  const { colors: themeColors } = useTheme();

  return (
    <div className="payment-screen" style={{ backgroundColor: themeColors.bgPrimary }}>
      <Header showMenu={true} />
      <div className="payment-screen-content">
        <h2 style={{ color: themeColors.textPrimary }}>Payment</h2>
        <p style={{ color: themeColors.textSecondary }}>Payment functionality coming soon</p>
      </div>
    </div>
  );
};

