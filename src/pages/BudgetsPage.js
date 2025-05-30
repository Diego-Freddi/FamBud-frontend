import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Menu,
  MenuItem as MenuItemComponent,
  Alert,
  Fab,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import {
  AddOutlined,
  MoreVertOutlined,
  EditOutlined,
  DeleteOutlined,
  AccountBalanceWalletOutlined,
  RefreshOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  AutorenewOutlined,
  CalendarTodayOutlined,
} from '@mui/icons-material';
import { budgetAPI, categoryAPI } from '../services/api';
import BudgetForm from '../components/Budgets/BudgetForm';
import useApiCall from '../hooks/useApiCall';

// Mapping icone per compatibilità
const ICON_MAP = {
  // Icone originali
  'food': '🍽️',
  'transport': '🚗',
  'entertainment': '🎬',
  'health': '🏥',
  'shopping': '🛒',
  'bills': '💡',
  'education': '📚',
  'travel': '✈️',
  'home': '🏠',
  'other': '📦',
  
  // Icone effettivamente nel database
  'shopping-cart': '🛒',
  'car': '🚗',
  'heart': '❤️',
  'film': '🎬',
  'shirt': '👕',
  'book': '📚',
  'more-horizontal': '📦'
};

const BudgetsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Stati per form e modali
  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  
  // Stati per filtri
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Menu per azioni
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState(null);

  // Parametri stabilizzati
  const fetchParams = useMemo(() => ({
    month: selectedMonth,
    year: selectedYear,
    familyId: undefined // Sarà gestito dal backend
  }), [selectedMonth, selectedYear]);

  // Funzioni API
  const fetchCategories = useCallback(async () => {
    return await categoryAPI.getCategories();
  }, []);

  const fetchBudgets = useCallback(async () => {
    return await budgetAPI.getBudgets(fetchParams);
  }, [fetchParams]);

  const fetchSummary = useCallback(async () => {
    return await budgetAPI.getBudgetSummary(fetchParams);
  }, [fetchParams]);

  // Uso l'hook per gestire le chiamate API
  const { data: categoriesResponse, loading: categoriesLoading, refetch: refetchCategories } = useApiCall(fetchCategories, []);
  const { data: budgetsResponse, loading: budgetsLoading, error: budgetsError, refetch: refetchBudgets } = useApiCall(fetchBudgets, [fetchParams]);
  const { data: summaryResponse, loading: summaryLoading, refetch: refetchSummary } = useApiCall(fetchSummary, [fetchParams]);

  // Estraggo i dati dalle risposte
  const categories = categoriesResponse?.data?.categories || [];
  const budgets = budgetsResponse?.data?.budgets || [];
  const summary = summaryResponse?.data?.summary || {};

  // Funzione refetch combinata
  const refetchAll = useCallback(() => {
    refetchBudgets();
    refetchSummary();
  }, [refetchBudgets, refetchSummary]);

  // Funzione per ottenere l'icona corretta
  const getCategoryIcon = (category) => {
    if (!category?.icon) {
      return category?.name?.charAt(0)?.toUpperCase() || '?';
    }
    
    // Se è un emoji, usalo direttamente
    if (category.icon.length <= 2 && /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(category.icon)) {
      return category.icon;
    }
    
    // Se è un nome di icona, mappalo a emoji
    if (ICON_MAP[category.icon]) {
      return ICON_MAP[category.icon];
    }
    
    // Fallback alla prima lettera del nome
    return category.name.charAt(0).toUpperCase();
  };

  // Gestione CRUD
  const handleAddBudget = () => {
    setEditingBudget(null);
    setFormOpen(true);
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setFormOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteBudget = (budget) => {
    setBudgetToDelete(budget);
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  };

  const confirmDelete = async () => {
    try {
      await budgetAPI.deleteBudget(budgetToDelete._id);
      refetchAll();
      setDeleteDialogOpen(false);
      setBudgetToDelete(null);
    } catch (error) {
      console.error('Errore durante l\'eliminazione:', error);
    }
  };

  const handleFormSuccess = useCallback(() => {
    refetchAll();
    setFormOpen(false);
    setEditingBudget(null);
  }, []);

  // Menu azioni
  const handleMenuOpen = (event, budget) => {
    setAnchorEl(event.currentTarget);
    setSelectedBudget(budget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBudget(null);
  };

  // Formattazione
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusColor = (percentageUsed) => {
    if (percentageUsed >= 100) return 'error';
    if (percentageUsed >= 80) return 'warning';
    return 'success';
  };

  const getStatusIcon = (percentageUsed) => {
    if (percentageUsed >= 100) return <WarningOutlined />;
    if (percentageUsed >= 80) return <TrendingUpOutlined />;
    return <CheckCircleOutlined />;
  };

  const getStatusText = (percentageUsed) => {
    if (percentageUsed >= 100) return 'Superato';
    if (percentageUsed >= 80) return 'Attenzione';
    return 'In linea';
  };

  // Genera opzioni mesi e anni
  const months = [
    { value: 1, label: 'Gennaio' },
    { value: 2, label: 'Febbraio' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Aprile' },
    { value: 5, label: 'Maggio' },
    { value: 6, label: 'Giugno' },
    { value: 7, label: 'Luglio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Settembre' },
    { value: 10, label: 'Ottobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Dicembre' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Gestione Budget
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {budgets.length} budget configurati per {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={refetchAll} disabled={budgetsLoading}>
              <RefreshOutlined />
            </IconButton>
            {!isMobile && (
              <Button
                variant="contained"
                startIcon={<AddOutlined />}
                onClick={handleAddBudget}
              >
                Nuovo Budget
              </Button>
            )}
          </Box>
        </Box>

        {/* Filtri mese/anno */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Mese</InputLabel>
                  <Select
                    value={selectedMonth}
                    label="Mese"
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {months.map((month) => (
                      <MenuItem key={month.value} value={month.value}>
                        {month.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Anno</InputLabel>
                  <Select
                    value={selectedYear}
                    label="Anno"
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {years.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarTodayOutlined color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Periodo selezionato
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Riassunto generale */}
        {!summaryLoading && summary.totalBudget && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Riassunto Budget {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {formatAmount(summary.totalBudget || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Budget Totale
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main" fontWeight="bold">
                      {formatAmount(summary.totalSpent || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Speso Totale
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {formatAmount(summary.totalRemaining || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rimanente
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography 
                      variant="h4" 
                      color={getStatusColor(summary.overallPercentage || 0) + '.main'} 
                      fontWeight="bold"
                    >
                      {(summary.overallPercentage || 0).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Utilizzo Medio
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Errori */}
      {budgetsError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Errore nel caricamento dei budget: {budgetsError}
        </Alert>
      )}

      {/* Lista budget */}
      {budgetsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <AccountBalanceWalletOutlined sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nessun budget trovato
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Inizia creando il tuo primo budget per {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={handleAddBudget}
            >
              Crea Primo Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {budgets.map((budget) => {
            const statusColor = getStatusColor(budget.percentageUsed);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={budget._id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    minWidth: '350px',
                    maxWidth: '400px',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    }
                  }}
                >
                  <CardContent>
                    {/* Header budget */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <Avatar
                          sx={{
                            bgcolor: budget.categoryId?.color || '#666',
                            width: 40,
                            height: 40,
                            fontSize: '1.2rem',
                          }}
                        >
                          {getCategoryIcon(budget.categoryId)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {budget.categoryId?.name || 'Categoria Sconosciuta'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Budget {formatAmount(budget.amount)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          icon={getStatusIcon(budget.percentageUsed)}
                          label={getStatusText(budget.percentageUsed)}
                          color={statusColor}
                          size="small"
                        />
                        {budget.autoRenew && (
                          <Chip
                            icon={<AutorenewOutlined />}
                            label="Auto"
                            size="small"
                            variant="outlined"
                          />
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, budget)}
                        >
                          <MoreVertOutlined />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Progress bar utilizzo */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Utilizzo budget
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color={`${statusColor}.main`}>
                          {budget.percentageUsed.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(budget.percentageUsed, 100)}
                        color={statusColor}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {/* Dettagli spese */}
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="error.main" fontWeight="bold">
                            {formatAmount(budget.spent)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Speso
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography 
                            variant="h6" 
                            color={budget.remaining >= 0 ? 'success.main' : 'error.main'} 
                            fontWeight="bold"
                          >
                            {formatAmount(budget.remaining)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Rimanente
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Note se presenti */}
                    {budget.notes && (
                      <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {budget.notes}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* FAB per mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add budget"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
          onClick={handleAddBudget}
        >
          <AddOutlined />
        </Fab>
      )}

      {/* Menu azioni */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItemComponent onClick={() => handleEditBudget(selectedBudget)}>
          <EditOutlined sx={{ mr: 1 }} />
          Modifica
        </MenuItemComponent>
        <MenuItemComponent onClick={() => handleDeleteBudget(selectedBudget)}>
          <DeleteOutlined sx={{ mr: 1 }} />
          Elimina
        </MenuItemComponent>
      </Menu>

      {/* Form budget */}
      <BudgetForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        budget={editingBudget}
        categories={categories}
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
        onSuccess={handleFormSuccess}
      />

      {/* Dialog conferma eliminazione */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Conferma Eliminazione</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler eliminare il budget per "{budgetToDelete?.categoryId?.name}"?
            Questa azione non può essere annullata.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Annulla
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Elimina
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BudgetsPage; 