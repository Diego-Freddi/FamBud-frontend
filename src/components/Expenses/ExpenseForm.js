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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  Box,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  SaveOutlined,
  CloseOutlined,
  CalendarTodayOutlined,
  DescriptionOutlined,
  CategoryOutlined,
  ReceiptOutlined,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { it, enUS } from 'date-fns/locale';
import { expenseSchema } from '../../utils/validationSchemas';
import { expenseAPI, categoryAPI } from '../../services/api';
import { useSettings } from '../../contexts/SettingsContext';

const ExpenseForm = ({ 
  open, 
  onClose, 
  expense = null, 
  onSuccess 
}) => {
  const { settings } = useSettings();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isEdit = Boolean(expense);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // Stati per categorie - gestione manuale
  const [categoriesData, setCategoriesData] = useState(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Simbolo valuta dalle impostazioni
  const getCurrencySymbol = () => {
    const symbols = { EUR: '€', USD: '$', GBP: '£' };
    return symbols[settings.currency] || '€';
  };

  // Carica categorie una sola volta
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await categoryAPI.getCategories();
        setCategoriesData(response.data);
      } catch (error) {
        console.error('❌ Errore caricamento categorie:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []); // Dipendenze vuote - carica solo una volta

  const categories = categoriesData?.data?.categories || [];

  // Setup form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(expenseSchema),
    defaultValues: {
      amount: '',
      description: '',
      categoryId: '',
      date: new Date(),
      notes: '',
    },
  });

  // Carica dati spesa se in modalità edit
  useEffect(() => {
    if (isEdit && expense) {
      // Gestisce sia categoria come oggetto che come ID
      const categoryId = expense.category?._id || expense.categoryId || expense.category;
      
      reset({
        amount: expense.amount,
        description: expense.description,
        categoryId: categoryId,
        date: new Date(expense.date),
        notes: expense.notes || '',
      });
      setTags(expense.tags || []);
    } else {
      reset({
        amount: '',
        description: '',
        categoryId: '',
        date: new Date(),
        notes: '',
      });
      setTags([]);
    }
  }, [isEdit, expense, reset]);

  // Reset form quando si chiude
  useEffect(() => {
    if (!open) {
      setError('');
      setTags([]);
      setTagInput('');
    }
  }, [open]);

  // Gestione tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 10) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddTag();
    }
  };

  // Submit form
  const onSubmit = async (data) => {
    setSubmitLoading(true);
    setError('');

    try {
      const expenseData = {
        amount: data.amount,
        description: data.description,
        category: data.categoryId, // Mappa categoryId a category
        tags,
        date: data.date.toISOString().split('T')[0], // Solo la data senza orario
        notes: data.notes || '',
      };

      let response;
      if (isEdit) {
        response = await expenseAPI.updateExpense(expense._id, expenseData);
      } else {
        response = await expenseAPI.createExpense(expenseData);
      }

      if (response.data.success) {
        onSuccess?.(response.data.data.expense);
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={settings.language === 'en' ? enUS : it}>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { borderRadius: isMobile ? 0 : 2 }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptOutlined color="primary" />
            <Typography variant="h6">
              {isEdit ? 'Modifica Spesa' : 'Nuova Spesa'}
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
              {/* Importo */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Importo"
                      type="number"
                      inputProps={{ 
                        step: "0.01",
                        min: "0",
                        max: "999999.99"
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            {getCurrencySymbol()}
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

              {/* Data */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      label="Data"
                      maxDate={new Date()}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.date,
                          helperText: errors.date?.message,
                          disabled: submitLoading,
                          InputProps: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarTodayOutlined />
                              </InputAdornment>
                            ),
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Descrizione */}
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Descrizione"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <DescriptionOutlined />
                          </InputAdornment>
                        ),
                      }}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                      disabled={submitLoading}
                    />
                  )}
                />
              </Grid>

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
                        disabled={submitLoading || categoriesLoading}
                        startAdornment={
                          <InputAdornment position="start">
                            <CategoryOutlined />
                          </InputAdornment>
                        }
                      >
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
                      {errors.categoryId && (
                        <FormHelperText>{errors.categoryId.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Tag */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Aggiungi Tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  placeholder="Premi Invio per aggiungere"
                  disabled={submitLoading || tags.length >= 10}
                  helperText={`${tags.length}/10 tag`}
                />
                
                {tags.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={() => handleRemoveTag(tag)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                )}
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
                  ? 'Aggiorna Spesa' 
                  : 'Crea Spesa'
              }
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ExpenseForm; 