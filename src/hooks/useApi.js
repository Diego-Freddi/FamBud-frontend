import { useState, useEffect, useCallback, useRef } from 'react';
import { handleAPIError } from '../services/api';

// Hook per chiamate API con gestione automatica di loading e errori
export const useApi = (apiFunction, dependencies = [], immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const executeRef = useRef();

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFunction(...args);
      
      // Controlla se il componente è ancora montato
      if (mountedRef.current) {
        setData(response.data);
      }
      return { success: true, data: response.data };
    } catch (err) {
      const errorInfo = handleAPIError(err);
      if (mountedRef.current) {
        setError(errorInfo.message);
      }
      return { success: false, error: errorInfo.message };
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiFunction]);

  // Aggiorna la ref ogni volta che execute cambia
  useEffect(() => {
    executeRef.current = execute;
  });

  // Funzione refetch stabilizzata che usa la ref
  const refetch = useCallback((...args) => {
    return executeRef.current(...args);
  }, []);

  // Esegui la chiamata iniziale solo se immediate è true
  useEffect(() => {
    if (immediate) {
      execute();
    }
    
    // Cleanup function
    return () => {
      mountedRef.current = false;
    };
  }, [immediate, ...dependencies]);

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
  const mountedRef = useRef(true);
  const fetchDashboardDataRef = useRef();

  const fetchDashboardData = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);

      // Importiamo le API necessarie
      const { expenseAPI, incomeAPI, budgetAPI, categoryAPI } = await import('../services/api');

      // Chiamate parallele RIDOTTE per evitare rate limiting
      const [
        expensesResponse,
        incomesResponse,
        budgetsResponse,
      ] = await Promise.all([
        expenseAPI.getExpenses({ limit: 5, sortBy: 'date', sortOrder: 'desc' }),
        incomeAPI.getIncomes({ limit: 5, sortBy: 'date', sortOrder: 'desc' }),
        budgetAPI.getBudgets({ month: new Date().getMonth() + 1, year: new Date().getFullYear() }),
      ]);

      // Chiamate per statistiche (ridotte)
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

      if (!mountedRef.current) return;

      // Processa i dati per la dashboard (senza trend mensile per ora)
      const processedData = {
        stats: {
          monthlyExpenses: expenseStatsResponse.data.data.totalAmount || 0,
          monthlyIncome: incomeStatsResponse.data.data.totalAmount || 0,
          balance: (incomeStatsResponse.data.data.totalAmount || 0) - (expenseStatsResponse.data.data.totalAmount || 0),
          savings: 0,
        },
        expensesByCategory: (expenseStatsResponse.data.data.byCategory || []).map(category => ({
          categoryName: category.name,
          totalAmount: category.totalAmount,
          color: category.color,
        })),
        monthlyTrend: {
          labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu'],
          expenses: [0, 0, 0, 0, 0, 0],
          incomes: [0, 0, 0, 0, 0, 0],
        }, // Dati placeholder per ora
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
      if (mountedRef.current) {
        setError(errorInfo.message);
        console.error('Dashboard data fetch error:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []); // Nessuna dipendenza per evitare loop

  // Aggiorna la ref ogni volta che la funzione cambia
  useEffect(() => {
    fetchDashboardDataRef.current = fetchDashboardData;
  });

  useEffect(() => {
    fetchDashboardDataRef.current();
    
    // Cleanup function
    return () => {
      mountedRef.current = false;
    };
  }, []); // Array vuoto - esegui solo al mount

  // Refresh automatico quando la pagina diventa visibile
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && mountedRef.current) {
        // Refresh solo se sono passati più di 30 secondi dall'ultimo caricamento
        const lastRefresh = localStorage.getItem('dashboard_last_refresh');
        const now = Date.now();
        if (!lastRefresh || now - parseInt(lastRefresh) > 30000) {
          fetchDashboardDataRef.current();
          localStorage.setItem('dashboard_last_refresh', now.toString());
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Array vuoto - nessuna dipendenza

  return {
    dashboardData,
    loading,
    error,
    refetch: fetchDashboardData,
  };
};

export default useApi; 