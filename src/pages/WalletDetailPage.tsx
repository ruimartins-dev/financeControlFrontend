import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getJson, postJson, deleteJson, ApiError } from '../lib/api';
import { Toast, useToast } from '../components/Toast';
import type { TransactionDto, CreateTransactionDto, TransactionType, WalletDto } from '../types/dtos';

/**
 * Wallet Detail Page Component
 * Shows transactions for a specific wallet with filtering and creation
 */
export const WalletDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // State
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [filterType, setFilterType] = useState<TransactionType | ''>('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  // New transaction form state
  const [newType, setNewType] = useState<TransactionType>('DEBIT');
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  // Hooks
  const [toast, showToast, hideToast] = useToast();

  /**
   * Fetch wallet details
   */
  const fetchWallet = useCallback(async () => {
    try {
      const data = await getJson<WalletDto>(`/api/wallets/${id}`);
      setWallet(data);
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to load wallet', 'error');
      }
    }
  }, [id, showToast]);

  /**
   * Fetch transactions from API
   */
  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterFromDate) params.append('fromDate', filterFromDate);
      if (filterToDate) params.append('toDate', filterToDate);
      const queryString = params.toString();
      const path = `/api/wallets/${id}/transactions${queryString ? `?${queryString}` : ''}`;
      
      const data = await getJson<TransactionDto[]>(path);
      setTransactions(data);
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to load transactions', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, filterType, filterFromDate, filterToDate, showToast]);

  // Load data on mount and when filters change
  useEffect(() => {
    if (id) {
      fetchWallet();
      fetchTransactions();
    }
  }, [id, fetchWallet, fetchTransactions]);

  /**
   * Handle create transaction form submission
   */
  const handleCreateTransaction = async (e: FormEvent) => {
    e.preventDefault();

    if (!newCategory.trim()) {
      showToast('Category is required', 'error');
      return;
    }
    if (!newAmount || parseFloat(newAmount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    if (!newDate) {
      showToast('Date is required', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const transactionData: CreateTransactionDto = {
        type: newType,
        category: newCategory.trim(),
        subcategory: newSubcategory.trim() || undefined,
        amount: parseFloat(newAmount),
        description: newDescription.trim() || undefined,
        date: newDate,
      };

      const newTransaction = await postJson<TransactionDto>(
        `/api/wallets/${id}/transactions`,
        transactionData
      );

      setTransactions([newTransaction, ...transactions]);
      
      // Update wallet balance
      if (wallet) {
        const balanceChange = newType === 'CREDIT' ? parseFloat(newAmount) : -parseFloat(newAmount);
        setWallet({ ...wallet, balance: wallet.balance + balanceChange });
      }

      // Reset form
      setShowModal(false);
      setNewType('DEBIT');
      setNewCategory('');
      setNewSubcategory('');
      setNewAmount('');
      setNewDescription('');
      setNewDate(new Date().toISOString().split('T')[0]);
      
      showToast('Transaction created successfully!', 'success');
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to create transaction', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle delete transaction
   */
  const handleDeleteTransaction = async (transactionId: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await deleteJson(`/api/transactions/${transactionId}`);
      
      // Find the deleted transaction to update balance
      const deletedTransaction = transactions.find(t => t.id === transactionId);
      if (deletedTransaction && wallet) {
        const balanceChange = deletedTransaction.type === 'CREDIT' 
          ? -deletedTransaction.amount 
          : deletedTransaction.amount;
        setWallet({ ...wallet, balance: wallet.balance + balanceChange });
      }

      setTransactions(transactions.filter(t => t.id !== transactionId));
      showToast('Transaction deleted successfully!', 'success');
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to delete transaction', 'error');
      }
    }
  };

  /**
   * Format currency value
   */
  const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
    if (isNaN(amount)) {
        amount = 0;
    }
    
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilterType('');
    setFilterFromDate('');
    setFilterToDate('');
  };

  if (isLoading) {
    return <div className="loading">Loading transactions...</div>;
  }

  return (
    <div className="page wallet-detail-page">
      {/* Back link and header */}
      <Link to="/wallets" className="back-link">← Back to Wallets</Link>

      {wallet && (
        <div className="wallet-header">
          <h1>{wallet.name}</h1>
          <p className="wallet-balance-large">
            {formatCurrency(wallet.balance, wallet.currency)}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-row">
          <div className="form-group">
            <label htmlFor="filterType">Type</label>
            <select
              id="filterType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as TransactionType | '')}
            >
              <option value="">All</option>
              <option value="DEBIT">Debit</option>
              <option value="CREDIT">Credit</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="filterFromDate">From Date</label>
            <input
              type="date"
              id="filterFromDate"
              value={filterFromDate}
              onChange={(e) => setFilterFromDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="filterToDate">To Date</label>
            <input
              type="date"
              id="filterToDate"
              value={filterToDate}
              onChange={(e) => setFilterToDate(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Transactions header */}
      <div className="page-header">
        <h2>Transactions</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          + New Transaction
        </button>
      </div>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions found.</p>
          <p>Create your first transaction to start tracking!</p>
        </div>
      ) : (
        <div className="transactions-list">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className={`transaction-item ${transaction.type.toLowerCase()}`}
            >
              <div className="transaction-info">
                <div className="transaction-main">
                  <span className={`transaction-type ${transaction.type.toLowerCase()}`}>
                    {transaction.type === 'CREDIT' ? '+' : '-'}
                  </span>
                  <span className="transaction-category">{transaction.category}</span>
                  {transaction.subcategory && (
                    <span className="transaction-subcategory">/ {transaction.subcategory}</span>
                  )}
                </div>
                {transaction.description && (
                  <p className="transaction-description">{transaction.description}</p>
                )}
                <span className="transaction-date">{formatDate(transaction.date)}</span>
              </div>
              <div className="transaction-actions">
                <span className={`transaction-amount ${transaction.type.toLowerCase()}`}>
                  {transaction.type === 'CREDIT' ? '+' : '-'}
                  {formatCurrency(transaction.amount, wallet?.currency)}
                </span>
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => handleDeleteTransaction(transaction.id)}
                  title="Delete transaction"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Transaction Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <h2>New Transaction</h2>
            <form onSubmit={handleCreateTransaction}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="transactionType">Type</label>
                  <select
                    id="transactionType"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as TransactionType)}
                    disabled={isSubmitting}
                  >
                    <option value="DEBIT">Debit (Expense)</option>
                    <option value="CREDIT">Credit (Income)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="transactionAmount">Amount</label>
                  <input
                    type="number"
                    id="transactionAmount"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="transactionCategory">Category *</label>
                  <input
                    type="text"
                    id="transactionCategory"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g., Food, Transport, Salary"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="transactionSubcategory">Subcategory</label>
                  <input
                    type="text"
                    id="transactionSubcategory"
                    value={newSubcategory}
                    onChange={(e) => setNewSubcategory(e.target.value)}
                    placeholder="e.g., Restaurant, Uber"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="transactionDate">Date *</label>
                <input
                  type="date"
                  id="transactionDate"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="transactionDescription">Description</label>
                <textarea
                  id="transactionDescription"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Optional description..."
                  disabled={isSubmitting}
                  rows={2}
                />
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
                  {isSubmitting ? 'Creating...' : 'Create Transaction'}
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
