import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { VantisLogo } from './VantisLogo';
import { Menu, Eye, Settings } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  walletAddress?: string;
  showMenu?: boolean;
  onBalanceToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  walletAddress,
  showMenu = false,
  onBalanceToggle,
}) => {
  const navigate = useNavigate();
  const { colors: themeColors } = useTheme();
  const { account } = useWallet();

  const displayAddress =
    walletAddress ||
    (account?.publicKey
      ? `${account.publicKey.slice(0, 6)}...${account.publicKey.slice(-4)}`
      : 'Not connected');

  return (
    <header
      className="header"
      style={{
        backgroundColor: themeColors.bgPrimary,
        borderBottomColor: themeColors.borderColor,
      }}>
      {showMenu ? (
        <button className="header-menu-button" aria-label="Menu">
          <Menu size={24} color={themeColors.textPrimary} />
        </button>
      ) : (
        <div className="header-logo">
          <VantisLogo size="small" showText={false} />
        </div>
      )}
      <div
        className="header-wallet-address"
        style={{ color: themeColors.textPrimary }}>
        {displayAddress}
      </div>
      <div className="header-actions">
        {onBalanceToggle && (
          <button
            className="header-action-button"
            onClick={onBalanceToggle}
            aria-label="Toggle balance visibility">
            <Eye size={20} color={themeColors.textPrimary} />
          </button>
        )}
        <button
          className="header-action-button"
          onClick={() => navigate('/settings')}
          aria-label="Settings">
          <Settings size={20} color={themeColors.textPrimary} />
        </button>
      </div>
    </header>
  );
};

