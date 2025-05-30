import React, { useState, useCallback, useMemo } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
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
  ArrowUpwardOutlined,
  ArrowDownwardOutlined,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { it } from 'date-fns/locale';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { expenseAPI, categoryAPI } from '../services/api';
import ExpenseForm from '../components/Expenses/ExpenseForm';
import { categoryColors } from '../styles/theme';
import useApiCall from '../hooks/useApiCall';

const ExpensesPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Date iniziali stabili
  const initialDates = useMemo(() => ({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  }), []);
  
  // Stati per form e modali
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  
  // Stati per filtri e ricerca
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
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

  // Stabilizza i parametri per evitare loop infiniti
  const apiParams = useMemo(() => {
    // Ordinamenti supportati dal server
    const serverSortFields = ['date', 'description', 'amount'];
    const useServerSort = serverSortFields.includes(sortBy);
    
    // Se la ricerca è < 3 caratteri, non inviare il parametro search al backend
    // Così il backend restituisce tutti i risultati e il frontend fa la ricerca estesa
    const useBackendSearch = filters.search && filters.search.length >= 3;
    
    return {
      page,
      limit: 10,
      // Non inviare search al backend se facciamo ricerca frontend
      search: useBackendSearch ? undefined : undefined,
      category: filters.category === 'all' ? undefined : filters.category,
      startDate: filters.startDate ? filters.startDate.toISOString() : undefined,
      endDate: filters.endDate ? filters.endDate.toISOString() : undefined,
      minAmount: filters.minAmount || undefined,
      maxAmount: filters.maxAmount || undefined,
      // Solo per ordinamenti supportati dal server
      sortBy: useServerSort ? sortBy : 'date',
      sortOrder: useServerSort ? sortOrder : 'desc',
    };
  }, [page, filters.category, filters.startDate, filters.endDate, filters.minAmount, filters.maxAmount, sortBy, sortOrder]);

  // Funzioni API
  const fetchCategories = useCallback(async () => {
    return await categoryAPI.getCategories();
  }, []);

  const fetchExpenses = useCallback(async () => {
    return await expenseAPI.getExpenses(apiParams);
  }, [apiParams]);

  // Uso l'hook per gestire le chiamate API
  const { data: categoriesResponse, loading: categoriesLoading, refetch: refetchCategories } = useApiCall(fetchCategories, []);
  const { data: expensesResponse, loading: expensesLoading, error: expensesError, refetch: refetchExpenses } = useApiCall(fetchExpenses, [apiParams]);

  // Estraggo i dati dalle risposte
  const categories = categoriesResponse?.data?.categories || [];
  const expenses = expensesResponse?.data?.expenses || [];
  const pagination = expensesResponse?.data?.pagination || {};
  const totalPages = pagination.pages || 1;
  const totalExpenses = pagination.total || 0;

  // Funzione per ordinamento locale (per campi popolati come categoria e utente)
  const sortExpensesLocally = useMemo(() => {
    if (!expenses.length) return expenses;
    
    // Solo per ordinamenti locali (categoria e utente)
    if (sortBy === 'category' || sortBy === 'user') {
      const sorted = [...expenses].sort((a, b) => {
        let valueA, valueB;
        
        if (sortBy === 'category') {
          valueA = a.category?.name || '';
          valueB = b.category?.name || '';
        } else if (sortBy === 'user') {
          valueA = a.userId?.name || '';
          valueB = b.userId?.name || '';
        }
        
        const comparison = valueA.localeCompare(valueB, 'it', { sensitivity: 'base' });
        return sortOrder === 'desc' ? -comparison : comparison;
      });
      
      return sorted;
    }
    
    // Per altri ordinamenti, usa i dati dal server
    return expenses;
  }, [expenses, sortBy, sortOrder]);

  // Funzione per filtrare localmente per ricerca estesa (categoria e utente)
  const filteredExpenses = useMemo(() => {
    if (!filters.search || filters.search.length < 3) {
      return sortExpensesLocally;
    }

    const searchTerm = filters.search.toLowerCase();
    
    return sortExpensesLocally.filter(expense => {
      // Ricerca in categoria
      const categoryName = expense.category?.name?.toLowerCase() || '';
      const categoryMatch = categoryName.includes(searchTerm);
      
      // Ricerca in utente
      const userName = expense.userId?.name?.toLowerCase() || '';
      const userMatch = userName.includes(searchTerm);
      
      // Ricerca in descrizione (già gestita dal backend, ma aggiungiamo per completezza locale)
      const descriptionMatch = expense.description?.toLowerCase().includes(searchTerm) || false;
      
      // Ricerca in note
      const notesMatch = expense.notes?.toLowerCase().includes(searchTerm) || false;
      
      return categoryMatch || userMatch || descriptionMatch || notesMatch;
    });
  }, [sortExpensesLocally, filters.search]);

  // Gestione filtri
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset alla prima pagina quando si filtrano
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      startDate: initialDates.startDate,
      endDate: initialDates.endDate,
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
  }, [refetchExpenses]);

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
                      size="small"
                      placeholder="Cerca in descrizione, note, categoria, utente... (min 3 caratteri)"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchOutlined />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ minWidth: 300 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Categoria</InputLabel>
                      <Select
                        value={filters.category}
                        label="Categoria"
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                      >
                        <MenuItem value="all">
                          Tutte le categorie
                        </MenuItem>
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
                      value={filters.startDate}
                      onChange={(date) => handleFilterChange('startDate', date)}
                      slotProps={{
                        textField: { fullWidth: true, size: 'small' }
                      }}
                    />
                  </Grid>

                  <Grid item xs={6} md={2}>
                    <DatePicker
                      label="A"
                      value={filters.endDate}
                      onChange={(date) => handleFilterChange('endDate', date)}
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

        {/* Tabella spese */}
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'date'}
                    direction={sortBy === 'date' ? sortOrder : 'desc'}
                    onClick={() => handleSort('date')}
                  >
                    Data
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'description'}
                    direction={sortBy === 'description' ? sortOrder : 'asc'}
                    onClick={() => handleSort('description')}
                  >
                    Descrizione
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'amount'}
                    direction={sortBy === 'amount' ? sortOrder : 'desc'}
                    onClick={() => handleSort('amount')}
                  >
                    Importo
                  </TableSortLabel>
                </TableCell>
                {!isMobile && (
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'category'}
                      direction={sortBy === 'category' ? sortOrder : 'asc'}
                      onClick={() => handleSort('category')}
                    >
                      Categoria
                    </TableSortLabel>
                  </TableCell>
                )}
                {!isMobile && (
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'user'}
                      direction={sortBy === 'user' ? sortOrder : 'asc'}
                      onClick={() => handleSort('user')}
                    >
                      Utente
                    </TableSortLabel>
                  </TableCell>
                )}
                <TableCell>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expensesLoading ? (
                <TableRow>
                  <TableCell colSpan={isMobile ? 4 : 6} sx={{ py: 4, textAlign: 'center' }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isMobile ? 4 : 6} sx={{ py: 4, textAlign: 'center' }}>
                    <ReceiptOutlined sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Nessuna spesa trovata
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {filters.search || filters.category !== 'all' || filters.minAmount || filters.maxAmount
                        ? 'Prova a modificare i filtri di ricerca'
                        : 'Inizia aggiungendo la tua prima spesa'
                      }
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => {
                  const categoryInfo = getCategoryInfo(expense);
                  
                  return (
                    <TableRow key={expense._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarTodayOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {formatDate(expense.date)}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {expense.description}
                        </Typography>
                        {expense.notes && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {expense.notes}
                          </Typography>
                        )}
                        {/* Su mobile, mostra categoria sotto la descrizione */}
                        {isMobile && (
                          <Box sx={{ mt: 1 }}>
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
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body1" fontWeight="bold" color="error.main">
                          {formatAmount(expense.amount)}
                        </Typography>
                      </TableCell>
                      
                      {/* Categoria - nascosta su mobile */}
                      {!isMobile && (
                        <TableCell>
                          <Chip
                            label={categoryInfo.name}
                            size="small"
                            sx={{
                              backgroundColor: categoryInfo.color,
                              color: 'white',
                            }}
                          />
                        </TableCell>
                      )}
                      
                      {/* Utente - nascosto su mobile */}
                      {!isMobile && (
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {expense.userId?.name || 'Tu'}
                            </Typography>
                          </Box>
                        </TableCell>
                      )}
                      
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, expense)}
                        >
                          <MoreVertOutlined />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginazione */}
        {totalPages > 1 && (!filters.search || filters.search.length < 3) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}

        {/* Messaggio quando si usa ricerca frontend */}
        {filters.search && filters.search.length >= 3 && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Mostrando {filteredExpenses.length} risultati per "{filters.search}"
            </Typography>
          </Box>
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