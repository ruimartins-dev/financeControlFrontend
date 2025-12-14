import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getJson, postJson, deleteJson, ApiError } from '../lib/api';
import { Toast, useToast } from '../components/Toast';
import { Dropdown, type DropdownOption } from '../components/Dropdown';
import type { TransactionDto, CreateTransactionDto, TransactionType, WalletDto, CategoryDto, SubcategoryDto } from '../types/dtos';

// Mapeamento de nomes de categorias padrão para chaves de tradução
const categoryNameToKey: Record<string, string> = {
  'Bills & Utilities': 'billsUtilities',
  'Education': 'education',
  'Entertainment': 'entertainment',
  'Food & Dining': 'foodDining',
  'Freelance': 'freelance',
  'Gifts Received': 'giftsReceived',
};

// Mapeamento de nomes de subcategorias padrão para chaves de tradução
const subcategoryNameToKey: Record<string, string> = {
  'Electricity': 'electricity',
  'General': 'general',
  'Internet': 'internet',
  'Phone': 'phone',
  'Rent/Mortgage': 'rentMortgage',
  'Water': 'water',
  'Books': 'books',
  'Courses': 'courses',
  'School Supplies': 'schoolSupplies',
  'Tuition': 'tuition',
  'Concerts': 'concerts',
  'Games': 'games',
  'Movies': 'movies',
  'Sports': 'sports',
  'Subscriptions': 'subscriptions',
  'Coffee': 'coffee',
  'Delivery': 'delivery',
  'Fast Food': 'fastFood',
  'Groceries': 'groceries',
  'Restaurants': 'restaurants',
  'Consulting': 'consulting',
  'Gigs': 'gigs',
  'Projects': 'projects',
  'Birthday': 'birthday',
  'Holiday': 'holiday',
};

/**
 * Wallet Detail Page Component
 * Shows transactions for a specific wallet with filtering and creation
 */
export const WalletDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  /**
   * Traduz o nome da categoria se for uma categoria padrão (sem userId)
   */
  const translateCategoryName = (category: CategoryDto): string => {
    if (category.userId) {
      return category.name;
    }
    const key = categoryNameToKey[category.name];
    if (key) {
      return t(`defaultCategories.${key}`);
    }
    return category.name;
  };

  /**
   * Traduz o nome da categoria pelo nome (para transações)
   */
  const translateCategoryNameByString = (categoryName: string): string => {
    const key = categoryNameToKey[categoryName];
    if (key) {
      return t(`defaultCategories.${key}`);
    }
    return categoryName;
  };

  /**
   * Traduz o nome da subcategoria se pertencer a uma categoria padrão (sem userId)
   */
  const translateSubcategoryName = (subcategory: SubcategoryDto, category: CategoryDto): string => {
    if (category.userId) {
      return subcategory.name;
    }
    const key = subcategoryNameToKey[subcategory.name];
    if (key) {
      return t(`defaultSubcategories.${key}`);
    }
    return subcategory.name;
  };

  /**
   * Traduz o nome da subcategoria pelo nome (para transações)
   */
  const translateSubcategoryNameByString = (subcategoryName: string): string => {
    const key = subcategoryNameToKey[subcategoryName];
    if (key) {
      return t(`defaultSubcategories.${key}`);
    }
    return subcategoryName;
  };

  // State
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categories state
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Filter state
  const [filterType, setFilterType] = useState<TransactionType | ''>('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  // New transaction form state
  const [newType, setNewType] = useState<TransactionType>('DEBIT');
  const [newCategoryId, setNewCategoryId] = useState<number | ''>('');
  const [newSubcategoryId, setNewSubcategoryId] = useState<number | ''>('');
  const [newAmount, setNewAmount] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  // Create category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Create subcategory modal state
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [subcategoryCategoryId, setSubcategoryCategoryId] = useState<number | ''>('');
  const [isCreatingSubcategory, setIsCreatingSubcategory] = useState(false);

  // Hooks
  const [toast, showToast, hideToast] = useToast();

  /**
   * Get filtered categories based on transaction type
   */
  const filteredCategories = categories.filter(cat => cat.type === newType);

  /**
   * Get subcategories for selected category
   */
  const selectedCategory = categories.find(cat => cat.id === newCategoryId);
  const availableSubcategories = selectedCategory?.subcategories || [];

  /**
   * Fetch categories from API
   */
  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const data = await getJson<CategoryDto[]>('/api/categories');
      setCategories(data);
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(`Failed to load categories: ${error.message}`, 'error');
      } else {
        showToast('Failed to load categories', 'error');
      }
    } finally {
      setIsLoadingCategories(false);
    }
  }, [showToast]);

  /**
   * Fetch wallet details
   */
  const fetchWallet = useCallback(async () => {
    try {
      const data = await getJson<WalletDto>(`/api/wallets/${id}`);
      setWallet(data);
    } catch (error) {
      if (error instanceof ApiError) {
        // Redirect to dashboard if user doesn't have access (403) or wallet doesn't exist (404)
        if (error.status === 403 || error.status === 404) {
          navigate('/dashboard');
          return;
        }
        showToast(error.message, 'error');
      } else {
        showToast('Failed to load wallet', 'error');
      }
    }
  }, [id, showToast, navigate]);

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
        // Redirect to dashboard if user doesn't have access (403) or wallet doesn't exist (404)
        if (error.status === 403 || error.status === 404) {
          navigate('/dashboard');
          return;
        }
        showToast(error.message, 'error');
      } else {
        showToast('Failed to load transactions', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, filterType, filterFromDate, filterToDate, showToast, navigate]);

  // Load data on mount and when filters change
  useEffect(() => {
    if (id) {
      fetchWallet();
      fetchTransactions();
      fetchCategories();
    }
  }, [id, fetchWallet, fetchTransactions, fetchCategories]);

  // Reset category and subcategory when transaction type changes
  useEffect(() => {
    setNewCategoryId('');
    setNewSubcategoryId('');
  }, [newType]);

  // Reset subcategory when category changes
  useEffect(() => {
    setNewSubcategoryId('');
  }, [newCategoryId]);

  /**
   * Handle create transaction form submission
   */
  const handleCreateTransaction = async (e: FormEvent) => {
    e.preventDefault();

    if (!newCategoryId) {
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

    const category = categories.find(c => c.id === newCategoryId);
    const subcategory = category?.subcategories?.find(s => s.id === newSubcategoryId);

    if (!category) {
      showToast('Invalid category selected', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const transactionData: CreateTransactionDto = {
        type: newType,
        category: category.name,
        subcategory: subcategory?.name || undefined,
        amount: parseFloat(newAmount),
        description: newDescription.trim() || undefined,
        date: newDate,
      };

      const newTransaction = await postJson<TransactionDto>(
        `/api/wallets/${id}/transactions`,
        transactionData
      );

      setTransactions([newTransaction, ...transactions]);
      
      if (wallet) {
        const balanceChange = newType === 'CREDIT' ? parseFloat(newAmount) : -parseFloat(newAmount);
        setWallet({ ...wallet, balance: wallet.balance + balanceChange });
      }

      setShowModal(false);
      setNewType('DEBIT');
      setNewCategoryId('');
      setNewSubcategoryId('');
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
   * Handle create new category
   */
  const handleCreateCategory = async (e: FormEvent) => {
    e.preventDefault();

    if (!newCategoryName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    setIsCreatingCategory(true);

    try {
      const newCategory = await postJson<CategoryDto>('/api/categories', {
        name: newCategoryName.trim(),
        type: newType,
      });

      setCategories([...categories, newCategory]);
      setNewCategoryId(newCategory.id);
      setShowCategoryModal(false);
      setNewCategoryName('');
      showToast('Category created successfully!', 'success');
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to create category', 'error');
      }
    } finally {
      setIsCreatingCategory(false);
    }
  };

  /**
   * Handle create new subcategory
   */
  const handleCreateSubcategory = async (e: FormEvent) => {
    e.preventDefault();

    if (!newSubcategoryName.trim()) {
      showToast('Subcategory name is required', 'error');
      return;
    }

    if (!subcategoryCategoryId) {
      showToast('Please select a category', 'error');
      return;
    }

    setIsCreatingSubcategory(true);

    try {
      const newSubcategory = await postJson<SubcategoryDto>('/api/categories/subcategories', {
        name: newSubcategoryName.trim(),
        categoryId: subcategoryCategoryId,
      });

      setCategories(categories.map(cat => {
        if (cat.id === subcategoryCategoryId) {
          return {
            ...cat,
            subcategories: [...(cat.subcategories || []), newSubcategory],
          };
        }
        return cat;
      }));

      if (subcategoryCategoryId === newCategoryId) {
        setNewSubcategoryId(newSubcategory.id);
      }

      setShowSubcategoryModal(false);
      setNewSubcategoryName('');
      setSubcategoryCategoryId('');
      showToast('Subcategory created successfully!', 'success');
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to create subcategory', 'error');
      }
    } finally {
      setIsCreatingSubcategory(false);
    }
  };

  /**
   * Open subcategory modal with pre-selected category
   */
  const openSubcategoryModal = () => {
    if (newCategoryId) {
      setSubcategoryCategoryId(newCategoryId);
    }
    setShowSubcategoryModal(true);
  };

  const formatCurrency = (amount: number | undefined | null, currency: string = 'EUR'): string => {
    const value = Number(amount) || 0;
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-PT');
  };

  const clearFilters = () => {
    setFilterType('');
    setFilterFromDate('');
    setFilterToDate('');
  };

  if (isLoading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="page wallet-detail-page">
      <Link to="/wallets" className="back-link">{t('wallets.backToWallets')}</Link>

      {wallet && (
        <div className="wallet-header">
          <h1>{wallet.name}</h1>
          <p className="wallet-balance-large">
            {formatCurrency(wallet.balance, wallet.currency)}
          </p>
        </div>
      )}

      <div className="filters-section">
        <h3>{t('transactions.filters')}</h3>
        <div className="filters-row">
          <div className="form-group">
            <label>{t('transactions.type')}</label>
            <Dropdown
              options={[
                { value: '', label: t('common.all'), icon: '📋' },
                { value: 'DEBIT', label: t('transactions.debit'), icon: '📤' },
                { value: 'CREDIT', label: t('transactions.credit'), icon: '📥' },
              ]}
              value={filterType}
              onChange={(val) => setFilterType(val as TransactionType | '')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="filterFromDate">{t('transactions.fromDate')}</label>
            <input
              type="date"
              id="filterFromDate"
              value={filterFromDate}
              onChange={(e) => setFilterFromDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="filterToDate">{t('transactions.toDate')}</label>
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
            {t('transactions.clearFilters')}
          </button>
        </div>
      </div>

      <div className="page-header">
        <h2>{t('transactions.title')}</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          + {t('transactions.newTransaction')}
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <p>{t('transactions.noTransactions')}</p>
          <p>{t('transactions.noTransactionsDescription')}</p>
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
                  <span className="transaction-category">{translateCategoryNameByString(transaction.category)}</span>
                  {transaction.subcategory && (
                    <span className="transaction-subcategory">/ {translateSubcategoryNameByString(transaction.subcategory)}</span>
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
            <h2>{t('transactions.newTransaction')}</h2>
            <form onSubmit={handleCreateTransaction}>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('transactions.type')}</label>
                  <Dropdown
                    options={[
                      { value: 'DEBIT', label: `${t('transactions.debit')} (${t('transactions.expense')})`, icon: '📤' },
                      { value: 'CREDIT', label: `${t('transactions.credit')} (${t('transactions.income')})`, icon: '📥' },
                    ]}
                    value={newType}
                    onChange={(val) => setNewType(val as TransactionType)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="transactionAmount">{t('transactions.amount')} *</label>
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
                  <label>{t('transactions.category')} *</label>
                  <div className="input-with-button">
                    <Dropdown
                      options={filteredCategories.map((category): DropdownOption => ({
                        value: category.id,
                        label: translateCategoryName(category),
                        badge: category.isDefault ? t('categories.default') : undefined,
                      }))}
                      value={newCategoryId}
                      onChange={(val) => setNewCategoryId(val as number)}
                      placeholder={isLoadingCategories ? t('common.loading') : t('transactions.selectCategory')}
                      disabled={isSubmitting || isLoadingCategories}
                      searchable
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowCategoryModal(true)}
                      disabled={isSubmitting}
                      title={t('categories.createCategory')}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('transactions.subcategory')}</label>
                  <div className="input-with-button">
                    <Dropdown
                      options={selectedCategory ? availableSubcategories.map((subcategory): DropdownOption => ({
                        value: subcategory.id,
                        label: translateSubcategoryName(subcategory, selectedCategory),
                      })) : []}
                      value={newSubcategoryId}
                      onChange={(val) => setNewSubcategoryId(val as number)}
                      placeholder={t('transactions.selectSubcategory')}
                      disabled={isSubmitting || !newCategoryId}
                      searchable
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={openSubcategoryModal}
                      disabled={isSubmitting || !newCategoryId}
                      title={t('categories.createSubcategory')}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="transactionDate">{t('transactions.date')} *</label>
                <input
                  type="date"
                  id="transactionDate"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="transactionDescription">{t('transactions.description')}</label>
                <textarea
                  id="transactionDescription"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder={t('transactions.descriptionPlaceholder')}
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
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('transactions.creating') : t('transactions.createTransaction')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('categories.newCategory')}</h2>
            <p className="modal-subtitle">
              {t('transactions.type')}: {newType === 'DEBIT' ? t('transactions.expense') : t('transactions.income')}
            </p>
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label htmlFor="newCategoryName">{t('categories.categoryName')} *</label>
                <input
                  type="text"
                  id="newCategoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={t('categories.categoryNamePlaceholder')}
                  disabled={isCreatingCategory}
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCategoryModal(false)}
                  disabled={isCreatingCategory}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreatingCategory}
                >
                  {isCreatingCategory ? t('categories.creating') : t('categories.createCategory')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Subcategory Modal */}
      {showSubcategoryModal && (
        <div className="modal-overlay" onClick={() => setShowSubcategoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('categories.newSubcategory')}</h2>
            <form onSubmit={handleCreateSubcategory}>
              <div className="form-group">
                <label>{t('transactions.category')} *</label>
                <Dropdown
                  options={filteredCategories.map((category): DropdownOption => ({
                    value: category.id,
                    label: translateCategoryName(category),
                    badge: category.isDefault ? t('categories.default') : undefined,
                  }))}
                  value={subcategoryCategoryId}
                  onChange={(val) => setSubcategoryCategoryId(val as number)}
                  placeholder={t('transactions.selectCategory')}
                  disabled={isCreatingSubcategory}
                  searchable
                />
              </div>
              <div className="form-group">
                <label htmlFor="newSubcategoryName">{t('categories.subcategoryName')} *</label>
                <input
                  type="text"
                  id="newSubcategoryName"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  placeholder={t('categories.subcategoryNamePlaceholder')}
                  disabled={isCreatingSubcategory}
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSubcategoryModal(false)}
                  disabled={isCreatingSubcategory}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreatingSubcategory}
                >
                  {isCreatingSubcategory ? t('categories.creating') : t('categories.createSubcategory')}
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
