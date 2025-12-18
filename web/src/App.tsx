import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeContext';
import { WalletProvider, useWallet } from './contexts/WalletContext';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { WalletConnectScreen } from './screens/WalletConnectScreen';
import { HomeScreen } from './screens/HomeScreen';
import { CardScreen } from './screens/CardScreen';
import { PaymentScreen } from './screens/PaymentScreen';
import { DeFiScreen } from './screens/DeFiScreen';
import { ActivityScreen } from './screens/ActivityScreen';
import { TransferScreen } from './screens/TransferScreen';
import { ReceiveScreen } from './screens/ReceiveScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { NavigationBar } from './components/NavigationBar';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected, isLoading } = useWallet();

  if (isLoading) {
    return <div className="app-loading">Loading...</div>;
  }

  if (!isConnected) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected } = useWallet();

  return (
    <>
      {children}
      {isConnected && <NavigationBar />}
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <BrowserRouter>
          <div className="app">
            <Routes>
              <Route path="/" element={<WelcomeScreen />} />
              <Route path="/onboarding" element={<OnboardingScreen />} />
              <Route path="/wallet-connect" element={<WalletConnectScreen />} />
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <HomeScreen />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/card"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <CardScreen />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <PaymentScreen />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/defi"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <DeFiScreen />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activity"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ActivityScreen />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transfer"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <TransferScreen />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/receive"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ReceiveScreen />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="/settings" element={<SettingsScreen />} />
            </Routes>
          </div>
        </BrowserRouter>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;

