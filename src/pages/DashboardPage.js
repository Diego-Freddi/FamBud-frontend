import React, { useCallback } from 'react';
import {
  Typography,
  Box,
  Grid,
  Fab,
  useTheme,
  useMediaQuery,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  AddOutlined,
  AccountBalanceWalletOutlined,
  TrendingUpOutlined,
  ReceiptOutlined,
  SavingsOutlined,
  RefreshOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import StatsCard from '../components/Dashboard/StatsCard';
import ExpensesPieChart from '../components/Dashboard/ExpensesPieChart';
import MonthlyTrendChart from '../components/Dashboard/MonthlyTrendChart';
import RecentTransactions from '../components/Dashboard/RecentTransactions';
import BudgetAlerts from '../components/Dashboard/BudgetAlerts';
import useApiCall from '../hooks/useApiCall';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Funzione API per dashboard
  const fetchDashboardData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token di autenticazione non trovato');
    }

    return await axios.get(`${API_BASE_URL}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }, []);

  // Uso l'hook per gestire la chiamata API
  const { data: dashboardResponse, loading, error, refetch } = useApiCall(fetchDashboardData, []);

  // Estraggo i dati dalla risposta (mantenendo la stessa struttura)
  const dashboardData = dashboardResponse?.data || {
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
  };

  const currentMonth = new Intl.DateTimeFormat('it-IT', { 
    month: 'long', 
    year: 'numeric' 
  }).format(new Date());

  // Gestione errori
  if (error) {
    return (
      <Box>
        <Alert 
          severity="error" 
          action={
            <Fab
              size="small"
              color="inherit"
              onClick={refetch}
              sx={{ ml: 2 }}
            >
              <RefreshOutlined />
            </Fab>
          }
          sx={{ mb: 2 }}
        >
          Errore nel caricamento dei dati: {error}
        </Alert>
      </Box>
    );
  }

  // Loading completo per il primo caricamento
  if (loading && !dashboardData.stats) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Caricamento dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center',
      width: '100%'
    }}>
      <Box sx={{ 
        width: '100%',
        px: { xs: 0, sm: 2 }
      }}>
        {/* Header della dashboard */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                Dashboard
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Benvenuto, {user?.name}! Ecco un riepilogo delle tue finanze per {currentMonth}.
              </Typography>
            </Box>
            <Fab
              size="small"
              color="primary"
              onClick={refetch}
              disabled={loading}
              sx={{ 
                opacity: loading ? 0.5 : 1,
                '&:hover': {
                  transform: 'scale(1.1)',
                }
              }}
              title="Aggiorna dati"
            >
              <RefreshOutlined />
            </Fab>
          </Box>
        </Box>

        {/* Cards delle statistiche principali */}
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          width: '100%',
          flexDirection: { xs: 'column', sm: 'row' },
          flexWrap: 'wrap',
          mb: 4
        }}>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
            <StatsCard
              title="Saldo Corrente"
              value={dashboardData.stats?.balance || 0}
              subtitle="Disponibile"
              icon={<AccountBalanceWalletOutlined />}
              color="primary"
              loading={loading}
            />
          </Box>
          
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
            <StatsCard
              title="Entrate Mensili"
              value={dashboardData.stats?.monthlyIncome || 0}
              subtitle={currentMonth}
              icon={<TrendingUpOutlined />}
              color="success"
              loading={loading}
            />
          </Box>
          
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
            <StatsCard
              title="Spese Mensili"
              value={dashboardData.stats?.monthlyExpenses || 0}
              subtitle={currentMonth}
              icon={<ReceiptOutlined />}
              color="error"
              loading={loading}
            />
          </Box>
          
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
            <StatsCard
              title="Risparmi"
              value={dashboardData.stats?.savings || 0}
              subtitle="Totale accumulato"
              icon={<SavingsOutlined />}
              color="info"
              loading={loading}
            />
          </Box>
        </Box>

        {/* Grafici e contenuti principali */}
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          width: '100%',
          flexDirection: { xs: 'column', lg: 'row' },
          alignItems: 'stretch',
          mb: 4
        }}>
          {/* Grafico spese per categoria */}
          <Box sx={{ flex: 1, width: '100%' }}>
            <ExpensesPieChart 
              data={dashboardData.expensesByCategory}
              loading={loading}
            />
          </Box>
          
          {/* Andamento mensile */}
          <Box sx={{ flex: 1, width: '100%' }}>
            <MonthlyTrendChart 
              data={dashboardData.monthlyTrend}
              loading={loading}
            />
          </Box>
        </Box>

        {/* Sezione inferiore */}
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          width: '100%',
          flexDirection: { xs: 'column', lg: 'row' },
          alignItems: 'stretch'
        }}>
          {/* Ultime transazioni */}
          <Box sx={{ flex: 1, width: '100%' }}>
            <RecentTransactions 
              data={dashboardData.recentTransactions}
              loading={loading}
            />
          </Box>
          
          {/* Avvisi budget */}
          <Box sx={{ flex: 1, width: '100%' }}>
            <BudgetAlerts 
              data={dashboardData.budgetAlerts}
              loading={loading}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardPage; 