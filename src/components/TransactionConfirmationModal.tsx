import React, { useState, useMemo, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, type DropdownOption } from './Dropdown';
import type { TransactionDraftDto, TransactionType, CategoryDto, SubcategoryDto } from '../types/dtos';

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

interface TransactionConfirmationModalProps {
  draft: TransactionDraftDto;
  categories: CategoryDto[];
  isConfirming: boolean;
  onConfirm: (data: TransactionDraftDto) => void;
  onCancel: () => void;
}

/**
 * Find matching category ID from draft category name
 */
const findInitialCategoryId = (
  categories: CategoryDto[],
  type: TransactionType,
  draftCategoryName: string
): number | '' => {
  const filteredCategories = categories.filter(cat => cat.type === type);
  const matchingCategory = filteredCategories.find(
    cat => cat.name.toLowerCase() === draftCategoryName.toLowerCase()
  );
  if (matchingCategory) {
    return matchingCategory.id;
  }
  if (filteredCategories.length > 0) {
    return filteredCategories[0].id;
  }
  return '';
};

/**
 * Find matching subcategory ID from draft subcategory name
 */
const findInitialSubcategoryId = (
  categories: CategoryDto[],
  categoryId: number | '',
  draftSubcategoryName?: string
): number | '' => {
  if (!categoryId) return '';
  const category = categories.find(cat => cat.id === categoryId);
  if (!category?.subcategories?.length) return '';
  
  if (draftSubcategoryName) {
    const matchingSubcategory = category.subcategories.find(
      sub => sub.name.toLowerCase() === draftSubcategoryName.toLowerCase()
    );
    if (matchingSubcategory) {
      return matchingSubcategory.id;
    }
  }
  return category.subcategories[0].id;
};

/**
 * Modal for confirming and editing a transaction draft before saving
 */
export const TransactionConfirmationModal: React.FC<TransactionConfirmationModalProps> = ({
  draft,
  categories,
  isConfirming,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();

  /**
   * Translate category name if it's a default category
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
   * Translate subcategory name if it belongs to a default category
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

  // Form state initialized from draft
  const [type, setType] = useState<TransactionType>(draft.type);
  const [amount, setAmount] = useState(draft.amount.toString());
  const [date, setDate] = useState(draft.date);
  const [description, setDescription] = useState(draft.description || '');

  // Initialize category based on draft
  const initialCategoryId = useMemo(
    () => findInitialCategoryId(categories, draft.type, draft.category),
    [categories, draft.type, draft.category]
  );
  const [categoryId, setCategoryId] = useState<number | ''>(initialCategoryId);

  // Initialize subcategory based on draft
  const initialSubcategoryId = useMemo(
    () => findInitialSubcategoryId(categories, initialCategoryId, draft.subcategory),
    [categories, initialCategoryId, draft.subcategory]
  );
  const [subcategoryId, setSubcategoryId] = useState<number | ''>(initialSubcategoryId);

  // Filter categories by type
  const filteredCategories = useMemo(
    () => categories.filter(cat => cat.type === type),
    [categories, type]
  );

  // Get selected category and its subcategories
  const selectedCategory = categories.find(cat => cat.id === categoryId);
  const availableSubcategories = selectedCategory?.subcategories || [];

  // Handle type change - reset category and subcategory
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const newFilteredCategories = categories.filter(cat => cat.type === newType);
    if (newFilteredCategories.length > 0) {
      const newCategoryId = newFilteredCategories[0].id;
      setCategoryId(newCategoryId);
      const newCategory = categories.find(cat => cat.id === newCategoryId);
      if (newCategory?.subcategories?.length) {
        setSubcategoryId(newCategory.subcategories[0].id);
      } else {
        setSubcategoryId('');
      }
    } else {
      setCategoryId('');
      setSubcategoryId('');
    }
  };

  // Handle category change - reset subcategory
  const handleCategoryChange = (newCategoryId: number) => {
    setCategoryId(newCategoryId);
    const newCategory = categories.find(cat => cat.id === newCategoryId);
    if (newCategory?.subcategories?.length) {
      setSubcategoryId(newCategory.subcategories[0].id);
    } else {
      setSubcategoryId('');
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const category = categories.find(c => c.id === categoryId);
    const subcategory = category?.subcategories?.find(s => s.id === subcategoryId);

    if (!category) {
      return;
    }

    const editedData: TransactionDraftDto = {
      type,
      amount: parseFloat(amount) || 0,
      category: category.name,
      subcategory: subcategory?.name || undefined,
      date,
      description: description.trim() || undefined,
    };

    onConfirm(editedData);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <h2>{t('transactions.confirmTransaction')}</h2>
        <p className="modal-subtitle">{t('transactions.confirmTransactionDescription')}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>{t('transactions.type')}</label>
              <Dropdown
                options={[
                  { value: 'DEBIT', label: `${t('transactions.debit')} (${t('transactions.expense')})`, icon: '📤' },
                  { value: 'CREDIT', label: `${t('transactions.credit')} (${t('transactions.income')})`, icon: '📥' },
                ]}
                value={type}
                onChange={(val) => handleTypeChange(val as TransactionType)}
                disabled={isConfirming}
              />
            </div>

            <div className="form-group">
              <label htmlFor="draftAmount">{t('transactions.amount')} *</label>
              <input
                type="number"
                id="draftAmount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                disabled={isConfirming}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('transactions.category')} *</label>
              <Dropdown
                options={filteredCategories.map((category): DropdownOption => ({
                  value: category.id,
                  label: translateCategoryName(category),
                  badge: category.isDefault ? t('categories.default') : undefined,
                }))}
                value={categoryId}
                onChange={(val) => handleCategoryChange(val as number)}
                placeholder={t('transactions.selectCategory')}
                disabled={isConfirming}
                searchable
              />
            </div>

            <div className="form-group">
              <label>{t('transactions.subcategory')}</label>
              <Dropdown
                options={selectedCategory ? availableSubcategories.map((subcategory): DropdownOption => ({
                  value: subcategory.id,
                  label: translateSubcategoryName(subcategory, selectedCategory),
                })) : []}
                value={subcategoryId}
                onChange={(val) => setSubcategoryId(val as number)}
                placeholder={t('transactions.selectSubcategory')}
                disabled={isConfirming || !categoryId}
                searchable
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="draftDate">{t('transactions.date')} *</label>
            <input
              type="date"
              id="draftDate"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isConfirming}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="draftDescription">{t('transactions.description')}</label>
            <textarea
              id="draftDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('transactions.descriptionPlaceholder')}
              disabled={isConfirming}
              rows={2}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isConfirming}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isConfirming || !categoryId}
            >
              {isConfirming ? t('transactions.creating') : t('common.confirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
