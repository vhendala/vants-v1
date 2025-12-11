import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { walletService, WalletAccount, Transaction } from '../services/walletService';

interface WalletContextType {
  account: WalletAccount | null;
  isConnected: boolean;
  isLoading: boolean;
  transactions: Transaction[];
  connectWallet: (publicKey: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  refreshAccount: () => Promise<void>;
  loadTransactions: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadSavedWallet();
  }, []);

  const loadSavedWallet = async () => {
    try {
      const savedPublicKey = await walletService.getSavedWallet();
      if (savedPublicKey) {
        await connectWallet(savedPublicKey);
      }
    } catch (error) {
      console.error('Error loading saved wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async (publicKey: string) => {
    try {
      setIsLoading(true);
      const walletAccount = await walletService.connectWallet(publicKey);
      setAccount(walletAccount);
      await loadTransactions();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await walletService.disconnectWallet();
      setAccount(null);
      setTransactions([]);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const refreshAccount = async () => {
    try {
      if (account) {
        const updatedAccount = await walletService.refreshAccount();
        setAccount(updatedAccount);
      }
    } catch (error) {
      console.error('Error refreshing account:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const txHistory = await walletService.getTransactionHistory();
      setTransactions(txHistory);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        account,
        isConnected: !!account,
        isLoading,
        transactions,
        connectWallet,
        disconnectWallet,
        refreshAccount,
        loadTransactions,
      }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

