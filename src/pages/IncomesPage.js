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
  TrendingUpOutlined,
  MoreVertOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterListOutlined,
  SearchOutlined,
  RefreshOutlined,
  CalendarTodayOutlined,
  AttachMoneyOutlined,
  RepeatOutlined,
  BusinessOutlined,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { it, enUS } from 'date-fns/locale';
import { startOfMonth, endOfMonth } from 'date-fns';
import { incomeAPI } from '../services/api';
import IncomeForm from '../components/Incomes/IncomeForm';
import useApiCall from '../hooks/useApiCall';
import { useSettings } from '../contexts/SettingsContext';

const IncomesPage = () => {
  const { settings, formatCurrency, formatDate } = useSettings();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Stati per form e modali
  const [formOpen, setFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState(null);
  
  // Stati per filtri e ricerca
  const [filters, setFilters] = useState({
    search: '',
    source: 'all',
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    minAmount: '',
    maxAmount: '',
    isRecurring: 'all',
  });
  
  // Stati per paginazione e ordinamento
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Menu per azioni
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedIncome, setSelectedIncome] = useState(null);

  // Stabilizza i parametri per evitare loop infiniti
  const apiParams = useMemo(() => {
    // Ordinamenti supportati dal server
    const serverSortFields = ['date', 'description', 'amount'];
    const useServerSort = serverSortFields.includes(sortBy);
    
    return {
      page,
      limit: 10,
      source: filters.source === 'all' ? undefined : filters.source,
      startDate: filters.startDate ? filters.startDate.toISOString() : undefined,
      endDate: filters.endDate ? filters.endDate.toISOString() : undefined,
      minAmount: filters.minAmount || undefined,
      maxAmount: filters.maxAmount || undefined,
      isRecurring: filters.isRecurring === 'all' ? undefined : filters.isRecurring,
      // Solo per ordinamenti supportati dal server
      sortBy: useServerSort ? sortBy : 'date',
      sortOrder: useServerSort ? sortOrder : 'desc',
    };
  }, [page, filters.source, filters.startDate, filters.endDate, filters.minAmount, filters.maxAmount, filters.isRecurring, sortBy, sortOrder]);

  // Funzione API
  const fetchIncomes = useCallback(async () => {
    return await incomeAPI.getIncomes(apiParams);
  }, [apiParams]);

  // Uso l'hook per gestire la chiamata API
  const { data: incomesResponse, loading: incomesLoading, error: incomesError, refetch: refetchIncomes } = useApiCall(fetchIncomes, [apiParams]);

  // Estraggo i dati dalla risposta
  const pagination = incomesResponse?.data?.pagination || {};
  const totalPages = pagination.pages || 1;
  const totalIncomes = pagination.total || 0;

  // Fonti comuni per il filtro
  const commonSources = useMemo(() => [
    { value: 'salary', label: 'Stipendio' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'bonus', label: 'Bonus' },
    { value: 'investment', label: 'Investimenti' },
    { value: 'rental', label: 'Affitto' },
    { value: 'gift', label: 'Regalo' },
    { value: 'refund', label: 'Rimborso' },
    { value: 'other', label: 'Altro' },
  ], []);

  // Funzione per ottenere il label della fonte
  const getSourceLabel = useCallback((sourceValue) => {
    const source = commonSources.find(s => s.value === sourceValue);
    return source ? source.label : sourceValue;
  }, [commonSources]);

  // Funzione per ordinamento locale (per campi popolati come utente)
  const sortIncomesLocally = useMemo(() => {
    const incomes = incomesResponse?.data?.incomes || [];
    
    if (!incomes.length) return incomes;
    
    // Solo per ordinamenti locali (utente e fonte)
    if (sortBy === 'user' || sortBy === 'source') {
      const sorted = [...incomes].sort((a, b) => {
        let valueA, valueB;
        
        if (sortBy === 'user') {
          valueA = a.userId?.name || '';
          valueB = b.userId?.name || '';
        } else if (sortBy === 'source') {
          valueA = getSourceLabel(a.source) || '';
          valueB = getSourceLabel(b.source) || '';
        }
        
        const comparison = valueA.localeCompare(valueB, 'it', { sensitivity: 'base' });
        return sortOrder === 'desc' ? -comparison : comparison;
      });
      
      return sorted;
    }
    
    // Per altri ordinamenti, usa i dati dal server
    return incomes;
  }, [incomesResponse?.data?.incomes, sortBy, sortOrder, getSourceLabel]);

  // Funzione per filtrare localmente per ricerca estesa (utente e fonte)
  const filteredIncomes = useMemo(() => {
    if (!filters.search || filters.search.length < 3) {
      return sortIncomesLocally;
    }

    const searchTerm = filters.search.toLowerCase();
    
    return sortIncomesLocally.filter(income => {
      // Ricerca in utente
      const userName = income.userId?.name?.toLowerCase() || '';
      const userMatch = userName.includes(searchTerm);
      
      // Ricerca in descrizione
      const descriptionMatch = income.description?.toLowerCase().includes(searchTerm) || false;
      
      // Ricerca in fonte (usando la label tradotta)
      const sourceLabel = getSourceLabel(income.source)?.toLowerCase() || '';
      const sourceMatch = sourceLabel.includes(searchTerm);
      
      // Ricerca in note
      const notesMatch = income.notes?.toLowerCase().includes(searchTerm) || false;
      
      return userMatch || descriptionMatch || sourceMatch || notesMatch;
    });
  }, [sortIncomesLocally, filters.search, getSourceLabel]);

  // Gestione filtri
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset alla prima pagina quando si filtrano
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      source: 'all',
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
      minAmount: '',
      maxAmount: '',
      isRecurring: 'all',
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
  const handleAddIncome = () => {
    setEditingIncome(null);
    setFormOpen(true);
  };

  const handleEditIncome = (income) => {
    setEditingIncome(income);
    setFormOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteIncome = (income) => {
    setIncomeToDelete(income);
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  };

  const confirmDelete = async () => {
    try {
      await incomeAPI.deleteIncome(incomeToDelete._id);
      refetchIncomes();
      setDeleteDialogOpen(false);
      setIncomeToDelete(null);
    } catch (error) {
      console.error('Errore durante l\'eliminazione:', error);
    }
  };

  const handleFormSuccess = useCallback(() => {
    refetchIncomes();
    setFormOpen(false);
    setEditingIncome(null);
  }, [refetchIncomes]);

  // Menu azioni
  const handleMenuOpen = (event, income) => {
    setAnchorEl(event.currentTarget);
    setSelectedIncome(income);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedIncome(null);
  };

  // Formattazione
  const getRecurringLabel = (income) => {
    if (!income.isRecurring) return null;
    
    const typeLabels = {
      weekly: 'Settimanale',
      biweekly: 'Bisettimanale',
      monthly: 'Mensile',
      quarterly: 'Trimestrale',
      yearly: 'Annuale',
    };
    
    return typeLabels[income.recurringPattern?.frequency] || 'Ricorrente';
  };

  // Determina la locale per i DatePicker
  const datePickerLocale = settings.language === 'en' ? enUS : it;

  // Simbolo valuta dalle impostazioni
  const getCurrencySymbol = () => {
    const symbols = { EUR: '€', USD: '$', GBP: '£' };
    return symbols[settings.currency] || '€';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={datePickerLocale}>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                Gestione Entrate
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {totalIncomes} entrate trovate
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={refetchIncomes} disabled={incomesLoading}>
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
                  onClick={handleAddIncome}
                >
                  Nuova Entrata
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
                      placeholder="Cerca in descrizione, fonte, utente, note... (min 3 caratteri)"
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
                      <InputLabel>Fonte</InputLabel>
                      <Select
                        value={filters.source}
                        label="Fonte"
                        onChange={(e) => handleFilterChange('source', e.target.value)}
                      >
                        <MenuItem value="all">
                          Tutte le fonti
                        </MenuItem>
                        {commonSources.map((source) => (
                          <MenuItem key={source.value} value={source.value}>
                            {source.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Ricorrenza</InputLabel>
                      <Select
                        value={filters.isRecurring}
                        label="Ricorrenza"
                        onChange={(e) => handleFilterChange('isRecurring', e.target.value)}
                      >
                        <MenuItem value="all">
                          Tutte
                        </MenuItem>
                        <MenuItem value={true}>Solo ricorrenti</MenuItem>
                        <MenuItem value={false}>Solo singole</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={6} md={3}>
                    <DatePicker
                      label="Da"
                      value={filters.startDate}
                      onChange={(date) => handleFilterChange('startDate', date)}
                      slotProps={{
                        textField: { fullWidth: true, size: 'small' }
                      }}
                    />
                  </Grid>

                  <Grid item xs={6} md={3}>
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
                        startAdornment: <InputAdornment position="start">{getCurrencySymbol()}</InputAdornment>,
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
                        startAdornment: <InputAdornment position="start">{getCurrencySymbol()}</InputAdornment>,
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
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
                        startIcon={<AttachMoneyOutlined />}
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
        {incomesError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Errore nel caricamento delle entrate: {incomesError}
          </Alert>
        )}

        {/* Lista entrate */}
        {incomesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredIncomes.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <TrendingUpOutlined sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nessuna entrata trovata
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {Object.values(filters).some(v => v) 
                  ? 'Prova a modificare i filtri di ricerca'
                  : 'Inizia aggiungendo la tua prima entrata'
                }
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddOutlined />}
                onClick={handleAddIncome}
              >
                Aggiungi Prima Entrata
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Tabella entrate */}
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
                          active={sortBy === 'source'}
                          direction={sortBy === 'source' ? sortOrder : 'asc'}
                          onClick={() => handleSort('source')}
                        >
                          Fonte
                        </TableSortLabel>
                      </TableCell>
                    )}
                    {!isMobile && (
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'type'}
                          direction={sortBy === 'type' ? sortOrder : 'asc'}
                          onClick={() => handleSort('type')}
                        >
                          Tipo
                        </TableSortLabel>
                      </TableCell>
                    )}
                    <TableCell>Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incomesLoading ? (
                    <TableRow>
                      <TableCell colSpan={isMobile ? 4 : 6} sx={{ py: 4, textAlign: 'center' }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : filteredIncomes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isMobile ? 4 : 6} sx={{ py: 4, textAlign: 'center' }}>
                        <TrendingUpOutlined sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          Nessuna entrata trovata
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {filters.search || filters.source !== 'all' || filters.minAmount || filters.maxAmount
                            ? 'Prova a modificare i filtri di ricerca'
                            : 'Inizia aggiungendo la tua prima entrata'
                          }
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredIncomes.map((income) => {
              const recurringLabel = getRecurringLabel(income);
              
              return (
                        <TableRow key={income._id} hover>
                          <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarTodayOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {formatDate(income.date)}
                          </Typography>
                        </Box>
                          </TableCell>
                      
                          <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {income.description}
                        </Typography>
                            {income.notes && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {income.notes}
                              </Typography>
                            )}
                            {/* Su mobile, mostra fonte e tipo sotto la descrizione */}
                                                 {isMobile && (
                              <Box sx={{ mt: 1 }}>
                             <Chip
                               label={getSourceLabel(income.source)}
                               size="small"
                               color="primary"
                               variant="outlined"
                                  sx={{ mr: 1 }}
                             />
                            {recurringLabel && (
                              <Chip
                                label={recurringLabel}
                                size="small"
                                color="success"
                                variant="outlined"
                                icon={<RepeatOutlined />}
                              />
                            )}
                          </Box>
                        )}
                          </TableCell>
                      
                          <TableCell>
                        <Typography variant="body1" fontWeight="bold" color="success.main">
                           +{formatCurrency(income.amount)}
                        </Typography>
                          </TableCell>
                      
                          {/* Fonte - nascosta su mobile */}
                      {!isMobile && (
                            <TableCell>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                               <BusinessOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                               <Typography variant="body2">
                                 {getSourceLabel(income.source)}
                               </Typography>
                             </Box>
                            </TableCell>
                          )}
                          
                          {/* Tipo - nascosto su mobile */}
                          {!isMobile && (
                            <TableCell>
                            {recurringLabel ? (
                              <Chip
                                label={recurringLabel}
                                size="small"
                                color="success"
                                variant="outlined"
                                icon={<RepeatOutlined />}
                              />
                            ) : (
                              <Chip
                                label="Singola"
                                size="small"
                                variant="outlined"
                              />
                            )}
                            </TableCell>
                      )}
                      
                          <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, income)}
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
                  Mostrando {filteredIncomes.length} risultati per "{filters.search}"
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* FAB per mobile */}
        {isMobile && (
          <Fab
            color="primary"
            aria-label="add income"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000,
            }}
            onClick={handleAddIncome}
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
          <MenuItemComponent onClick={() => handleEditIncome(selectedIncome)}>
            <EditOutlined sx={{ mr: 1 }} />
            Modifica
          </MenuItemComponent>
          <MenuItemComponent onClick={() => handleDeleteIncome(selectedIncome)}>
            <DeleteOutlined sx={{ mr: 1 }} />
            Elimina
          </MenuItemComponent>
        </Menu>

        {/* Form entrata */}
        <IncomeForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          income={editingIncome}
          onSuccess={handleFormSuccess}
        />

        {/* Dialog conferma eliminazione */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Conferma Eliminazione</DialogTitle>
          <DialogContent>
            <Typography>
              Sei sicuro di voler eliminare l'entrata "{incomeToDelete?.description}"?
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

export default IncomesPage; 