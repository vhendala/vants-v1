import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { Header } from '../components/Header';
import { LogOut } from 'lucide-react';
import './SettingsScreen.css';

export const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { colors: themeColors } = useTheme();
  const { disconnectWallet, account } = useWallet();

  const handleDisconnect = async () => {
    await disconnectWallet();
    navigate('/');
  };

  return (
    <div className="settings-screen" style={{ backgroundColor: themeColors.bgPrimary }}>
      <Header showMenu={true} />
      <div className="settings-screen-content">
        <h2 style={{ color: themeColors.textPrimary }}>Settings</h2>
        {account && (
          <button
            className="settings-disconnect-button"
            onClick={handleDisconnect}
            style={{
              backgroundColor: themeColors.bgCard,
              borderColor: themeColors.borderColor,
              color: themeColors.textPrimary,
            }}>
            <LogOut size={20} />
            <span>Disconnect Wallet</span>
          </button>
        )}
      </div>
    </div>
  );
};

