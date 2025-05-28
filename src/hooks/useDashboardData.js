import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

const useDashboardData = () => {
  const [data, setData] = useState({
    stats: {
      monthlyExpenses: 0,
      monthlyIncome: 0,
      balance: 0,
      savings: 0
    },
    expensesByCategory: [],
    monthlyTrend: {
      labels: [],
      expenses: [],
      incomes: []
    },
    recentTransactions: [],
    budgetAlerts: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token di autenticazione non trovato');
      }

      // UNA SOLA CHIAMATA API per tutti i dati
      const response = await axios.get(`${API_BASE_URL}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Errore nel caricamento dati');
      }
      
    } catch (err) {
      console.error('Errore caricamento dashboard:', err);
      setError(err.response?.data?.message || err.message || 'Errore di rete');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardData
  };
};

export default useDashboardData; 