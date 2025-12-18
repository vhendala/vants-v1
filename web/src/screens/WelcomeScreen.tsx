import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { VantisLogo } from '../components/VantisLogo';
import { passkeyService } from '../services/passkeyService';
import { walletService } from '../services/walletService';
import { colors } from '../theme/colors';
import './WelcomeScreen.css';

export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { colors: themeColors } = useTheme();
  const { connectWallet } = useWallet();
  const [isLoading] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const createAccount = () => {
    navigate('/onboarding');
  };

  const handleLogin = async () => {
    try {
      setIsLoginLoading(true);

      // Check if passkeys are supported
      const supported = await passkeyService.isSupported();
      if (!supported) {
        alert(
          'Passkeys Not Supported\nYour browser does not support passkeys. Please use a modern browser with WebAuthn support.',
        );
        setIsLoginLoading(false);
        return;
      }

      // Authenticate with passkey
      const passkeyAccount = await passkeyService.authenticate();

      if (!passkeyAccount.contractAddress) {
        // If no contract address linked, navigate to wallet connect
        navigate('/wallet-connect');
        setIsLoginLoading(false);
        return;
      }

      // Connect wallet using the linked contract address
      await walletService.connectWallet(passkeyAccount.contractAddress);

      // Connect to wallet context
      await connectWallet(passkeyAccount.contractAddress);

      // Navigate to home
      navigate('/home');
    } catch (error: any) {
      if (error.message.includes('No passkey account found')) {
        // No passkey found, navigate to onboarding
        navigate('/onboarding');
      } else {
        alert('Error: ' + (error.message || 'Failed to sign in with passkey'));
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  return (
    <div
      className="welcome-screen"
      style={{ backgroundColor: themeColors.bgPrimary }}>
      <div className="welcome-content">
        <div className="welcome-illustration-section">
          <div className="welcome-illustration-elements">
            <VantisLogo size="large" variant="light" showText={true} />
          </div>
        </div>

        <div className="welcome-text-section">
          <h1
            className="welcome-title"
            style={{
              color: colors.accentTeal,
            }}>
            Buy Now.{'\n'}Keep Your Crypto.{'\n'}Build Wealth.
          </h1>

          <div className="welcome-carousel-indicators">
            <div className="welcome-indicator" />
            <div
              className="welcome-indicator welcome-indicator-active"
              style={{ backgroundColor: colors.accentTeal }}
            />
            <div className="welcome-indicator" />
          </div>

          <button
            className="welcome-create-btn"
            onClick={createAccount}
            disabled={isLoading || isLoginLoading}
            style={{
              backgroundColor: colors.accentTeal,
              opacity: isLoading ? 0.6 : 1,
            }}>
            {isLoading ? (
              <div className="welcome-spinner" />
            ) : (
              <>
                <span style={{ color: themeColors.bgPrimary }}>Create an account</span>
                <span>🔑</span>
              </>
            )}
          </button>

          <div className="welcome-login-link">
            <span style={{ color: themeColors.textSecondary }}>
              Already have an account?{' '}
            </span>
            <button
              className="welcome-login-link-button"
              onClick={handleLogin}
              disabled={isLoading || isLoginLoading}
              style={{ color: colors.accentTeal }}>
              {isLoginLoading ? (
                <div className="welcome-spinner-small" />
              ) : (
                'Sign in with passkey'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

