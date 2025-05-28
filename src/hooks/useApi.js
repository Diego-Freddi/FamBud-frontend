import { useState, useEffect, useCallback } from 'react';
import { handleAPIError } from '../services/api';

// Hook per chiamate API con gestione automatica di loading e errori
export const useApi = (apiFunction, dependencies = [], immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFunction(...args);
      setData(response.data);
      return { success: true, data: response.data };
    } catch (err) {
      const errorInfo = handleAPIError(err);
      setError(errorInfo.message);
      return { success: false, error: errorInfo.message };
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  const refetch = useCallback(() => execute(), [execute]);

  return {
    data,
    loading,
    error,
    execute,
    refetch,
    setData, // Per aggiornamenti ottimistici
  };
};

// Hook specifico per dati della dashboard
export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    expensesByCategory: null,
    monthlyTrend: null,
    recentTransactions: null,
    budgetAlerts: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Importiamo le API necessarie
      const { expenseAPI, incomeAPI, budgetAPI, categoryAPI } = await import('../services/api');

      // Chiamate parallele per ottimizzare le performance
      const [
        expensesResponse,
        incomesResponse,
        categoriesResponse,
        budgetsResponse,
      ] = await Promise.all([
        expenseAPI.getExpenses({ limit: 5, sortBy: 'date', sortOrder: 'desc' }),
        incomeAPI.getIncomes({ limit: 5, sortBy: 'date', sortOrder: 'desc' }),
        categoryAPI.getCategories(),
        budgetAPI.getBudgets({ month: new Date().getMonth() + 1, year: new Date().getFullYear() }),
      ]);

      // Chiamate per statistiche
      const [expenseStatsResponse, incomeStatsResponse] = await Promise.all([
        expenseAPI.getExpenseStats({ 
          month: new Date().getMonth() + 1, 
          year: new Date().getFullYear() 
        }),
        incomeAPI.getIncomeStats({ 
          month: new Date().getMonth() + 1, 
          year: new Date().getFullYear() 
        }),
      ]);

      // Processa i dati per la dashboard
      const processedData = {
        stats: {
          monthlyExpenses: expenseStatsResponse.data.data.totalAmount || 0,
          monthlyIncome: incomeStatsResponse.data.data.totalAmount || 0,
          balance: (incomeStatsResponse.data.data.totalAmount || 0) - (expenseStatsResponse.data.data.totalAmount || 0),
          savings: 0, // Calcoleremo dopo con dati storici
        },
        expensesByCategory: expenseStatsResponse.data.data.byCategory || [],
        monthlyTrend: {
          // Useremo dati degli ultimi 6 mesi
          labels: [],
          expenses: [],
          incomes: [],
        },
        recentTransactions: [
          ...expensesResponse.data.data.expenses.map(expense => ({
            ...expense,
            type: 'expense',
          })),
          ...incomesResponse.data.data.incomes.map(income => ({
            ...income,
            type: 'income',
          })),
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
        budgetAlerts: budgetsResponse.data.data.budgets || [],
      };

      setDashboardData(processedData);
    } catch (err) {
      const errorInfo = handleAPIError(err);
      setError(errorInfo.message);
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboardData,
    loading,
    error,
    refetch: fetchDashboardData,
  };
};

export default useApi; 