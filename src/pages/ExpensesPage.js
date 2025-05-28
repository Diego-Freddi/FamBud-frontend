import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Menu,
  MenuItem as MenuItemComponent,
  Alert,
  Fab,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Pagination,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  AddOutlined,
  FilterListOutlined,
  SearchOutlined,
  MoreVertOutlined,
  EditOutlined,
  DeleteOutlined,
  ReceiptOutlined,
  CalendarTodayOutlined,
  EuroOutlined,
  CategoryOutlined,
  PersonOutlined,
  RefreshOutlined,
  FileDownloadOutlined,
  SortOutlined,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { it } from 'date-fns/locale';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { expenseAPI, categoryAPI } from '../services/api';
import { useApi } from '../hooks/useApi';
import ExpenseForm from '../components/Expenses/ExpenseForm';
import { categoryColors } from '../styles/theme';

const ExpensesPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Stati per form e modali
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  
  // Stati per filtri e ricerca
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    dateFrom: startOfMonth(new Date()),
    dateTo: endOfMonth(new Date()),
    minAmount: '',
    maxAmount: '',
  });
  
  // Stati per paginazione e ordinamento
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Menu per azioni
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Carica categorie
  const { 
    data: categoriesData, 
    loading: categoriesLoading 
  } = useApi(categoryAPI.getCategories, [], true);

  // Funzione stabilizzata per caricare spese
  const fetchExpenses = useCallback(() => {
    return expenseAPI.getExpenses({
      page,
      limit: 10,
      search: filters.search || undefined,
      categoryId: filters.categoryId || undefined,
      dateFrom: filters.dateFrom ? filters.dateFrom.toISOString() : undefined,
      dateTo: filters.dateTo ? filters.dateTo.toISOString() : undefined,
      minAmount: filters.minAmount || undefined,
      maxAmount: filters.maxAmount || undefined,
      sortBy,
      sortOrder,
    });
  }, [page, filters, sortBy, sortOrder]);

  // Carica spese con filtri
  const { 
    data: expensesData, 
    loading: expensesLoading, 
    error: expensesError,
    refetch: refetchExpenses 
  } = useApi(fetchExpenses, [page, filters, sortBy, sortOrder], true);

  const expenses = expensesData?.data?.expenses || [];
  const pagination = expensesData?.data?.pagination || {};
  const totalPages = pagination.pages || 1;
  const totalExpenses = pagination.total || 0;
  const categories = categoriesData?.data?.categories || [];

  // Gestione filtri
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset alla prima pagina quando si filtrano
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      categoryId: '',
      dateFrom: startOfMonth(new Date()),
      dateTo: endOfMonth(new Date()),
      minAmount: '',
      maxAmount: '',
    });
    setPage(1);
  };

  // Gestione ordinamento
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Gestione CRUD
  const handleAddExpense = () => {
    setEditingExpense(null);
    setFormOpen(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setFormOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteExpense = (expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  };

  const confirmDelete = async () => {
    try {
      await expenseAPI.deleteExpense(expenseToDelete._id);
      refetchExpenses();
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    } catch (error) {
      console.error('Errore durante l\'eliminazione:', error);
    }
  };

  const handleFormSuccess = useCallback(() => {
    refetchExpenses();
    setFormOpen(false);
    setEditingExpense(null);
  }, []);

  // Menu azioni
  const handleMenuOpen = (event, expense) => {
    setAnchorEl(event.currentTarget);
    setSelectedExpense(expense);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedExpense(null);
  };

  // Formattazione
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (date) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: it });
  };

  const getCategoryInfo = (expense) => {
    // Se la categoria è già popolata (oggetto), usala direttamente
    if (expense.category && typeof expense.category === 'object') {
      return expense.category;
    }
    
    // Altrimenti cerca per ID nelle categorie caricate
    const categoryId = expense.categoryId || expense.category;
    const category = categories.find(cat => cat._id === categoryId);
    return category || { name: 'Sconosciuto', color: categoryColors.altro };
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                Gestione Spese
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {totalExpenses} spese trovate
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={refetchExpenses} disabled={expensesLoading}>
                <RefreshOutlined />
              </IconButton>
              <Button
                variant="outlined"
                startIcon={<FilterListOutlined />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filtri
              </Button>
              {!isMobile && (
                <Button
                  variant="contained"
                  startIcon={<AddOutlined />}
                  onClick={handleAddExpense}
                >
                  Nuova Spesa
                </Button>
              )}
            </Box>
          </Box>

          {/* Filtri */}
          {showFilters && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Cerca"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchOutlined />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Categoria</InputLabel>
                      <Select
                        value={filters.categoryId}
                        label="Categoria"
                        onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                      >
                        <MenuItem value="">Tutte le categorie</MenuItem>
                        {categories.map((category) => (
                          <MenuItem key={category._id} value={category._id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  backgroundColor: category.color,
                                }}
                              />
                              {category.name}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={6} md={2}>
                    <DatePicker
                      label="Da"
                      value={filters.dateFrom}
                      onChange={(date) => handleFilterChange('dateFrom', date)}
                      slotProps={{
                        textField: { fullWidth: true, size: 'small' }
                      }}
                    />
                  </Grid>

                  <Grid item xs={6} md={2}>
                    <DatePicker
                      label="A"
                      value={filters.dateTo}
                      onChange={(date) => handleFilterChange('dateTo', date)}
                      slotProps={{
                        textField: { fullWidth: true, size: 'small' }
                      }}
                    />
                  </Grid>

                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Importo min"
                      type="number"
                      value={filters.minAmount}
                      onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">€</InputAdornment>,
                      }}
                    />
                  </Grid>

                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Importo max"
                      type="number"
                      value={filters.maxAmount}
                      onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">€</InputAdornment>,
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={clearFilters}
                        size="small"
                      >
                        Pulisci Filtri
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<FileDownloadOutlined />}
                        size="small"
                      >
                        Esporta CSV
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Errori */}
        {expensesError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Errore nel caricamento delle spese: {expensesError}
          </Alert>
        )}

        {/* Lista spese */}
        {expensesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : expenses.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <ReceiptOutlined sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nessuna spesa trovata
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {Object.values(filters).some(v => v) 
                  ? 'Prova a modificare i filtri di ricerca'
                  : 'Inizia aggiungendo la tua prima spesa'
                }
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddOutlined />}
                onClick={handleAddExpense}
              >
                Aggiungi Prima Spesa
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Header tabella */}
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ py: 1 }}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item xs={3} md={2}>
                    <Button
                      size="small"
                      onClick={() => handleSort('date')}
                      startIcon={<SortOutlined />}
                    >
                      Data
                    </Button>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Button
                      size="small"
                      onClick={() => handleSort('description')}
                    >
                      Descrizione
                    </Button>
                  </Grid>
                  <Grid item xs={3} md={2}>
                    <Button
                      size="small"
                      onClick={() => handleSort('amount')}
                    >
                      Importo
                    </Button>
                  </Grid>
                  {!isMobile && (
                    <>
                      <Grid item md={2}>
                        <Typography variant="body2" color="text.secondary">
                          Categoria
                        </Typography>
                      </Grid>
                      <Grid item md={1}>
                        <Typography variant="body2" color="text.secondary">
                          Utente
                        </Typography>
                      </Grid>
                    </>
                  )}
                  <Grid item xs={12} md={1} />
                </Grid>
              </CardContent>
            </Card>

            {/* Lista spese */}
            {expenses.map((expense) => {
              const categoryInfo = getCategoryInfo(expense);
              
              return (
                <Card key={expense._id} sx={{ mb: 1 }}>
                  <CardContent sx={{ py: 2 }}>
                    <Grid container alignItems="center" spacing={1}>
                      <Grid item xs={3} md={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarTodayOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {formatDate(expense.date)}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6} md={4}>
                        <Typography variant="body1" fontWeight="medium">
                          {expense.description}
                        </Typography>
                        {isMobile && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={categoryInfo.name}
                              size="small"
                              sx={{
                                backgroundColor: categoryInfo.color,
                                color: 'white',
                                fontSize: '0.75rem',
                              }}
                            />
                          </Box>
                        )}
                      </Grid>
                      
                      <Grid item xs={3} md={2}>
                        <Typography variant="body1" fontWeight="bold" color="error.main">
                          {formatAmount(expense.amount)}
                        </Typography>
                      </Grid>
                      
                      {!isMobile && (
                        <>
                          <Grid item md={2}>
                            <Chip
                              label={categoryInfo.name}
                              size="small"
                              sx={{
                                backgroundColor: categoryInfo.color,
                                color: 'white',
                              }}
                            />
                          </Grid>
                          <Grid item md={1}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PersonOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {expense.userId?.name || 'Tu'}
                              </Typography>
                            </Box>
                          </Grid>
                        </>
                      )}
                      
                      <Grid item xs={12} md={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, expense)}
                          >
                            <MoreVertOutlined />
                          </IconButton>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              );
            })}

            {/* Paginazione */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, newPage) => setPage(newPage)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}

        {/* FAB per mobile */}
        {isMobile && (
          <Fab
            color="primary"
            aria-label="add expense"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000,
            }}
            onClick={handleAddExpense}
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
          <MenuItemComponent onClick={() => handleEditExpense(selectedExpense)}>
            <EditOutlined sx={{ mr: 1 }} />
            Modifica
          </MenuItemComponent>
          <MenuItemComponent onClick={() => handleDeleteExpense(selectedExpense)}>
            <DeleteOutlined sx={{ mr: 1 }} />
            Elimina
          </MenuItemComponent>
        </Menu>

        {/* Form spesa */}
        <ExpenseForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          expense={editingExpense}
          onSuccess={handleFormSuccess}
        />

        {/* Dialog conferma eliminazione */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Conferma Eliminazione</DialogTitle>
          <DialogContent>
            <Typography>
              Sei sicuro di voler eliminare la spesa "{expenseToDelete?.description}"?
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
    </LocalizationProvider>
  );
};

export default ExpensesPage; 