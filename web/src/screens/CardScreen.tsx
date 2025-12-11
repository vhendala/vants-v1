import React from 'react';
import { useTheme } from '../theme/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { Header } from '../components/Header';
import { CreditCard } from 'lucide-react';
import './CardScreen.css';

export const CardScreen: React.FC = () => {
  const { colors: themeColors } = useTheme();
  const { account } = useWallet();

  return (
    <div className="card-screen" style={{ backgroundColor: themeColors.bgPrimary }}>
      <Header showMenu={true} />
      <div className="card-screen-content">
        <div
          className="card-screen-card"
          style={{
            backgroundColor: themeColors.bgCard,
            borderColor: themeColors.borderColor,
          }}>
          <div className="card-screen-card-header">
            <CreditCard size={32} color={themeColors.textPrimary} />
            <h2 style={{ color: themeColors.textPrimary }}>Virtual Card</h2>
          </div>
          {account?.cardNumber ? (
            <div className="card-screen-card-number">
              <p style={{ color: themeColors.textPrimary }}>{account.cardNumber}</p>
            </div>
          ) : (
            <p style={{ color: themeColors.textSecondary }}>No card available</p>
          )}
        </div>
      </div>
    </div>
  );
};

