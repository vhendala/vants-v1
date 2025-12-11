import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext';
import { Home, CreditCard, ArrowLeftRight, TrendingUp, List } from 'lucide-react';
import { colors, spacing } from '../theme/colors';
import './NavigationBar.css';

type NavItem = {
  name: string;
  icon: React.ReactNode;
  label: string;
  route: string;
};

const navItems: NavItem[] = [
  { name: 'home', icon: <Home size={24} />, label: 'Home', route: '/home' },
  { name: 'card', icon: <CreditCard size={24} />, label: 'Card', route: '/card' },
  {
    name: 'pay-mode',
    icon: <ArrowLeftRight size={28} />,
    label: 'Pay',
    route: '/payment',
  },
  { name: 'defi', icon: <TrendingUp size={24} />, label: 'DeFi', route: '/defi' },
  { name: 'activity', icon: <List size={24} />, label: 'Activity', route: '/activity' },
];

export const NavigationBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { colors: themeColors } = useTheme();

  const currentRoute = location.pathname;

  const navigateTo = (route: string) => {
    navigate(route);
  };

  return (
    <nav
      className="navigation-bar"
      style={{
        backgroundColor: themeColors.bgSecondary,
        borderTopColor: themeColors.borderColor,
      }}>
      {navItems.map((item) => {
        const isActive = currentRoute === item.route || 
          (item.route === '/home' && currentRoute === '/');
        const isPayButton = item.name === 'pay-mode';

        if (isPayButton) {
          return (
            <div key={item.name} className="navigation-bar-pay-button-container">
              <button
                className="navigation-bar-pay-button"
                onClick={() => navigateTo('/payment')}
                style={{
                  backgroundColor: colors.accentTeal,
                  boxShadow: `0 4px 8px ${colors.accentTeal}40`,
                }}>
                {item.icon}
              </button>
              <span
                className="navigation-bar-pay-label"
                style={{ color: themeColors.textPrimary }}>
                {item.label}
              </span>
            </div>
          );
        }

        return (
          <button
            key={item.name}
            className="navigation-bar-item"
            onClick={() => navigateTo(item.route)}
            style={{
              color: isActive ? colors.accentTeal : themeColors.textSecondary,
            }}>
            <div
              style={{
                color: isActive ? colors.accentTeal : themeColors.textSecondary,
              }}>
              {item.icon}
            </div>
            <span
              style={{
                color: isActive ? colors.accentTeal : themeColors.textSecondary,
              }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

