import React, { useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { Header } from '../components/Header';
import { CreditCard, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { colors } from '../theme/colors';
import './CardScreen.css';

export const CardScreen: React.FC = () => {
  const { colors: themeColors } = useTheme();
  const { account } = useWallet();
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [showCVV, setShowCVV] = useState(false);
  const [copied, setCopied] = useState(false);

  // Format card number for display
  const formatCardNumber = (cardNumber: string | undefined): string => {
    if (!cardNumber || cardNumber === '**** **** **** ****') {
      return '**** **** **** ****';
    }
    const digitsOnly = cardNumber.replace(/\D/g, '');
    if (digitsOnly.length !== 16) {
      return cardNumber;
    }
    return `${digitsOnly.substring(0, 4)} ${digitsOnly.substring(4, 8)} ${digitsOnly.substring(8, 12)} ${digitsOnly.substring(12, 16)}`;
  };

  const maskedCardNumber = formatCardNumber(account?.cardNumber);
  const fullCardNumber = account?.cardNumber || '**** **** **** ****';
  const cvv = '123';
  const expiryDate = '12/28';
  const cardholderName = account?.publicKey ? 'SELF-CUSTODIAL' : 'YOUR NAME';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-screen" style={{ backgroundColor: themeColors.bgPrimary }}>
      <Header showMenu={true} />
      <div className="card-screen-content">
        {/* Visual Card */}
        <div className="card-visual-container">
          <div className="card-visual" style={{
            background: 'linear-gradient(to right bottom, #358FDC 0%, #DFB433 100%)',
          }}>
            <div className="card-visual-header">
              <img
                src="/vants-logo.png"
                alt="Vants Logo"
                className="card-logo-image"
              />
            </div>
            
            <div className="card-visual-number">
              {showCardDetails ? (
                <span className="card-number-text">{formatCardNumber(fullCardNumber)}</span>
              ) : (
                <span className="card-number-text">{maskedCardNumber}</span>
              )}
            </div>

            <div className="card-visual-footer">
              <div className="card-visual-footer-left">
                <div className="card-label">CARDHOLDER</div>
                <div className="card-name">{cardholderName}</div>
              </div>
              <div className="card-visual-footer-right">
                <div className="card-label">VALID THRU</div>
                <div className="card-expiry">{expiryDate}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Details Section */}
        <div className="card-details-section">
          <div
            className="card-details-card"
            style={{
              backgroundColor: themeColors.bgCard,
              borderColor: themeColors.borderColor,
            }}>
            <div className="card-details-header">
              <CreditCard size={24} color={colors.accentTeal} />
              <h3 style={{ color: themeColors.textPrimary }}>Card Details</h3>
              <button
                className="card-toggle-details"
                onClick={() => setShowCardDetails(!showCardDetails)}
                style={{ color: themeColors.textSecondary }}>
                {showCardDetails ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="card-details-list">
              <div className="card-detail-row" style={{ borderBottomColor: themeColors.borderColor }}>
                <div className="card-detail-label" style={{ color: themeColors.textSecondary }}>
                  Card Number
                </div>
                <div className="card-detail-value-row">
                  <span className="card-detail-value" style={{ color: themeColors.textPrimary }}>
                    {showCardDetails ? formatCardNumber(fullCardNumber) : maskedCardNumber}
                  </span>
                  <button
                    className="card-copy-button"
                    onClick={() => handleCopy(fullCardNumber.replace(/\s/g, ''))}
                    style={{ color: colors.accentTeal }}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="card-detail-row" style={{ borderBottomColor: themeColors.borderColor }}>
                <div className="card-detail-label" style={{ color: themeColors.textSecondary }}>
                  Cardholder Name
                </div>
                <div className="card-detail-value" style={{ color: themeColors.textPrimary }}>
                  {cardholderName}
                </div>
              </div>

              <div className="card-detail-row" style={{ borderBottomColor: themeColors.borderColor }}>
                <div className="card-detail-label" style={{ color: themeColors.textSecondary }}>
                  Valid Thru
                </div>
                <div className="card-detail-value" style={{ color: themeColors.textPrimary }}>
                  {expiryDate}
                </div>
              </div>

              <div className="card-detail-row">
                <div className="card-detail-label" style={{ color: themeColors.textSecondary }}>
                  CVV
                </div>
                <div className="card-detail-value-row">
                  <span className="card-detail-value" style={{ color: themeColors.textPrimary }}>
                    {showCVV ? cvv : '•••'}
                  </span>
                  <button
                    className="card-toggle-cvv"
                    onClick={() => setShowCVV(!showCVV)}
                    style={{ color: themeColors.textSecondary }}>
                    {showCVV ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card-info-note" style={{ color: themeColors.textSecondary }}>
            <p>Use this virtual card for online purchases. Your card is protected by OpenZeppelin Smart Accounts.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

