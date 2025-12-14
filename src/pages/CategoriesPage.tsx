import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { getJson, postJson, deleteJson, ApiError } from '../lib/api';
import { Toast, useToast } from '../components/Toast';
import type { CategoryDto, SubcategoryDto, TransactionType } from '../types/dtos';

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
 * Categories Page Component
 * Allows users to view, create, and delete categories and subcategories
 */
export const CategoriesPage: React.FC = () => {
  const { t } = useTranslation();

  /**
   * Traduz o nome da categoria se for uma categoria padrão (sem userId)
   */
  const translateCategoryName = (category: CategoryDto): string => {
    if (category.userId) {
      // Categoria do utilizador - não traduzir
      return category.name;
    }
    // Categoria padrão - traduzir se existir a chave
    const key = categoryNameToKey[category.name];
    if (key) {
      return t(`defaultCategories.${key}`);
    }
    return category.name;
  };

  /**
   * Traduz o nome da subcategoria se pertencer a uma categoria padrão (sem userId)
   */
  const translateSubcategoryName = (subcategory: SubcategoryDto, category: CategoryDto): string => {
    if (category.userId) {
      // Subcategoria de categoria do utilizador - não traduzir
      return subcategory.name;
    }
    // Subcategoria padrão - traduzir se existir a chave
    const key = subcategoryNameToKey[subcategory.name];
    if (key) {
      return t(`defaultSubcategories.${key}`);
    }
    return subcategory.name;
  };

  // State
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  // Hidden items state
  const [showHiddenSection, setShowHiddenSection] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState<CategoryDto[]>([]);
  const [hiddenSubcategories, setHiddenSubcategories] = useState<SubcategoryDto[]>([]);
  const [isLoadingHidden, setIsLoadingHidden] = useState(false);

  // Modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [filterType, setFilterType] = useState<TransactionType | ''>('');

  // New category form state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<TransactionType>('DEBIT');

  // New subcategory form state
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');

  // Hooks
  const [toast, showToast, hideToast] = useToast();

  /**
   * Fetch categories from API
   */
  const fetchCategories = useCallback(async () => {
    try {
      const params = filterType ? `?type=${filterType}` : '';
      const data = await getJson<CategoryDto[]>(`/api/categories${params}`);
      setCategories(data);
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast(t('categories.loadError'), 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [filterType, showToast, t]);

  /**
   * Fetch hidden categories and subcategories from API
   */
  const fetchHiddenItems = useCallback(async () => {
    setIsLoadingHidden(true);
    try {
      const [hiddenCats, hiddenSubs] = await Promise.all([
        getJson<CategoryDto[]>('/api/categories/hidden'),
        getJson<SubcategoryDto[]>('/api/categories/subcategories/hidden'),
      ]);
      setHiddenCategories(hiddenCats);
      setHiddenSubcategories(hiddenSubs);
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast(t('categories.loadError'), 'error');
      }
    } finally {
      setIsLoadingHidden(false);
    }
  }, [showToast, t]);

  /**
   * Toggle hidden section visibility
   */
  const toggleHiddenSection = () => {
    const newState = !showHiddenSection;
    setShowHiddenSection(newState);
    if (newState) {
      fetchHiddenItems();
    }
  };

  /**
   * Restore a hidden category
   */
  const handleRestoreCategory = async (categoryId: number) => {
    try {
      await postJson(`/api/categories/${categoryId}/restore`);
      // Remove from hidden list
      setHiddenCategories(hiddenCategories.filter(c => c.id !== categoryId));
      // Refresh main categories list
      fetchCategories();
      showToast(t('categories.restoreSuccess'), 'success');
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast(t('categories.restoreError'), 'error');
      }
    }
  };

  /**
   * Restore a hidden subcategory
   */
  const handleRestoreSubcategory = async (subcategoryId: number) => {
    try {
      await postJson(`/api/categories/subcategories/${subcategoryId}/restore`);
      // Remove from hidden list
      setHiddenSubcategories(hiddenSubcategories.filter(s => s.id !== subcategoryId));
      // Refresh main categories list to show restored subcategory
      fetchCategories();
      showToast(t('categories.restoreSuccess'), 'success');
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast(t('categories.restoreError'), 'error');
      }
    }
  };

  // Load categories on mount and when filter changes
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /**
   * Toggle category expansion to show/hide subcategories
   */
  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  /**
   * Handle create category form submission
   */
  const handleCreateCategory = async (e: FormEvent) => {
    e.preventDefault();

    if (!newCategoryName.trim()) {
      showToast(t('categories.nameRequired'), 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const newCategory = await postJson<CategoryDto>('/api/categories', {
        name: newCategoryName.trim(),
        type: newCategoryType,
      });

      setCategories([...categories, newCategory]);
      setShowCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryType('DEBIT');
      showToast(t('categories.createSuccess'), 'success');
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast(t('categories.createError'), 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle create subcategory form submission
   */
  const handleCreateSubcategory = async (e: FormEvent) => {
    e.preventDefault();

    if (!newSubcategoryName.trim()) {
      showToast(t('categories.subcategoryNameRequired'), 'error');
      return;
    }

    if (!selectedCategoryId) {
      showToast(t('categories.selectCategory'), 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const newSubcategory = await postJson<SubcategoryDto>('/api/categories/subcategories', {
        name: newSubcategoryName.trim(),
        categoryId: selectedCategoryId,
      });

      // Update the category with the new subcategory
      setCategories(categories.map(cat => {
        if (cat.id === selectedCategoryId) {
          return {
            ...cat,
            subcategories: [...(cat.subcategories || []), newSubcategory],
          };
        }
        return cat;
      }));

      // Auto-expand the category to show the new subcategory
      setExpandedCategories(prev => new Set(prev).add(selectedCategoryId));

      setShowSubcategoryModal(false);
      setNewSubcategoryName('');
      setSelectedCategoryId('');
      showToast(t('categories.subcategoryCreateSuccess'), 'success');
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast(t('categories.subcategoryCreateError'), 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle delete category
   */
  const handleDeleteCategory = async (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    if (category?.isDefault) {
      showToast(t('categories.deleteDefaultError'), 'error');
      return;
    }

    if (!confirm(t('categories.deleteCategoryConfirm'))) {
      return;
    }

    try {
      await deleteJson(`/api/categories/${categoryId}`);
      setCategories(categories.filter(c => c.id !== categoryId));
      showToast(t('categories.deleteSuccess'), 'success');
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast(t('categories.deleteError'), 'error');
      }
    }
  };

  /**
   * Handle delete subcategory
   */
  const handleDeleteSubcategory = async (subcategoryId: number, categoryId: number) => {
    if (!confirm(t('categories.deleteSubcategoryConfirm'))) {
      return;
    }

    try {
      await deleteJson(`/api/categories/subcategories/${subcategoryId}`);
      
      // Update state to remove the subcategory
      setCategories(categories.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            subcategories: cat.subcategories?.filter(sub => sub.id !== subcategoryId) || [],
          };
        }
        return cat;
      }));

      showToast(t('categories.subcategoryDeleteSuccess'), 'success');
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast(t('categories.subcategoryDeleteError'), 'error');
      }
    }
  };

  /**
   * Open subcategory modal with pre-selected category
   */
  const openSubcategoryModal = (categoryId?: number) => {
    if (categoryId) {
      setSelectedCategoryId(categoryId);
    }
    setShowSubcategoryModal(true);
  };

  if (isLoading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="page categories-page">
      <div className="page-header">
        <h1>{t('categories.title')}</h1>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowCategoryModal(true)}
          >
            + {t('categories.newCategory')}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => openSubcategoryModal()}
          >
            + {t('categories.newSubcategory')}
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="filters-section">
        <div className="form-group">
          <label htmlFor="filterType">{t('categories.filterByType')}</label>
          <select
            id="filterType"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as TransactionType | '')}
          >
            <option value="">{t('common.all')}</option>
            <option value="DEBIT">{t('transactions.expense')} ({t('transactions.debit')})</option>
            <option value="CREDIT">{t('transactions.income')} ({t('transactions.credit')})</option>
          </select>
        </div>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="empty-state">
          <p>{t('categories.noCategories')}</p>
          <p>{t('categories.noCategoriesDescription')}</p>
        </div>
      ) : (
        <div className="categories-list">
          {categories.map((category) => (
            <div key={category.id} className="category-card">
              <div 
                className="category-header"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="category-info">
                  <span className="expand-icon">
                    {expandedCategories.has(category.id) ? '▼' : '▶'}
                  </span>
                  <span className="category-name">{translateCategoryName(category)}</span>
                  <span className={`category-type ${category.type.toLowerCase()}`}>
                    {category.type === 'DEBIT' ? t('transactions.expense') : t('transactions.income')}
                  </span>
                  {category.isDefault && (
                    <span className="category-badge default">{t('categories.default')}</span>
                  )}
                </div>
                <div className="category-actions">
                  <span className="subcategory-count">
                    {category.subcategories?.length || 0} {t('categories.subcategories')}
                  </span>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      openSubcategoryModal(category.id);
                    }}
                    title={t('categories.addSubcategory')}
                  >
                    + Sub
                  </button>
                  {!category.isDefault && (
                    <button
                      className="btn btn-danger btn-small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category.id);
                      }}
                      title={t('categories.deleteCategory')}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              {/* Subcategories */}
              {expandedCategories.has(category.id) && (
                <div className="subcategories-list">
                  {category.subcategories && category.subcategories.length > 0 ? (
                    category.subcategories.map((subcategory) => (
                      <div key={subcategory.id} className="subcategory-item">
                        <span className="subcategory-name">{translateSubcategoryName(subcategory, category)}</span>
                        {!category.isDefault && (
                          <button
                            className="btn btn-danger btn-small"
                            onClick={() => handleDeleteSubcategory(subcategory.id, category.id)}
                            title={t('categories.deleteSubcategory')}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="subcategory-item empty">
                      {t('categories.noSubcategories')}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hidden Items Section */}
      <div className="hidden-items-section">
        <button className="btn btn-link" onClick={toggleHiddenSection}>
          {showHiddenSection ? t('categories.hideHiddenItems') : t('categories.showHiddenItems')}
        </button>
        {showHiddenSection && (
          <div className="hidden-items-list">
            {isLoadingHidden ? (
              <div className="loading">{t('common.loading')}</div>
            ) : (
              <>
                <h3>{t('categories.hiddenCategories')}</h3>
                {hiddenCategories.length === 0 ? (
                  <p>{t('categories.noHiddenCategories')}</p>
                ) : (
                  hiddenCategories.map((category) => (
                    <div key={category.id} className="hidden-item">
                      <span>{translateCategoryName(category)}</span>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => handleRestoreCategory(category.id)}
                      >
                        {t('categories.restore')}
                      </button>
                    </div>
                  ))
                )}

                <h3>{t('categories.hiddenSubcategories')}</h3>
                {hiddenSubcategories.length === 0 ? (
                  <p>{t('categories.noHiddenSubcategories')}</p>
                ) : (
                  hiddenSubcategories.map((subcategory) => (
                    <div key={subcategory.id} className="hidden-item">
                      <span>{translateSubcategoryName(subcategory, categories.find(c => c.id === subcategory.categoryId)!)}</span>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => handleRestoreSubcategory(subcategory.id)}
                      >
                        {t('categories.restore')}
                      </button>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('categories.newCategory')}</h2>
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label htmlFor="categoryName">{t('categories.name')} *</label>
                <input
                  type="text"
                  id="categoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={t('categories.categoryNamePlaceholder')}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="categoryType">{t('transactions.type')} *</label>
                <select
                  id="categoryType"
                  value={newCategoryType}
                  onChange={(e) => setNewCategoryType(e.target.value as TransactionType)}
                  disabled={isSubmitting}
                >
                  <option value="DEBIT">{t('transactions.expense')} ({t('transactions.debit')})</option>
                  <option value="CREDIT">{t('transactions.income')} ({t('transactions.credit')})</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCategoryModal(false)}
                  disabled={isSubmitting}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('categories.creating') : t('categories.createCategory')}
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
                <label htmlFor="subcategoryCategory">{t('transactions.category')} *</label>
                <select
                  id="subcategoryCategory"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : '')}
                  disabled={isSubmitting}
                >
                  <option value="">{t('transactions.selectCategory')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.type === 'DEBIT' ? t('transactions.expense') : t('transactions.income')})
                      {category.isDefault ? ` - ${t('categories.default')}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="subcategoryName">{t('categories.name')} *</label>
                <input
                  type="text"
                  id="subcategoryName"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  placeholder={t('categories.subcategoryNamePlaceholder')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSubcategoryModal(false)}
                  disabled={isSubmitting}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('categories.creating') : t('categories.createSubcategory')}
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
