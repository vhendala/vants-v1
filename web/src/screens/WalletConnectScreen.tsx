import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { walletService } from '../services/walletService';
import { Wallet } from 'lucide-react';
import { colors } from '../theme/colors';
import './WalletConnectScreen.css';

export const WalletConnectScreen: React.FC = () => {
  const navigate = useNavigate();
  const { colors: themeColors } = useTheme();
  const { connectWallet, isLoading } = useWallet();
  const [publicKey, setPublicKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!publicKey.trim()) {
      alert('Please enter a valid public key');
      return;
    }

    try {
      setIsConnecting(true);
      await connectWallet(publicKey.trim());
      navigate('/home');
    } catch (error: any) {
      alert('Connection Failed: ' + (error.message || 'Failed to connect wallet'));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGenerateWallet = async () => {
    try {
      setIsConnecting(true);
      const { publicKey: newPublicKey, secretKey } = await walletService.generateWallet();
      
      const shouldConnect = confirm(
        `New Wallet Created!\n\nPublic Key: ${newPublicKey}\n\n⚠️ Save your secret key securely!\n${secretKey}\n\nClick OK to connect.`
      );
      
      if (shouldConnect) {
        setPublicKey(newPublicKey);
        await connectWallet(newPublicKey);
        navigate('/home');
      }
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to generate wallet'));
    } finally {
      setIsConnecting(false);
    }
  };

  if (isConnecting || isLoading) {
    return (
      <div className="wallet-connect-loading" style={{ backgroundColor: themeColors.bgPrimary }}>
        <div className="wallet-connect-spinner" />
      </div>
    );
  }

  return (
    <div className="wallet-connect-screen" style={{ backgroundColor: themeColors.bgPrimary }}>
      <div className="wallet-connect-content">
        <div className="wallet-connect-header">
          <Wallet size={64} color={colors.accentTeal} />
          <h1 style={{ color: themeColors.textPrimary }}>Connect Your Wallet</h1>
          <p style={{ color: themeColors.textSecondary }}>
            Connect using OpenZeppelin Smart Account or enter your Stellar public key
          </p>
        </div>

        <div className="wallet-connect-form">
          <input
            type="text"
            placeholder="Enter Stellar public key (G...)"
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            className="wallet-connect-input"
            style={{
              backgroundColor: themeColors.bgCard,
              color: themeColors.textPrimary,
              borderColor: themeColors.borderColor,
            }}
          />

          <button
            onClick={handleConnect}
            className="wallet-connect-button"
            style={{ backgroundColor: colors.accentTeal }}>
            <span style={{ color: themeColors.bgPrimary }}>Connect</span>
          </button>

          <div className="wallet-connect-divider">
            <span style={{ color: themeColors.textSecondary }}>OR</span>
          </div>

          <button
            onClick={handleGenerateWallet}
            className="wallet-connect-button wallet-connect-button-secondary"
            style={{
              backgroundColor: themeColors.bgCard,
              borderColor: themeColors.borderColor,
              color: themeColors.textPrimary,
            }}>
            Generate New Wallet
          </button>
        </div>
      </div>
    </div>
  );
};

