import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getJson, postJson, ApiError } from '../lib/api';
import { Toast, useToast } from '../components/Toast';
import type { WalletDto, CreateWalletDto } from '../types/dtos';

/**
 * Wallets Page Component
 * Displays a list of user's wallets and allows creating new ones
 */
export const WalletsPage: React.FC = () => {
  // State
  const [wallets, setWallets] = useState<WalletDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletCurrency, setNewWalletCurrency] = useState('BRL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks
  const [toast, showToast, hideToast] = useToast();

  /**
   * Fetch wallets from API
   */
  const fetchWallets = useCallback(async () => {
    try {
      const data = await getJson<WalletDto[]>('/api/wallets');
      setWallets(data);
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to load wallets', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Load wallets on mount
  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  /**
   * Handle create wallet form submission
   */
  const handleCreateWallet = async (e: FormEvent) => {
    e.preventDefault();

    if (!newWalletName.trim()) {
      showToast('Wallet name is required', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const walletData: CreateWalletDto = {
        name: newWalletName.trim(),
        currency: newWalletCurrency,
      };

      const newWallet = await postJson<WalletDto>('/api/wallets', walletData);
      setWallets([...wallets, newWallet]);
      setShowModal(false);
      setNewWalletName('');
      setNewWalletCurrency('BRL');
      showToast('Wallet created successfully!', 'success');
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to create wallet', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Format currency value
   */
  const formatCurrency = (amount: number, currency: string): string => {
    if (isNaN(amount)) {
        amount = 0;
    }

    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (isLoading) {
    return <div className="loading">Loading wallets...</div>;
  }

  return (
    <div className="page wallets-page">
      <div className="page-header">
        <h1>My Wallets</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          + New Wallet
        </button>
      </div>

      {/* Wallets List */}
      {wallets.length === 0 ? (
        <div className="empty-state">
          <p>You don't have any wallets yet.</p>
          <p>Create your first wallet to start tracking your finances!</p>
        </div>
      ) : (
        <div className="wallets-grid">
          {wallets.map((wallet) => (
            <Link
              key={wallet.id}
              to={`/wallets/${wallet.id}`}
              className="wallet-card"
            >
              <h3>{wallet.name}</h3>
              <p className="wallet-balance">
                {formatCurrency(wallet.balance, wallet.currency)}
              </p>
              <span className="wallet-currency">{wallet.currency}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Create Wallet Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Wallet</h2>
            <form onSubmit={handleCreateWallet}>
              <div className="form-group">
                <label htmlFor="walletName">Wallet Name</label>
                <input
                  type="text"
                  id="walletName"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  placeholder="e.g., Main Account, Savings"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="walletCurrency">Currency</label>
                <select
                  id="walletCurrency"
                  value={newWalletCurrency}
                  onChange={(e) => setNewWalletCurrency(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="BRL">BRL - Brazilian Real</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Wallet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};
