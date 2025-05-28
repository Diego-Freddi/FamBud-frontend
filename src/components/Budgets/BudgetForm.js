import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Box,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Paper,
  Chip,
  Switch,
  FormControlLabel,
  Slider,
} from '@mui/material';
import {
  SaveOutlined,
  CloseOutlined,
  AccountBalanceWalletOutlined,
  EuroOutlined,
  CalendarTodayOutlined,
  NotificationsOutlined,
  AutorenewOutlined,
} from '@mui/icons-material';
import { budgetSchema } from '../../utils/validationSchemas';
import { budgetAPI } from '../../services/api';

// Mappatura icone backend a emoji (stessa delle categorie)
const ICON_MAP = {
  'shopping-cart': '🛒',
  'car': '🚗',
  'home': '🏠',
  'heart': '💊',
  'film': '🎬',
  'shirt': '👕',
  'book': '📚',
  'more-horizontal': '⚫',
};

const BudgetForm = ({ 
  open, 
  onClose, 
  budget = null, 
  categories = [],
  defaultMonth,
  defaultYear,
  onSuccess 
}) => {
  const isEdit = Boolean(budget);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [autoRenew, setAutoRenew] = useState(false);

  // Setup form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(budgetSchema),
    defaultValues: {
      categoryId: '',
      amount: '',
      month: defaultMonth || new Date().getMonth() + 1,
      year: defaultYear || new Date().getFullYear(),
      alertThreshold: 80,
      autoRenew: false,
      notes: '',
    },
  });

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

  // Carica dati budget se in modalità edit
  useEffect(() => {
    if (isEdit && budget) {
      reset({
        categoryId: budget.categoryId?._id || budget.categoryId,
        amount: budget.amount,
        month: budget.month,
        year: budget.year,
        alertThreshold: budget.alertThreshold || 80,
        autoRenew: budget.autoRenew || false,
        notes: budget.notes || '',
      });
      setAlertThreshold(budget.alertThreshold || 80);
      setAutoRenew(budget.autoRenew || false);
    } else {
      reset({
        categoryId: '',
        amount: '',
        month: defaultMonth || new Date().getMonth() + 1,
        year: defaultYear || new Date().getFullYear(),
        alertThreshold: 80,
        autoRenew: false,
        notes: '',
      });
      setAlertThreshold(80);
      setAutoRenew(false);
    }
  }, [isEdit, budget, reset, defaultMonth, defaultYear]);

  // Reset form quando si chiude
  useEffect(() => {
    if (!open) {
      setError('');
    }
  }, [open]);

  // Gestione soglia allerta
  const handleAlertThresholdChange = (event, newValue) => {
    setAlertThreshold(newValue);
    setValue('alertThreshold', newValue);
  };

  // Gestione auto-rinnovo
  const handleAutoRenewChange = (event) => {
    const value = event.target.checked;
    setAutoRenew(value);
    setValue('autoRenew', value);
  };

  // Submit form
  const onSubmit = async (data) => {
    setSubmitLoading(true);
    setError('');

    try {
      const budgetData = {
        ...data,
        alertThreshold,
        autoRenew,
      };

      let response;
      if (isEdit) {
        response = await budgetAPI.updateBudget(budget._id, budgetData);
      } else {
        response = await budgetAPI.createBudget(budgetData);
      }

      if (response.data.success) {
        onSuccess?.(response.data.data.budget);
        onClose();
      } else {
        setError(response.data.message || 'Errore durante il salvataggio');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Errore durante il salvataggio');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Trova categoria selezionata per preview
  const selectedCategory = categories.find(cat => cat._id === watch('categoryId'));

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

  // Formattazione
  const formatAmount = (amount) => {
    if (!amount) return '€0,00';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalanceWalletOutlined color="primary" />
          <Typography variant="h6">
            {isEdit ? 'Modifica Budget' : 'Nuovo Budget'}
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Preview budget */}
            {selectedCategory && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Anteprima Budget
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: selectedCategory.color,
                        width: 56,
                        height: 56,
                        fontSize: '1.5rem',
                      }}
                    >
                      {getCategoryIcon(selectedCategory)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {selectedCategory.name}
                      </Typography>
                      <Typography variant="h5" color="primary.main" fontWeight="bold">
                        {formatAmount(watch('amount'))}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {months.find(m => m.value === watch('month'))?.label} {watch('year')}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            )}

            {/* Categoria */}
            <Grid item xs={12}>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.categoryId}>
                    <InputLabel>Categoria</InputLabel>
                    <Select
                      {...field}
                      label="Categoria"
                      disabled={submitLoading}
                    >
                      {categories.map((category) => (
                        <MenuItem key={category._id} value={category._id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                              sx={{
                                bgcolor: category.color,
                                width: 24,
                                height: 24,
                                fontSize: '0.8rem',
                              }}
                            >
                              {getCategoryIcon(category)}
                            </Avatar>
                            {category.name}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.categoryId && (
                      <Typography variant="caption" color="error">
                        {errors.categoryId.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Importo */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Importo Budget"
                    type="number"
                    inputProps={{ 
                      step: "0.01",
                      min: "0",
                      max: "999999.99"
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EuroOutlined />
                        </InputAdornment>
                      ),
                    }}
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                    disabled={submitLoading}
                  />
                )}
              />
            </Grid>

            {/* Mese */}
            <Grid item xs={12} sm={3}>
              <Controller
                name="month"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.month}>
                    <InputLabel>Mese</InputLabel>
                    <Select
                      {...field}
                      label="Mese"
                      disabled={submitLoading || isEdit}
                    >
                      {months.map((month) => (
                        <MenuItem key={month.value} value={month.value}>
                          {month.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.month && (
                      <Typography variant="caption" color="error">
                        {errors.month.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Anno */}
            <Grid item xs={12} sm={3}>
              <Controller
                name="year"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.year}>
                    <InputLabel>Anno</InputLabel>
                    <Select
                      {...field}
                      label="Anno"
                      disabled={submitLoading || isEdit}
                    >
                      {years.map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.year && (
                      <Typography variant="caption" color="error">
                        {errors.year.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Soglia di allerta */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <NotificationsOutlined />
                Soglia di Allerta: {alertThreshold}%
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Riceverai una notifica quando raggiungi questa percentuale del budget
              </Typography>
              <Slider
                value={alertThreshold}
                onChange={handleAlertThresholdChange}
                min={50}
                max={100}
                step={5}
                marks={[
                  { value: 50, label: '50%' },
                  { value: 75, label: '75%' },
                  { value: 100, label: '100%' },
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
                sx={{ mt: 2 }}
              />
            </Grid>

            {/* Auto-rinnovo */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRenew}
                    onChange={handleAutoRenewChange}
                    disabled={submitLoading}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutorenewOutlined />
                    <Box>
                      <Typography variant="body1">
                        Rinnovo Automatico
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Il budget verrà ricreato automaticamente il mese successivo con lo stesso importo
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </Grid>

            {/* Note */}
            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Note (opzionale)"
                    multiline
                    rows={3}
                    placeholder="Aggiungi note o promemoria per questo budget..."
                    error={!!errors.notes}
                    helperText={errors.notes?.message}
                    disabled={submitLoading}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={onClose}
            disabled={submitLoading}
            startIcon={<CloseOutlined />}
          >
            Annulla
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitLoading}
            startIcon={
              submitLoading ? (
                <CircularProgress size={20} />
              ) : (
                <SaveOutlined />
              )
            }
          >
            {submitLoading 
              ? 'Salvataggio...' 
              : isEdit 
                ? 'Aggiorna Budget' 
                : 'Crea Budget'
            }
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BudgetForm; 