import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { Header } from '../components/Header';
import { Wallet, QrCode } from 'lucide-react';
import { colors } from '../theme/colors';
import './HomeScreen.css';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { colors: themeColors } = useTheme();
  const { account, isConnected, refreshAccount, loadTransactions } = useWallet();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Convert XLM to USD (mock rate: 1 XLM = 0.10 USD)
  const xlmToUsd = (xlm: string): string => {
    const xlmAmount = parseFloat(xlm) || 0;
    return (xlmAmount * 0.10).toFixed(2);
  };

  // Mock assets data with APY (matching Pitch Deck)
  const mockAssets = [
    {
      assetCode: 'XLM',
      balance: account?.balance || '0.00',
      balanceUsd: xlmToUsd(account?.balance || '0.00'),
      apy: '8.5%',
    },
    {
      assetCode: 'BTC',
      balance: '0.00',
      balanceUsd: '0.00',
      apy: '6.2%',
    },
  ];

  const totalSpendingPower = mockAssets.reduce((sum, asset) => {
    return sum + parseFloat(asset.balanceUsd || '0');
  }, 0);

  useEffect(() => {
    if (isConnected) {
      refreshAccount();
      loadTransactions();
    }
  }, [isConnected]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (isConnected) {
      await refreshAccount();
      await loadTransactions();
    }
    setTimeout(() => setRefreshing(false), 500);
  };

  if (!isConnected) {
    return (
      <div
        className="home-screen"
        style={{ backgroundColor: themeColors.bgPrimary }}>
        <Header showMenu={true} />
        <div className="home-empty-state">
          <Wallet size={64} color={themeColors.textSecondary} />
          <p
            className="home-empty-text"
            style={{ color: themeColors.textPrimary }}>
            Instant liquidity without selling your crypto
          </p>
          <p
            className="home-empty-subtext"
            style={{ color: themeColors.textSecondary }}>
            Keep your crypto. Get instant liquidity. Pay 6x less.
          </p>
          <button
            className="home-connect-button"
            onClick={() => navigate('/wallet-connect')}
            style={{ backgroundColor: colors.accentTeal }}>
            <Wallet size={20} color={themeColors.bgPrimary} />
            <span style={{ color: themeColors.bgPrimary }}>Connect Wallet</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="home-screen"
      style={{ backgroundColor: themeColors.bgPrimary }}>
      <Header showMenu={true} onBalanceToggle={() => setBalanceVisible(!balanceVisible)} />

      <div className="home-content" onScroll={onRefresh}>
        {/* Hero Section: Your Spending Power */}
        <div className="home-spending-power-section">
          <div className="home-spending-power-label" style={{ color: themeColors.textSecondary }}>
            Your Spending Power
          </div>
          <div
            className="home-spending-power-value"
            style={{ color: colors.accentTeal }}>
            {balanceVisible
              ? `$${totalSpendingPower.toFixed(2)}`
              : '••••••'}
          </div>
          {account?.balance && balanceVisible && (
            <div className="home-spending-power-badge" style={{ color: colors.accentGreen }}>
              +12.4% this month
            </div>
          )}
        </div>

        {/* Assets List */}
        <div className="home-assets-section">
          {mockAssets.map((asset, index) => (
            <div
              key={index}
              className="home-asset-row"
              style={{
                backgroundColor: themeColors.bgCard,
                borderColor: themeColors.borderColor,
              }}>
              <div className="home-asset-info">
                <div className="home-asset-name" style={{ color: themeColors.textPrimary }}>
                  {asset.assetCode}
                </div>
                <div className="home-asset-balance" style={{ color: themeColors.textSecondary }}>
                  ${asset.balanceUsd}
                </div>
              </div>
              <div className="home-asset-apy" style={{ color: colors.accentGreen }}>
                {asset.apy} APY
              </div>
            </div>
          ))}
        </div>


        {/* Pay with Vants Button */}
        <div className="home-pay-button-container">
          <button
            className="home-pay-button"
            onClick={() => {
              // Open QR code modal or payment flow
              alert('Pay with Vants - QR Code Scanner');
            }}
            style={{
              backgroundColor: colors.accentTeal,
              color: '#000000',
            }}>
            <QrCode size={24} color="#000000" />
            <span>Pay with Vants</span>
          </button>
        </div>

        <div className="home-footer-text">
          <p
            className="home-footer-text-content"
            style={{
              color: themeColors.textSecondary,
            }}>
            The Vantis App is a self-custodial smart wallet. All borrowing and
            lending features are decentralized and powered by Exactly Protocol.{' '}
            <a
              href="#"
              className="home-footer-link"
              style={{
                color: colors.accentTeal,
              }}>
              Terms and conditions
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

