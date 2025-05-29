import React, { useState, useEffect, useCallback } from 'react';
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
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Stati per dashboard - gestione manuale
  const [dashboardData, setDashboardData] = useState({
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

  // Funzione per caricare dati dashboard
  const loadDashboardData = useCallback(async () => {
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
        setDashboardData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Errore nel caricamento dati');
      }
      
    } catch (err) {
      console.error('❌ Errore caricamento dashboard:', err);
      setError(err.response?.data?.message || err.message || 'Errore di rete');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carica dati una sola volta al mount
  useEffect(() => {
    loadDashboardData();
  }, []); // Dipendenze vuote - carica solo una volta

  // Funzione refetch per uso esterno
  const refetch = useCallback(() => {
    return loadDashboardData();
  }, [loadDashboardData]);

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
    <Box>
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
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Saldo Corrente"
            value={dashboardData.stats?.balance || 0}
            subtitle="Disponibile"
            icon={<AccountBalanceWalletOutlined />}
            color="primary"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Entrate Mensili"
            value={dashboardData.stats?.monthlyIncome || 0}
            subtitle={currentMonth}
            icon={<TrendingUpOutlined />}
            color="success"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Spese Mensili"
            value={dashboardData.stats?.monthlyExpenses || 0}
            subtitle={currentMonth}
            icon={<ReceiptOutlined />}
            color="error"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Risparmi"
            value={dashboardData.stats?.savings || 0}
            subtitle="Totale accumulato"
            icon={<SavingsOutlined />}
            color="info"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Grafici e contenuti principali */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Grafico spese per categoria */}
        <Grid item xs={12} lg={6}>
          <ExpensesPieChart 
            data={dashboardData.expensesByCategory}
            loading={loading}
          />
        </Grid>
        
        {/* Andamento mensile */}
        <Grid item xs={12} lg={6}>
          <MonthlyTrendChart 
            data={dashboardData.monthlyTrend}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Sezione inferiore */}
      <Grid container spacing={3}>
        {/* Ultime transazioni */}
        <Grid item xs={12} lg={8}>
          <RecentTransactions 
            data={dashboardData.recentTransactions}
            loading={loading}
          />
        </Grid>
        
        {/* Avvisi budget */}
        <Grid item xs={12} lg={4}>
          <BudgetAlerts 
            data={dashboardData.budgetAlerts}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Floating Action Button per aggiungere spesa */}
      <Fab
        color="primary"
        aria-label="add expense"
        sx={{
          position: 'fixed',
          bottom: isMobile ? 16 : 32,
          right: isMobile ? 16 : 32,
          zIndex: 1000,
        }}
        onClick={() => navigate('/expenses')}
      >
        <AddOutlined />
      </Fab>
    </Box>
  );
};

export default DashboardPage; 