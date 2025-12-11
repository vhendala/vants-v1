import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { Header } from '../components/Header';
import { Send, Download, CheckCircle2, FileText } from 'lucide-react';
import { colors } from '../theme/colors';
import './HomeScreen.css';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { colors: themeColors } = useTheme();
  const { account, isConnected, refreshAccount, loadTransactions } = useWallet();
  const [balanceVisible, setBalanceVisible] = useState(true);

  // Convert XLM to USD (mock rate: 1 XLM = 0.10 USD)
  const xlmToUsd = (xlm: string): string => {
    const xlmAmount = parseFloat(xlm) || 0;
    return (xlmAmount * 0.10).toFixed(2);
  };

  useEffect(() => {
    if (isConnected) {
      refreshAccount();
      loadTransactions();
    }
  }, [isConnected]);

  const onRefresh = async () => {
    if (isConnected) {
      await refreshAccount();
      await loadTransactions();
    }
  };

  if (!isConnected) {
    return (
      <div
        className="home-screen"
        style={{ backgroundColor: themeColors.bgPrimary }}>
        <Header showMenu={true} />
        <div className="home-empty-state">
          <div style={{ color: themeColors.textSecondary, fontSize: '64px' }}>💼</div>
          <p
            className="home-empty-text"
            style={{ color: themeColors.textPrimary }}>
            invest your assets and pay later
          </p>
          <button
            className="home-connect-button"
            onClick={() => navigate('/wallet-connect')}
            style={{ backgroundColor: colors.accentTeal }}>
            <span style={{ color: themeColors.bgPrimary }}>💼</span>
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
        <div className="home-portfolio-section">
          <div
            className="home-balance"
            style={{ color: themeColors.textPrimary }}>
            {balanceVisible
              ? `$${xlmToUsd(account?.balance || '0.00')} USD`
              : '••••••'}
          </div>
          {account?.balance && (
            <div
              className="home-balance-subtext"
              style={{ color: themeColors.textSecondary }}>
              {balanceVisible ? `${account.balance} XLM` : ''}
            </div>
          )}
        </div>

        <div className="home-action-buttons">
          <div className="home-send-receive-buttons">
            <button
              className="home-btn home-btn-secondary"
              onClick={() => navigate('/transfer')}
              style={{
                backgroundColor: themeColors.bgCard,
                borderColor: themeColors.borderColor,
              }}>
              <Send size={20} color={themeColors.textPrimary} />
              <span style={{ color: themeColors.textPrimary }}>Send</span>
            </button>

            <button
              className="home-btn home-btn-secondary"
              onClick={() => navigate('/receive')}
              style={{
                backgroundColor: themeColors.bgCard,
                borderColor: themeColors.borderColor,
              }}>
              <Download size={20} color={themeColors.textPrimary} />
              <span style={{ color: themeColors.textPrimary }}>Receive</span>
            </button>
          </div>
        </div>

        <div className="home-cards-grid">
          <div
            className="home-card"
            style={{
              backgroundColor: themeColors.bgCard,
            }}>
            <h3
              className="home-card-title"
              style={{
                color: themeColors.textPrimary,
              }}>
              Upcoming payments
            </h3>
            <div className="home-empty-state">
              <CheckCircle2 size={48} color={colors.accentTeal} />
              <p
                className="home-empty-state-text"
                style={{
                  color: colors.accentTeal,
                }}>
                You're all set!
              </p>
              <p
                className="home-empty-state-subtext"
                style={{
                  color: themeColors.textSecondary,
                }}>
                Any funding or purchases will show up here.
              </p>
            </div>
          </div>

          <div
            className="home-card"
            style={{
              backgroundColor: themeColors.bgCard,
            }}>
            <h3
              className="home-card-title"
              style={{
                color: themeColors.textPrimary,
              }}>
              Latest activity
            </h3>
            <div className="home-empty-state">
              <FileText size={48} color={colors.accentTeal} />
              <p
                className="home-empty-state-text"
                style={{
                  color: colors.accentTeal,
                }}>
                No activity yet
              </p>
              <p
                className="home-empty-state-subtext"
                style={{
                  color: themeColors.textSecondary,
                }}>
                Your transactions will show up here once you get started. Add
                funds to begin!
              </p>
            </div>
          </div>
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

