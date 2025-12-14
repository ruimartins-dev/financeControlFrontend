import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getJson, postJson, ApiError } from '../lib/api';
import { Toast, useToast } from '../components/Toast';
import type { WalletDto, CreateWalletDto } from '../types/dtos';

/**
 * Wallets Page Component
 */
export const WalletsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [wallets, setWallets] = useState<WalletDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletCurrency, setNewWalletCurrency] = useState('EUR');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [toast, showToast, hideToast] = useToast();

  const fetchWallets = useCallback(async () => {
    try {
      const data = await getJson<WalletDto[]>('/api/wallets');
      setWallets(data);
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast(t('wallets.loadError'), 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleCreateWallet = async (e: FormEvent) => {
    e.preventDefault();

    if (!newWalletName.trim()) {
      showToast(t('wallets.nameRequired'), 'error');
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
      setNewWalletCurrency('EUR');
      showToast(t('wallets.createSuccess'), 'success');
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast(t('wallets.createError'), 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null, currency: string): string => {
    const value = Number(amount) || 0;
    const locale = i18n.language === 'pt' ? 'pt-PT' : 'en-GB';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const getCurrencyIcon = (currency: string): string => {
    switch (currency) {
      case 'EUR': return '€';
      case 'USD': return '$';
      case 'GBP': return '£';
      case 'BRL': return 'R$';
      default: return '💰';
    }
  };

  const totalBalance = wallets.reduce((sum, wallet) => sum + (Number(wallet.balance) || 0), 0);

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="wallets-page">
      <div className="page-header">
        <div>
          <h1>{t('wallets.title')}</h1>
          <p className="page-subtitle">
            {wallets.length > 0 
              ? `${t('wallets.totalBalance')}: ${formatCurrency(totalBalance, 'EUR')}`
              : t('wallets.subtitle')}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <span className="btn-icon">+</span>
          {t('wallets.newWallet')}
        </button>
      </div>

      {wallets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👛</div>
          <h3>{t('wallets.noWallets')}</h3>
          <p>{t('wallets.noWalletsDescription')}</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            {t('wallets.createWallet')}
          </button>
        </div>
      ) : (
        <div className="wallets-grid">
          {wallets.map((wallet) => (
            <Link
              key={wallet.id}
              to={`/wallets/${wallet.id}`}
              className="wallet-card"
            >
              <div className="wallet-card-header">
                <div className="wallet-card-icon">
                  {getCurrencyIcon(wallet.currency)}
                </div>
              </div>
              <h3>{wallet.name}</h3>
              <span className="currency-badge">{wallet.currency}</span>
              <p className={`wallet-card-balance ${(Number(wallet.balance) || 0) >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(wallet.balance, wallet.currency)}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Create Wallet Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('wallets.createNewWallet')}</h2>
            <p className="modal-subtitle">{t('wallets.createNewWalletDescription')}</p>
            <form onSubmit={handleCreateWallet}>
              <div className="form-group">
                <label htmlFor="walletName">{t('wallets.walletName')}</label>
                <input
                  type="text"
                  id="walletName"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  placeholder={t('wallets.walletNamePlaceholder')}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="walletCurrency">{t('wallets.currency')}</label>
                <select
                  id="walletCurrency"
                  value={newWalletCurrency}
                  onChange={(e) => setNewWalletCurrency(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="EUR">🇪🇺 EUR - Euro</option>
                  <option value="USD">🇺🇸 USD - US Dollar</option>
                  <option value="GBP">🇬🇧 GBP - British Pound</option>
                  <option value="BRL">🇧🇷 BRL - Brazilian Real</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('common.creating') : t('wallets.createWallet')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};
