import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getJson, ApiError } from '../lib/api';
import { Toast, useToast } from '../components/Toast';
import type { WalletDto, TransactionDto } from '../types/dtos';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

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

// Extended transaction type with wallet info
interface TransactionWithWallet extends Omit<TransactionDto, 'walletId'> {
  walletId?: number;
  walletName?: string;
}

// Tooltip props type
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

/**
 * Reports Page Component
 * Financial analytics with charts and insights
 */
export const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const [wallets, setWallets] = useState<WalletDto[]>([]);
  const [transactions, setTransactions] = useState<TransactionWithWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(6); // months
  const [selectedWalletId, setSelectedWalletId] = useState<number | 'all'>('all');
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

  /**
   * Traduz o nome da subcategoria se for uma subcategoria padrão
   */
  const translateSubcategoryName = useCallback((subcategoryName: string): string => {
    const key = subcategoryNameToKey[subcategoryName];
    if (key) {
      return t(`defaultSubcategories.${key}`);
    }
    return subcategoryName;
  }, [t]);

  // Colors for charts
  const COLORS = {
    primary: '#6366f1',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    purple: '#a78bfa',
    pink: '#ec4899',
    cyan: '#06b6d4',
    orange: '#f97316',
  };

  const CHART_COLORS = [
    COLORS.primary, COLORS.success, COLORS.warning, COLORS.purple,
    COLORS.pink, COLORS.cyan, COLORS.orange, COLORS.danger
  ];

  /**
   * Fetch all data
   */
  const fetchData = useCallback(async () => {
    try {
      const walletsData = await getJson<WalletDto[]>('/api/wallets');
      setWallets(walletsData);

      // Fetch transactions from all wallets
      const allTransactions: TransactionWithWallet[] = [];
      for (const wallet of walletsData) {
        try {
          const txns = await getJson<TransactionDto[]>(`/api/wallets/${wallet.id}/transactions`);
          allTransactions.push(...txns.map(t => ({ ...t, walletId: wallet.id, walletName: wallet.name })));
        } catch {
          // Ignore errors for individual wallets
        }
      }
      setTransactions(allTransactions);
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast(t('reports.loadError'), 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Filter transactions by period and wallet
   */
  const filteredTransactions = useMemo(() => {
    const startDate = startOfMonth(subMonths(new Date(), selectedPeriod - 1));
    const endDate = endOfMonth(new Date());

    return transactions.filter(t => {
      const txDate = parseISO(t.date);
      const inPeriod = isWithinInterval(txDate, { start: startDate, end: endDate });
      const inWallet = selectedWalletId === 'all' || t.walletId === selectedWalletId;
      return inPeriod && inWallet;
    });
  }, [transactions, selectedPeriod, selectedWalletId]);

  /**
   * Calculate summary metrics
   */
  const metrics = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'CREDIT')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const expenses = filteredTransactions
      .filter(t => t.type === 'DEBIT')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const balance = income - expenses;
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    const avgMonthlyExpense = expenses / selectedPeriod;
    const avgMonthlyIncome = income / selectedPeriod;
    const transactionCount = filteredTransactions.length;

    return {
      income,
      expenses,
      balance,
      savingsRate,
      avgMonthlyExpense,
      avgMonthlyIncome,
      transactionCount,
    };
  }, [filteredTransactions, selectedPeriod]);

  /**
   * Expenses by category (Pie Chart)
   */
  const expensesByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();

    filteredTransactions
      .filter(t => t.type === 'DEBIT')
      .forEach(t => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + (Number(t.amount) || 0));
      });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name: translateCategoryName(name), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredTransactions, translateCategoryName]);

  /**
   * Income by category (Pie Chart)
   */
  const incomeByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();

    filteredTransactions
      .filter(t => t.type === 'CREDIT')
      .forEach(t => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + (Number(t.amount) || 0));
      });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name: translateCategoryName(name), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredTransactions, translateCategoryName]);

  /**
   * Monthly trend data (Line/Area Chart)
   */
  const monthlyTrend = useMemo(() => {
    const months: { month: string; income: number; expenses: number; balance: number }[] = [];

    for (let i = selectedPeriod - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthTransactions = filteredTransactions.filter(t => {
        const txDate = parseISO(t.date);
        return isWithinInterval(txDate, { start: monthStart, end: monthEnd });
      });

      const income = monthTransactions
        .filter(t => t.type === 'CREDIT')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'DEBIT')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      months.push({
        month: format(monthDate, 'MMM yy', { locale: pt }),
        income,
        expenses,
        balance: income - expenses,
      });
    }

    return months;
  }, [filteredTransactions, selectedPeriod]);

  /**
   * Daily spending pattern (Bar Chart)
   */
  const dailyPattern = useMemo(() => {
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dayData = dayNames.map(name => ({ name, expenses: 0, count: 0 }));

    filteredTransactions
      .filter(t => t.type === 'DEBIT')
      .forEach(t => {
        const dayIndex = parseISO(t.date).getDay();
        dayData[dayIndex].expenses += Number(t.amount) || 0;
        dayData[dayIndex].count += 1;
      });

    return dayData.map(d => ({
      ...d,
      average: d.count > 0 ? d.expenses / d.count : 0,
    }));
  }, [filteredTransactions]);

  /**
   * Top expenses
   */
  const topExpenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'DEBIT')
      .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
      .slice(0, 5);
  }, [filteredTransactions]);

  /**
   * Wallet distribution
   */
  const walletDistribution = useMemo(() => {
    return wallets.map(w => ({
      name: w.name,
      value: Math.abs(Number(w.balance) || 0),
      balance: Number(w.balance) || 0,
    })).filter(w => w.value > 0);
  }, [wallets]);

  /**
   * Format currency
   */
  const formatCurrency = (amount: number | undefined | null): string => {
    const value = Number(amount) || 0;
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  /**
   * Custom tooltip for charts
   */
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>{t('reports.loading')}</p>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1>{t('reports.title')}</h1>
          <p className="page-subtitle">{t('reports.subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="reports-filters">
        <div className="filter-group">
          <label>{t('reports.period')}</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
          >
            <option value={1}>{t('reports.lastMonth')}</option>
            <option value={3}>{t('reports.last3Months')}</option>
            <option value={6}>{t('reports.last6Months')}</option>
            <option value={12}>{t('reports.last12Months')}</option>
          </select>
        </div>
        <div className="filter-group">
          <label>{t('reports.wallet')}</label>
          <select
            value={selectedWalletId}
            onChange={(e) => setSelectedWalletId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          >
            <option value="all">{t('reports.allWallets')}</option>
            {wallets.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card income">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <span className="metric-label">{t('reports.totalIncome')}</span>
            <span className="metric-value">{formatCurrency(metrics.income)}</span>
            <span className="metric-sub">{t('reports.avg')}: {formatCurrency(metrics.avgMonthlyIncome)}/{t('reports.month')}</span>
          </div>
        </div>
        <div className="metric-card expenses">
          <div className="metric-icon">📉</div>
          <div className="metric-content">
            <span className="metric-label">{t('reports.totalExpenses')}</span>
            <span className="metric-value">{formatCurrency(metrics.expenses)}</span>
            <span className="metric-sub">{t('reports.avg')}: {formatCurrency(metrics.avgMonthlyExpense)}/{t('reports.month')}</span>
          </div>
        </div>
        <div className="metric-card balance">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <span className="metric-label">{t('reports.netBalance')}</span>
            <span className={`metric-value ${metrics.balance >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(metrics.balance)}
            </span>
            <span className="metric-sub">{metrics.transactionCount} {t('reports.transactions')}</span>
          </div>
        </div>
        <div className="metric-card savings">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <span className="metric-label">{t('reports.savingsRate')}</span>
            <span className={`metric-value ${metrics.savingsRate >= 20 ? 'positive' : metrics.savingsRate >= 0 ? 'warning' : 'negative'}`}>
              {metrics.savingsRate.toFixed(1)}%
            </span>
            <span className="metric-sub">{metrics.savingsRate >= 20 ? t('reports.great') : metrics.savingsRate >= 10 ? t('reports.good') : t('reports.needsAttention')}</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Monthly Trend */}
        <div className="chart-card full-width">
          <h3>{t('reports.monthlyIncomeVsExpenses')}</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `€${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="income"
                  name={t('reports.income')}
                  stroke={COLORS.success}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name={t('reports.expenses')}
                  stroke={COLORS.danger}
                  fillOpacity={1}
                  fill="url(#colorExpenses)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Balance Trend */}
        <div className="chart-card full-width">
          <h3>{t('reports.monthlyNetBalance')}</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `€${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="balance"
                  name={t('reports.balance')}
                  fill={COLORS.primary}
                  radius={[4, 4, 0, 0]}
                >
                  {monthlyTrend.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.balance >= 0 ? COLORS.success : COLORS.danger}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="chart-card">
          <h3>{t('reports.expensesByCategory')}</h3>
          {expensesByCategory.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {expensesByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                {expensesByCategory.map((item, index) => (
                  <div key={item.name} className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></span>
                    <span className="legend-label">{item.name}</span>
                    <span className="legend-value">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="chart-empty">{t('reports.noExpenseData')}</div>
          )}
        </div>

        {/* Income by Category */}
        <div className="chart-card">
          <h3>{t('reports.incomeBySource')}</h3>
          {incomeByCategory.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={incomeByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {incomeByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                {incomeByCategory.map((item, index) => (
                  <div key={item.name} className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></span>
                    <span className="legend-label">{item.name}</span>
                    <span className="legend-value">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="chart-empty">{t('reports.noIncomeData')}</div>
          )}
        </div>

        {/* Daily Spending Pattern */}
        <div className="chart-card">
          <h3>{t('reports.spendingByDay')}</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyPattern}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `€${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="expenses"
                  name={t('reports.totalSpent')}
                  fill={COLORS.purple}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wallet Distribution */}
        <div className="chart-card">
          <h3>{t('reports.walletDistribution')}</h3>
          {walletDistribution.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={walletDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name }) => name}
                  >
                    {walletDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="chart-empty">{t('reports.noWalletData')}</div>
          )}
        </div>
      </div>

      {/* Top Expenses Table */}
      <div className="report-section">
        <h3>{t('reports.topExpenses')}</h3>
        {topExpenses.length > 0 ? (
          <div className="top-expenses-list">
            {topExpenses.map((tx, index) => (
              <div key={tx.id} className="top-expense-item">
                <div className="expense-rank">#{index + 1}</div>
                <div className="expense-info">
                  <span className="expense-category">{translateCategoryName(tx.category)}</span>
                  {tx.subcategory && <span className="expense-subcategory">/ {translateSubcategoryName(tx.subcategory)}</span>}
                  {tx.description && <p className="expense-description">{tx.description}</p>}
                  <span className="expense-date">{format(parseISO(tx.date), 'dd MMM yyyy', { locale: pt })}</span>
                </div>
                <span className="expense-amount">{formatCurrency(tx.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="chart-empty">{t('reports.noExpensesRecorded')}</div>
        )}
      </div>

      {/* Financial Insights */}
      <div className="report-section insights-section">
        <h3>💡 {t('reports.financialInsights')}</h3>
        <div className="insights-grid">
          {metrics.savingsRate < 10 && (
            <div className="insight-card warning">
              <span className="insight-icon">⚠️</span>
              <div className="insight-content">
                <strong>{t('reports.lowSavingsRate')}</strong>
                <p>{t('reports.lowSavingsRateDescription', { rate: metrics.savingsRate.toFixed(1) })}</p>
              </div>
            </div>
          )}
          {metrics.savingsRate >= 20 && (
            <div className="insight-card success">
              <span className="insight-icon">🎉</span>
              <div className="insight-content">
                <strong>{t('reports.excellentSavings')}</strong>
                <p>{t('reports.excellentSavingsDescription', { rate: metrics.savingsRate.toFixed(1) })}</p>
              </div>
            </div>
          )}
          {expensesByCategory.length > 0 && (
            <div className="insight-card info">
              <span className="insight-icon">📊</span>
              <div className="insight-content">
                <strong>{t('reports.topSpendingCategory')}</strong>
                <p>{t('reports.topSpendingCategoryDescription', { category: expensesByCategory[0]?.name, amount: formatCurrency(expensesByCategory[0]?.value) })}</p>
              </div>
            </div>
          )}
          {dailyPattern.length > 0 && (
            <div className="insight-card info">
              <span className="insight-icon">📅</span>
              <div className="insight-content">
                <strong>{t('reports.spendingPattern')}</strong>
                <p>{t('reports.spendingPatternDescription', { day: dailyPattern.reduce((max, d) => d.expenses > max.expenses ? d : max, dailyPattern[0]).name })}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};