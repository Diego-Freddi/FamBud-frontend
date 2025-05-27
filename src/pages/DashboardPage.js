import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Fab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  AddOutlined,
  AccountBalanceWalletOutlined,
  TrendingUpOutlined,
  ReceiptOutlined,
  SavingsOutlined,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import StatsCard from '../components/Dashboard/StatsCard';
import ExpensesPieChart from '../components/Dashboard/ExpensesPieChart';
import MonthlyTrendChart from '../components/Dashboard/MonthlyTrendChart';
import RecentTransactions from '../components/Dashboard/RecentTransactions';
import BudgetAlerts from '../components/Dashboard/BudgetAlerts';

const DashboardPage = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(false);

  // Dati di esempio per la dashboard
  const [dashboardData, setDashboardData] = useState({
    balance: 1250.75,
    monthlyIncome: 2500.00,
    monthlyExpenses: 1249.25,
    savings: 1250.75,
    expensesByCategory: null, // Userà i dati di default del componente
    monthlyTrend: null, // Userà i dati di default del componente
    recentTransactions: null, // Userà i dati di default del componente
    budgetAlerts: null, // Userà i dati di default del componente
  });

  // Simula il caricamento dei dati
  useEffect(() => {
    // In futuro qui faremo le chiamate API reali
    setLoading(false);
  }, []);

  const currentMonth = new Intl.DateTimeFormat('it-IT', { 
    month: 'long', 
    year: 'numeric' 
  }).format(new Date());

  return (
    <Box>
      {/* Header della dashboard */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Benvenuto, {user?.name}! Ecco un riepilogo delle tue finanze per {currentMonth}.
        </Typography>
      </Box>

      {/* Cards delle statistiche principali */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Saldo Corrente"
            value={dashboardData.balance}
            subtitle="Disponibile"
            icon={<AccountBalanceWalletOutlined />}
            color="primary"
            trend="up"
            trendValue={5.2}
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Entrate Mensili"
            value={dashboardData.monthlyIncome}
            subtitle={currentMonth}
            icon={<TrendingUpOutlined />}
            color="success"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Spese Mensili"
            value={dashboardData.monthlyExpenses}
            subtitle={currentMonth}
            icon={<ReceiptOutlined />}
            color="error"
            trend="down"
            trendValue={3.1}
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Risparmi"
            value={dashboardData.savings}
            subtitle="Totale accumulato"
            icon={<SavingsOutlined />}
            color="info"
            trend="up"
            trendValue={12.5}
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
        onClick={() => {
          // In futuro aprirà il modal per aggiungere spesa
          console.log('Aggiungi spesa');
        }}
      >
        <AddOutlined />
      </Fab>
    </Box>
  );
};

export default DashboardPage; 