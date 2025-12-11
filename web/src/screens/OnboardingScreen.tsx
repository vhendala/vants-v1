import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { passkeyService } from '../services/passkeyService';
import { walletService } from '../services/walletService';
import { colors } from '../theme/colors';
import './OnboardingScreen.css';

export const OnboardingScreen: React.FC = () => {
  const navigate = useNavigate();
  const { colors: themeColors } = useTheme();
  const { connectWallet } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const createAccount = async () => {
    try {
      setIsLoading(true);

      // Check if passkeys are supported
      const supported = await passkeyService.isSupported();
      if (!supported) {
        alert(
          'Passkeys Not Supported\nYour browser does not support passkeys. Please use a modern browser with WebAuthn support.',
        );
        setIsLoading(false);
        return;
      }

      // Register a new passkey
      const passkeyAccount = await passkeyService.register('user');

      // Generate a wallet and link it to the passkey
      const { publicKey } = await walletService.generateWallet();
      
      // Connect wallet with the passkey account
      await walletService.connectWallet(publicKey);
      
      // Link passkey to wallet
      await passkeyService.linkContractAddress(
        passkeyAccount.credentialId,
        publicKey,
      );

      // Connect to wallet context
      await connectWallet(publicKey);

      // Navigate to home
      navigate('/home');
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to create account with passkey'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="onboarding-screen"
      style={{ backgroundColor: themeColors.bgPrimary }}>
      <div className="onboarding-content">
        <div className="onboarding-illustration-section">
          <div
            className="onboarding-illustration-bg"
            style={{
              backgroundColor: colors.accentTealDark,
              opacity: 0.3,
            }}
          />
          <div className="onboarding-illustration-elements">
            <div className="onboarding-key-icon">🔑</div>
            <div
              className="onboarding-biometric-icon"
              style={{
                backgroundColor: 'rgba(255, 215, 0, 0.9)',
              }}>
              <div className="onboarding-biometric-icon-text">👤</div>
            </div>
          </div>
        </div>

        <div className="onboarding-text-section">
          <h1
            className="onboarding-title"
            style={{
              color: colors.accentTeal,
            }}>
            Create Your Account
          </h1>
          <p
            className="onboarding-subtitle"
            style={{
              color: themeColors.textSecondary,
            }}>
            Secure your wallet with a passkey. No passwords needed!
          </p>

          <button
            className="onboarding-create-btn"
            onClick={createAccount}
            disabled={isLoading}
            style={{
              backgroundColor: colors.accentTeal,
              opacity: isLoading ? 0.6 : 1,
            }}>
            {isLoading ? (
              <div className="onboarding-spinner" />
            ) : (
              <>
                <span style={{ color: themeColors.bgPrimary }}>Create Account</span>
                <span>🔑</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

