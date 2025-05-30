import React, { useCallback, useState, useMemo } from 'react';
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
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  AddOutlined,
  AccountBalanceWalletOutlined,
  TrendingUpOutlined,
  ReceiptOutlined,
  SavingsOutlined,
  RefreshOutlined,
  FilterListOutlined,
  SearchOutlined,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { it } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import StatsCard from '../components/Dashboard/StatsCard';
import ExpensesPieChart from '../components/Dashboard/ExpensesPieChart';
import MonthlyTrendChart from '../components/Dashboard/MonthlyTrendChart';
import RecentTransactions from '../components/Dashboard/RecentTransactions';
import BudgetAlerts from '../components/Dashboard/BudgetAlerts';
import useApiCall from '../hooks/useApiCall';
import { familyAPI } from '../services/api';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Stati per filtri
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    userId: 'all', // 'all' per tutti i membri
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Primo giorno del mese corrente
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), // Ultimo giorno del mese corrente
  });

  // Parametri API stabilizzati per evitare loop infiniti
  const apiParams = useMemo(() => {
    const params = {};
    
    if (filters.userId && filters.userId !== 'all') {
      params.userId = filters.userId;
    }
    
    if (filters.startDate) {
      params.startDate = filters.startDate.toISOString();
    }
    
    if (filters.endDate) {
      params.endDate = filters.endDate.toISOString();
    }
    
    return params;
  }, [filters.userId, filters.startDate, filters.endDate]);
  
  // Funzione API per dashboard con filtri
  const fetchDashboardData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token di autenticazione non trovato');
    }

    const queryString = new URLSearchParams(apiParams).toString();
    const url = `${API_BASE_URL}/dashboard${queryString ? `?${queryString}` : ''}`;

    return await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }, [apiParams]);

  // Funzione API per membri famiglia
  const fetchFamilyMembers = useCallback(async () => {
    return await familyAPI.getFamily();
  }, []);

  // Gestione filtri
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      userId: 'all',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    });
  };

  const hasActiveFilters = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const isCurrentMonth = filters.startDate && filters.endDate &&
      filters.startDate.getTime() === currentMonthStart.getTime() &&
      filters.endDate.getTime() === currentMonthEnd.getTime();
    
    return filters.userId !== 'all' || !isCurrentMonth;
  }, [filters]);

  // Uso l'hook per gestire le chiamate API
  const { data: dashboardResponse, loading, error, refetch } = useApiCall(fetchDashboardData, []);
  const { data: familyResponse, loading: familyLoading } = useApiCall(fetchFamilyMembers, []);

  // Estraggo i dati dalle risposte
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
    budgetAlerts: [],
    appliedFilters: {
      userId: null,
      startDate: null,
      endDate: null,
      isFiltered: false
    }
  };

  // Estraggo i membri famiglia
  const familyData = familyResponse?.data?.family || null;
  const familyMembers = familyData?.members || [];
  
  // Filtro solo membri attivi
  const activeMembers = familyMembers.filter(member => member.isActive !== false);

  // Genera il testo del periodo per il subtitle
  const getPeriodText = () => {
    const { appliedFilters } = dashboardData;
    
    // Controlla se siamo nel mese corrente (default)
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const isCurrentMonth = appliedFilters?.startDate && appliedFilters?.endDate &&
      new Date(appliedFilters.startDate).getTime() === currentMonthStart.getTime() &&
      new Date(appliedFilters.endDate).getTime() === currentMonthEnd.getTime();
    
    if (isCurrentMonth || (!appliedFilters?.isFiltered && !appliedFilters?.startDate && !appliedFilters?.endDate)) {
      const monthName = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(now);
      return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;
    }
    
    let periodText = '';
    if (appliedFilters?.startDate && appliedFilters?.endDate) {
      const start = new Date(appliedFilters.startDate).toLocaleDateString('it-IT');
      const end = new Date(appliedFilters.endDate).toLocaleDateString('it-IT');
      periodText = `Dal ${start} al ${end}`;
    } else if (appliedFilters?.startDate) {
      const start = new Date(appliedFilters.startDate).toLocaleDateString('it-IT');
      periodText = `Dal ${start} ad oggi`;
    } else if (appliedFilters?.endDate) {
      const end = new Date(appliedFilters.endDate).toLocaleDateString('it-IT');
      periodText = `Dall'inizio al ${end}`;
    } else {
      periodText = 'Mese corrente';
    }
    
    // Aggiungi info utente se filtrato
    if (appliedFilters?.userId) {
      const member = activeMembers.find(m => m.user._id === appliedFilters.userId);
      if (member) {
        periodText += ` - ${member.user.name}`;
      }
    }
    
    return periodText;
  };

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
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                  Dashboard
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Benvenuto, {user?.name}! Ecco un riepilogo delle tue finanze {getPeriodText()}.
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterListOutlined />}
                  onClick={() => setShowFilters(!showFilters)}
                  color={hasActiveFilters ? 'primary' : 'inherit'}
                  size={isMobile ? 'small' : 'medium'}
                >
                  Filtri
                  {hasActiveFilters && (
                    <Box
                      sx={{
                        ml: 1,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                      }}
                    />
                  )}
                </Button>
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

            {/* Sezione Filtri */}
            {showFilters && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Membro Famiglia</InputLabel>
                        <Select
                          value={filters.userId}
                          label="Membro Famiglia"
                          onChange={(e) => handleFilterChange('userId', e.target.value)}
                          disabled={familyLoading}
                        >
                          <MenuItem value="all">
                            Tutti i membri
                          </MenuItem>
                          {activeMembers.length === 0 && !familyLoading && (
                            <MenuItem disabled>
                              <Typography variant="body2" color="text.secondary">
                                Nessun membro trovato
                              </Typography>
                            </MenuItem>
                          )}
                          {activeMembers.map((member) => (
                            <MenuItem key={member.user._id} value={member.user._id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                  sx={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: '50%',
                                    backgroundColor: member.role === 'admin' ? 'primary.main' : 'grey.400',
                                  }}
                                />
                                {member.user.name}
                                {member.role === 'admin' && (
                                  <Typography variant="caption" color="primary">
                                    (Admin)
                                  </Typography>
                                )}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={6} md={3}>
                      <DatePicker
                        label="Data Inizio"
                        value={filters.startDate}
                        onChange={(date) => handleFilterChange('startDate', date)}
                        slotProps={{
                          textField: { 
                            fullWidth: true, 
                            size: 'small',
                            placeholder: 'Dall\'inizio'
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={6} md={3}>
                      <DatePicker
                        label="Data Fine"
                        value={filters.endDate}
                        onChange={(date) => handleFilterChange('endDate', date)}
                        slotProps={{
                          textField: { 
                            fullWidth: true, 
                            size: 'small',
                            placeholder: 'Fino ad oggi'
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={2}>
                      <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'center' }}>
                        <Button
                          variant="outlined"
                          onClick={clearFilters}
                          size="small"
                          disabled={!hasActiveFilters}
                          fullWidth
                        >
                          Reset
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
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
                title="Entrate Totali"
                value={dashboardData.stats?.monthlyIncome || 0}
                subtitle={getPeriodText()}
                icon={<TrendingUpOutlined />}
                color="success"
                loading={loading}
              />
            </Box>
            
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
              <StatsCard
                title="Spese Totali"
                value={dashboardData.stats?.monthlyExpenses || 0}
                subtitle={getPeriodText()}
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
    </LocalizationProvider>
  );
};

export default DashboardPage; 