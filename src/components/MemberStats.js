import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  LinearProgress
} from '@mui/material';
import { expenseAPI, incomeAPI } from '../services/api';

const MemberStats = ({ memberId, memberName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    expenses: { totalAmount: 0, count: 0 },
    incomes: { totalAmount: 0, count: 0 },
    balance: 0
  });

  useEffect(() => {
    fetchMemberStats();
  }, [memberId]);

  const fetchMemberStats = async () => {
    try {
      setLoading(true);
      setError('');

      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Chiamate parallele per spese e entrate del membro
      const [expensesResponse, incomesResponse] = await Promise.all([
        expenseAPI.getExpenses({
          userId: memberId,
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString(),
          limit: 1000 // Per avere tutte le transazioni del mese
        }),
        incomeAPI.getIncomes({
          userId: memberId,
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString(),
          limit: 1000
        })
      ]);

      const expenseStats = expensesResponse.data.data.stats || { totalAmount: 0, count: 0 };
      const incomeStats = incomesResponse.data.data.stats || { totalAmount: 0, count: 0 };

      const balance = incomeStats.totalAmount - expenseStats.totalAmount;

      setStats({
        expenses: expenseStats,
        incomes: incomeStats,
        balance
      });

    } catch (err) {
      console.error('Error fetching member stats:', err);
      setError('Errore nel caricamento statistiche');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" size="small">
        {error}
      </Alert>
    );
  }

  const balanceColor = stats.balance >= 0 ? 'success.main' : 'error.main';
  const totalTransactions = stats.expenses.count + stats.incomes.count;

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" textAlign="center" gutterBottom>
        Statistiche di {memberName} - {new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Spese questo mese:</Typography>
        <Typography variant="body2" fontWeight="bold" color="error.main">
          {formatCurrency(stats.expenses.totalAmount)}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Entrate questo mese:</Typography>
        <Typography variant="body2" fontWeight="bold" color="success.main">
          {formatCurrency(stats.incomes.totalAmount)}
        </Typography>
      </Box>
      
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" fontWeight="bold">Bilancio mensile:</Typography>
        <Typography variant="body2" fontWeight="bold" color={balanceColor}>
          {formatCurrency(stats.balance)}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2">Transazioni totali:</Typography>
        <Typography variant="body2" fontWeight="bold">
          {totalTransactions}
        </Typography>
      </Box>

      {/* Indicatore visivo del bilancio */}
      {stats.incomes.totalAmount > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Spese vs Entrate
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.min((stats.expenses.totalAmount / stats.incomes.totalAmount) * 100, 100)}
            color={stats.expenses.totalAmount > stats.incomes.totalAmount ? 'error' : 'success'}
            sx={{ height: 6, borderRadius: 3 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {((stats.expenses.totalAmount / stats.incomes.totalAmount) * 100).toFixed(1)}% delle entrate speso
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MemberStats; 