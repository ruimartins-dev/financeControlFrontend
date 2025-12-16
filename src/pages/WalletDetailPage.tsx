import React, { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getJson, postJson, deleteJson, postFormData, ApiError } from '../lib/api';
import { Toast, useToast } from '../components/Toast';
import { Dropdown, type DropdownOption } from '../components/Dropdown';
import { TransactionConfirmationModal } from '../components/TransactionConfirmationModal';
import type { TransactionDto, CreateTransactionDto, TransactionType, WalletDto, CategoryDto, SubcategoryDto, ImportResultDto, TransactionDraftDto, SpeechRecognitionType, SpeechRecognitionEventType } from '../types/dtos';

// Mapeamento de nomes de categorias padrão para chaves de tradução
const categoryNameToKey: Record<string, string> = {
  'Food & Dining': 'foodDining',
  'Transportation': 'transportation',
  'Shopping': 'shopping',
  'Bills & Utilities': 'billsUtilities',
  'Entertainment': 'entertainment',
  'Health': 'health',
  'Education': 'education',
  'Other Expenses': 'otherExpenses',
  'Salary': 'salary',
  'Investments': 'investments',
  'Freelance': 'freelance',
  'Gifts Received': 'giftsReceived',
  'Other Income': 'otherIncome',
};

// Mapeamento de nomes de subcategorias padrão para chaves de tradução
const subcategoryNameToKey: Record<string, string> = {
  'Restaurants': 'restaurants',
  'Groceries': 'groceries',
  'Fast Food': 'fastFood',
  'Coffee': 'coffee',
  'Delivery': 'delivery',
  'Fuel': 'fuel',
  'Public Transport': 'publicTransport',
  'Taxi/Uber': 'taxiUber',
  'Parking': 'parking',
  'Car Maintenance': 'carMaintenance',
  'Clothing': 'clothing',
  'Electronics': 'electronics',
  'Home & Garden': 'homeGarden',
  'Personal Care': 'personalCare',
  'Gifts': 'gifts',
  'Electricity': 'electricity',
  'Water': 'water',
  'Internet': 'internet',
  'Phone': 'phone',
  'Rent/Mortgage': 'rentMortgage',
  'Movies': 'movies',
  'Games': 'games',
  'Concerts': 'concerts',
  'Sports': 'sports',
  'Subscriptions': 'subscriptions',
  'Medical': 'medical',
  'Pharmacy': 'pharmacy',
  'Gym': 'gym',
  'Insurance': 'insurance',
  'Courses': 'courses',
  'Books': 'books',
  'School Supplies': 'schoolSupplies',
  'Tuition': 'tuition',
  'Miscellaneous': 'miscellaneous',
  'Fees': 'fees',
  'Donations': 'donations',
  'Monthly Salary': 'monthlySalary',
  'Bonus': 'bonus',
  'Overtime': 'overtime',
  'Commission': 'commission',
  'Dividends': 'dividends',
  'Interest': 'interest',
  'Capital Gains': 'capitalGains',
  'Rental Income': 'rentalIncome',
  'Consulting': 'consulting',
  'Projects': 'projects',
  'Gigs': 'gigs',
  'Birthday': 'birthday',
  'Holiday': 'holiday',
  'Other': 'other',
  'Refunds': 'refunds',
  'Cashback': 'cashback',
  'Reimbursements': 'reimbursements',
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
  const [showFilters, setShowFilters] = useState(false);

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

  // Quick Add (Text/Voice) state
  const [quickAddText, setQuickAddText] = useState('');
  const [isParsingText, setIsParsingText] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  // CSV Import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Transaction draft confirmation state (two-step flow)
  const [transactionDraft, setTransactionDraft] = useState<TransactionDraftDto | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isConfirmingTransaction, setIsConfirmingTransaction] = useState(false);

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

  // Auto-select first category when transaction type changes
  useEffect(() => {
    const categoriesForType = categories.filter(cat => cat.type === newType);
    if (categoriesForType.length > 0) {
      setNewCategoryId(categoriesForType[0].id);
    } else {
      setNewCategoryId('');
    }
  }, [newType, categories]);

  // Auto-select first subcategory when category changes
  useEffect(() => {
    const category = categories.find(cat => cat.id === newCategoryId);
    if (category?.subcategories && category.subcategories.length > 0) {
      setNewSubcategoryId(category.subcategories[0].id);
    } else {
      setNewSubcategoryId('');
    }
  }, [newCategoryId, categories]);

  // Check if Web Speech API is supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRecognition);
  }, []);

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

  /**
   * Handle Quick Add from text - sends text to backend for classification (Step 1)
   * Returns a draft that user can review before saving
   */
  const handleQuickAddFromText = async () => {
    if (!quickAddText.trim()) {
      showToast(t('transactions.parseError'), 'error');
      return;
    }

    setIsParsingText(true);

    try {
      // Send text to backend for classification - returns a draft, not a saved transaction
      const draft = await postJson<TransactionDraftDto>('/api/voice/classify', {
        walletId: Number(id),
        text: quickAddText.trim(),
      });

      // Store the draft and open confirmation modal
      setTransactionDraft(draft);
      setShowConfirmationModal(true);
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast(t('transactions.parseError'), 'error');
      }
    } finally {
      setIsParsingText(false);
    }
  };

  /**
   * Handle confirmation of transaction draft (Step 2)
   * Saves the edited transaction to the backend
   */
  const handleConfirmTransaction = async (editedData: TransactionDraftDto) => {
    setIsConfirmingTransaction(true);

    try {
      // Send the edited data to create the transaction
      const transactionData: CreateTransactionDto = {
        type: editedData.type,
        category: editedData.category,
        subcategory: editedData.subcategory,
        amount: editedData.amount,
        description: editedData.description,
        date: editedData.date,
      };

      const newTransaction = await postJson<TransactionDto>(
        `/api/wallets/${id}/transactions`,
        transactionData
      );

      // Add new transaction to the list
      setTransactions([newTransaction, ...transactions]);

      // Close modal and clear state
      setShowConfirmationModal(false);
      setTransactionDraft(null);
      setQuickAddText('');

      showToast(t('transactions.parseSuccess'), 'success');
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast(t('transactions.createError'), 'error');
      }
    } finally {
      setIsConfirmingTransaction(false);
    }
  };

  /**
   * Handle cancellation of transaction confirmation
   */
  const handleCancelConfirmation = () => {
    setShowConfirmationModal(false);
    setTransactionDraft(null);
  };

  /**
   * Start voice recognition using Web Speech API
   */
  const startVoiceRecognition = () => {
    // Check if Speech Recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      showToast(t('transactions.voiceNotSupported'), 'error');
      return;
    }

    // Create new recognition instance
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-PT'; // Portuguese language
    recognition.continuous = false;
    recognition.interimResults = false;

    // Handle successful recognition
    recognition.onresult = (event: SpeechRecognitionEventType) => {
      const transcript = event.results[0][0].transcript;
      setQuickAddText(transcript);
      setIsListening(false);
    };

    // Handle errors
    recognition.onerror = () => {
      setIsListening(false);
      showToast(t('transactions.voiceNotSupported'), 'error');
    };

    // Handle end of recognition
    recognition.onend = () => {
      setIsListening(false);
    };

    // Store reference and start
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  /**
   * Stop voice recognition
   */
  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  /**
   * Handle file selection for CSV import
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        showToast(t('transactions.invalidFileType'), 'error');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  /**
   * Handle CSV import - uploads file to backend
   */
  const handleCsvImport = async () => {
    if (!selectedFile) {
      showToast(t('transactions.noFileSelected'), 'error');
      return;
    }

    setIsImporting(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Send to backend
      const result = await postFormData<ImportResultDto>(
        `/api/wallets/${id}/import`,
        formData
      );

      // Refresh transactions list
      await fetchTransactions();

      // Clear file selection
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Show success message with details
      showToast(
        t('transactions.importSuccess', { created: result.created, skipped: result.skipped }),
        'success'
      );
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast(t('transactions.importError'), 'error');
      }
    } finally {
      setIsImporting(false);
    }
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

  const hasActiveFilters = filterType !== '' || filterFromDate !== '' || filterToDate !== '';

  if (isLoading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="page wallet-detail-page">
      <Link to="/wallets" className="back-link">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {t('wallets.backToWallets')}
      </Link>

      {wallet && (
        <div className="wallet-header">
          <div className="wallet-header-content">
            <div className="wallet-header-info">
              <h1>{wallet.name}</h1>
              <span className="wallet-currency-badge">{wallet.currency}</span>
            </div>
            <p className="wallet-balance-large">
              {formatCurrency(
                transactions.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + (Number(t.amount) || 0), 0) -
                transactions.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
                wallet.currency
              )}
            </p>
          </div>
        </div>
      )}

      {/* Quick Add and Import Section */}
      <div className="quick-tools-section">
        {/* Quick Add (Text/Voice) */}
        <div className="quick-tool-card">
          <div className="quick-tool-header">
            <h3>✨ {t('transactions.quickAdd')}</h3>
            <p className="quick-tool-description">{t('transactions.quickAddDescription')}</p>
          </div>
          <div className="quick-tool-content">
            <div className="quick-add-input-group">
              <textarea
                value={quickAddText}
                onChange={(e) => setQuickAddText(e.target.value)}
                placeholder={t('transactions.textPlaceholder')}
                disabled={isParsingText}
                rows={2}
                className="quick-add-textarea"
              />
              <div className="quick-add-actions">
                {/* Voice Button - only shown if supported */}
                {voiceSupported && (
                  <button
                    type="button"
                    className={`btn-voice ${isListening ? 'listening' : ''}`}
                    onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                    disabled={isParsingText}
                    title={isListening ? t('transactions.stopVoice') : t('transactions.startVoice')}
                  >
                    {isListening ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <rect x="6" y="6" width="8" height="8" rx="1" fill="currentColor"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 2C8.89543 2 8 2.89543 8 4V10C8 11.1046 8.89543 12 10 12C11.1046 12 12 11.1046 12 10V4C12 2.89543 11.1046 2 10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M15 9V10C15 12.7614 12.7614 15 10 15C7.23858 15 5 12.7614 5 10V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 15V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {isListening && <span className="listening-indicator"></span>}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleQuickAddFromText}
                  disabled={isParsingText || !quickAddText.trim()}
                >
                  {isParsingText ? (
                    <>
                      <span className="spinner-small"></span>
                      {t('transactions.parsing')}
                    </>
                  ) : (
                    t('transactions.addFromText')
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CSV Import */}
        <div className="quick-tool-card">
          <div className="quick-tool-header">
            <h3>📄 {t('transactions.importCsv')}</h3>
            <p className="quick-tool-description">{t('transactions.importCsvDescription')}</p>
          </div>
          <div className="quick-tool-content">
            <div className="csv-import-group">
              <div className="file-input-wrapper">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileSelect}
                  disabled={isImporting}
                  id="csvFileInput"
                  className="file-input-hidden"
                />
                <label htmlFor="csvFileInput" className="file-input-label">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M17 12V15C17 15.5304 16.7893 16.0391 16.4142 16.4142C16.0391 16.7893 15.5304 17 15 17H5C4.46957 17 3.96086 16.7893 3.58579 16.4142C3.21071 16.0391 3 15.5304 3 15V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 6L10 2L6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 2V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {selectedFile ? selectedFile.name : t('transactions.selectFile')}
                </label>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCsvImport}
                disabled={isImporting || !selectedFile}
              >
                {isImporting ? (
                  <>
                    <span className="spinner-small"></span>
                    {t('transactions.importing')}
                  </>
                ) : (
                  t('transactions.import')
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="transactions-section">
        <div className="section-toolbar">
          <div className="toolbar-left">
            <h2>{t('transactions.title')}</h2>
            <span className="transactions-count">{transactions.length}</span>
          </div>
          <div className="toolbar-right">
            <button
              type="button"
              className={`btn-filter ${showFilters ? 'active' : ''} ${hasActiveFilters ? 'has-filters' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4H14M4 8H12M6 12H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {t('transactions.filters')}
              {hasActiveFilters && <span className="filter-badge"></span>}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {t('transactions.newTransaction')}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <div className="filter-item">
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

              <div className="filter-item">
                <label htmlFor="filterFromDate">{t('transactions.fromDate')}</label>
                <input
                  type="date"
                  id="filterFromDate"
                  value={filterFromDate}
                  onChange={(e) => setFilterFromDate(e.target.value)}
                />
              </div>

              <div className="filter-item">
                <label htmlFor="filterToDate">{t('transactions.toDate')}</label>
                <input
                  type="date"
                  id="filterToDate"
                  value={filterToDate}
                  onChange={(e) => setFilterToDate(e.target.value)}
                />
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn-clear-filters"
                  onClick={clearFilters}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {t('transactions.clearFilters')}
                </button>
              )}
            </div>
          </div>
        )}

        {transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3>{t('transactions.noTransactions')}</h3>
            <p>{t('transactions.noTransactionsDescription')}</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + {t('transactions.newTransaction')}
            </button>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`transaction-item ${transaction.type.toLowerCase()}`}
              >
                <div className="transaction-icon-wrapper">
                  <div className={`transaction-type-icon ${transaction.type.toLowerCase()}`}>
                    {transaction.type === 'CREDIT' ? '↓' : '↑'}
                  </div>
                </div>
                <div className="transaction-info">
                  <div className="transaction-main">
                    <span className="transaction-category">{translateCategoryNameByString(transaction.category)}</span>
                    {transaction.subcategory && (
                      <span className="transaction-subcategory">• {translateSubcategoryNameByString(transaction.subcategory)}</span>
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
                    className="btn-icon-action btn-icon-delete"
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    title={t('common.delete')}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.75 5.25H14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7.5 8.25V12.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10.5 8.25V12.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4.5 5.25L5.25 14.25C5.25 14.6478 5.40804 15.0294 5.68934 15.3107C5.97064 15.592 6.35218 15.75 6.75 15.75H11.25C11.6478 15.75 12.0294 15.592 12.3107 15.3107C12.592 15.0294 12.75 14.6478 12.75 14.25L13.5 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7.5 5.25V3C7.5 2.80109 7.57902 2.61032 7.71967 2.46967C7.86032 2.32902 8.05109 2.25 8.25 2.25H9.75C9.94891 2.25 10.1397 2.32902 10.2803 2.46967C10.421 2.61032 10.5 2.80109 10.5 3V5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

      {showConfirmationModal && transactionDraft && (
        <TransactionConfirmationModal
          draft={transactionDraft}
          categories={categories}
          onConfirm={handleConfirmTransaction}
          onCancel={handleCancelConfirmation}
          isConfirming={isConfirmingTransaction}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};
