import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getJson, ApiError } from '../lib/api';
import { Toast, useToast } from '../components/Toast';
import type { WalletDto, TransactionDto } from '../types/dtos';

// Mapeamento de nomes de categorias padrão para chaves de tradução
const categoryNameToKey: Record<string, string> = {
  'Bills & Utilities': 'billsUtilities',
  'Education': 'education',
  'Entertainment': 'entertainment',
  'Food & Dining': 'foodDining',
  'Freelance': 'freelance',
  'Gifts Received': 'giftsReceived',
};

// Wallet with calculated balance
interface WalletWithBalance extends WalletDto {
  calculatedBalance: number;
}

/**
 * Dashboard Page Component
 * Overview of financial status with key metrics
 */
export const DashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, showToast, hideToast] = useToast();

  /**
   * Traduz o nome da categoria se for uma categoria padrão
   */
  const translateCategoryName = useCallback((categoryName: string): string => {
    const key = categoryNameToKey[categoryName];
    if (key) {
      return t(`defaultCategories.${key}`);
    }
    return categoryName;
  }, [t]);

  const fetchData = useCallback(async () => {
    try {
      const walletsData = await getJson<WalletDto[]>('/api/wallets');
      
      // Fetch transactions for each wallet to calculate balance
      const walletsWithBalance: WalletWithBalance[] = [];
      const allTransactions: TransactionDto[] = [];
      
      for (const wallet of walletsData) {
        try {
          const transactions = await getJson<TransactionDto[]>(`/api/wallets/${wallet.id}/transactions`);
          const income = transactions
            .filter(t => t.type === 'CREDIT')
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
          const expenses = transactions
            .filter(t => t.type === 'DEBIT')
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
          const calculatedBalance = income - expenses;
          
          walletsWithBalance.push({ ...wallet, calculatedBalance });
          allTransactions.push(...transactions);
        } catch {
          walletsWithBalance.push({ ...wallet, calculatedBalance: 0 });
        }
      }
      
      setWallets(walletsWithBalance);
      
      // Sort by date and take most recent
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentTransactions(allTransactions.slice(0, 5));
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast(t('errors.failedToLoad', { item: 'dashboard' }), 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalIncome = recentTransactions
    .filter(t => t.type === 'CREDIT')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalExpenses = recentTransactions
    .filter(t => t.type === 'DEBIT')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const formatCurrency = (amount: number | undefined | null, currency: string = 'EUR'): string => {
    const value = Number(amount) || 0;
    const locale = i18n.language === 'pt' ? 'pt-PT' : 'en-GB';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    const locale = i18n.language === 'pt' ? 'pt-PT' : 'en-GB';
    return new Date(dateString).toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
    });
  };

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>{t('dashboard.title')}</h1>
          <p className="page-subtitle">{t('dashboard.subtitle')}</p>
        </div>
        <Link to="/wallets" className="btn btn-primary">
          <span className="btn-icon">+</span>
          {t('transactions.newTransaction')}
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total-balance">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <span className="stat-label">{t('dashboard.totalBalance')}</span>
            <span className="stat-value">{formatCurrency(totalIncome - totalExpenses)}</span>
            <span className="stat-change positive">
              <span>↑</span> {t('wallets.title')}
            </span>
          </div>
        </div>

        <div className="stat-card income">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <span className="stat-label">{t('dashboard.monthlyIncome')}</span>
            <span className="stat-value">{formatCurrency(totalIncome)}</span>
            <span className="stat-change positive">
              <span>↑</span> {t('dashboard.recentTransactions')}
            </span>
          </div>
        </div>

        <div className="stat-card expenses">
          <div className="stat-icon">📉</div>
          <div className="stat-content">
            <span className="stat-label">{t('dashboard.monthlyExpenses')}</span>
            <span className="stat-value">{formatCurrency(totalExpenses)}</span>
            <span className="stat-change negative">
              <span>↓</span> {t('dashboard.recentTransactions')}
            </span>
          </div>
        </div>

        <div className="stat-card wallets">
          <div className="stat-icon">👛</div>
          <div className="stat-content">
            <span className="stat-label">{t('wallets.title')}</span>
            <span className="stat-value">{wallets.length}</span>
            <span className="stat-change neutral">
              <span>•</span> {t('dashboard.walletsOverview')}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Wallets Section */}
        <div className="dashboard-section wallets-section">
          <div className="section-header">
            <h2>{t('wallets.title')}</h2>
            <Link to="/wallets" className="section-link">{t('dashboard.viewAll')} →</Link>
          </div>
          <div className="wallets-list">
            {wallets.length === 0 ? (
              <div className="empty-state-small">
                <p>{t('dashboard.noWallets')}</p>
                <Link to="/wallets" className="btn btn-secondary btn-sm">{t('wallets.createWallet')}</Link>
              </div>
            ) : (
              wallets.slice(0, 4).map((wallet) => (
                <Link to={`/wallets/${wallet.id}`} key={wallet.id} className="wallet-item">
                  <div className="wallet-item-icon">
                    {wallet.currency === 'EUR' ? '€' : wallet.currency === 'USD' ? '$' : '£'}
                  </div>
                  <div className="wallet-item-info">
                    <span className="wallet-item-name">{wallet.name}</span>
                    <span className="wallet-item-currency">{wallet.currency}</span>
                  </div>
                  <span className={`wallet-item-balance ${(wallet.calculatedBalance || 0) >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(wallet.calculatedBalance, wallet.currency)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="dashboard-section transactions-section">
          <div className="section-header">
            <h2>{t('dashboard.recentTransactions')}</h2>
            <Link to="/transactions" className="section-link">{t('dashboard.viewAll')} →</Link>
          </div>
          <div className="transactions-list-compact">
            {recentTransactions.length === 0 ? (
              <div className="empty-state-small">
                <p>{t('dashboard.noTransactions')}</p>
                <Link to="/wallets" className="btn btn-secondary btn-sm">{t('dashboard.addTransaction')}</Link>
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item-compact">
                  <div className={`transaction-icon ${transaction.type.toLowerCase()}`}>
                    {transaction.type === 'CREDIT' ? '↓' : '↑'}
                  </div>
                  <div className="transaction-details">
                    <span className="transaction-category">{translateCategoryName(transaction.category)}</span>
                    <span className="transaction-date">{formatDate(transaction.date)}</span>
                  </div>
                  <span className={`transaction-amount ${transaction.type.toLowerCase()}`}>
                    {transaction.type === 'CREDIT' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>{t('dashboard.quickActions')}</h3>
        <div className="quick-actions-grid">
          <Link to="/wallets" className="quick-action-card">
            <span className="quick-action-icon">➕</span>
            <span className="quick-action-label">{t('dashboard.addTransaction')}</span>
          </Link>
          <Link to="/wallets" className="quick-action-card">
            <span className="quick-action-icon">👛</span>
            <span className="quick-action-label">{t('dashboard.addWallet')}</span>
          </Link>
          <Link to="/categories" className="quick-action-card">
            <span className="quick-action-icon">🏷️</span>
            <span className="quick-action-label">{t('dashboard.manageCategories')}</span>
          </Link>
          <Link to="/reports" className="quick-action-card">
            <span className="quick-action-icon">📊</span>
            <span className="quick-action-label">{t('dashboard.viewReports')}</span>
          </Link>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};
