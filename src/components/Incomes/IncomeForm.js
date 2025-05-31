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
  FormControlLabel,
  Switch,
  Collapse,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  SaveOutlined,
  CloseOutlined,
  CalendarTodayOutlined,
  DescriptionOutlined,
  TrendingUpOutlined,
  BusinessOutlined,
  RepeatOutlined,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { it, enUS } from 'date-fns/locale';
import { incomeSchema } from '../../utils/validationSchemas';
import { incomeAPI } from '../../services/api';
import { useSettings } from '../../contexts/SettingsContext';

const IncomeForm = ({ 
  open, 
  onClose, 
  income = null, 
  onSuccess 
}) => {
  const { settings } = useSettings();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isEdit = Boolean(income);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // Simbolo valuta dalle impostazioni
  const getCurrencySymbol = () => {
    const symbols = { EUR: '€', USD: '$', GBP: '£' };
    return symbols[settings.currency] || '€';
  };

  // Setup form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(incomeSchema),
    defaultValues: {
      amount: '',
      description: '',
      source: '',
      date: new Date(),
      isRecurring: false,
      recurringType: '',
      recurringEndDate: null,
      notes: '',
    },
  });

  const watchIsRecurring = watch('isRecurring');

  // Carica dati entrata se in modalità edit
  useEffect(() => {
    if (isEdit && income) {
      reset({
        amount: income.amount,
        description: income.description,
        source: income.source,
        date: new Date(income.date),
        isRecurring: income.isRecurring || false,
        recurringType: income.recurringPattern?.frequency || '',
        recurringEndDate: income.recurringPattern?.endDate ? new Date(income.recurringPattern.endDate) : null,
        notes: income.notes || '',
      });
      setTags(income.tags || []);
    } else {
      reset({
        amount: '',
        description: '',
        source: '',
        date: new Date(),
        isRecurring: false,
        recurringType: '',
        recurringEndDate: null,
        notes: '',
      });
      setTags([]);
    }
  }, [isEdit, income, reset]);

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
      const incomeData = {
        amount: data.amount,
        description: data.description,
        source: data.source,
        date: data.date.toISOString(),
        notes: data.notes,
        tags,
        isRecurring: data.isRecurring,
        recurringPattern: data.isRecurring ? {
          frequency: data.recurringType,
          endDate: data.recurringEndDate ? data.recurringEndDate.toISOString() : null,
        } : undefined,
      };

      let response;
      if (isEdit) {
        response = await incomeAPI.updateIncome(income._id, incomeData);
      } else {
        response = await incomeAPI.createIncome(incomeData);
      }

      if (response.data.success) {
        onSuccess?.(response.data.data.income);
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

  const recurringTypes = [
    { value: 'weekly', label: 'Settimanale' },
    { value: 'biweekly', label: 'Bisettimanale' },
    { value: 'monthly', label: 'Mensile' },
    { value: 'quarterly', label: 'Trimestrale' },
    { value: 'yearly', label: 'Annuale' },
  ];

  const commonSources = [
    { value: 'salary', label: 'Stipendio' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'bonus', label: 'Bonus' },
    { value: 'investment', label: 'Investimenti' },
    { value: 'rental', label: 'Affitto' },
    { value: 'gift', label: 'Regalo' },
    { value: 'refund', label: 'Rimborso' },
    { value: 'other', label: 'Altro' },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={settings.language === 'en' ? enUS : it}>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpOutlined color="primary" />
            <Typography variant="h6">
              {isEdit ? 'Modifica Entrata' : 'Nuova Entrata'}
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
              <Grid item xs={12} md={6}>
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Importo"
                      type="number"
                      error={!!errors.amount}
                      helperText={errors.amount?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            {getCurrencySymbol()}
                          </InputAdornment>
                        ),
                      }}
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

              {/* Fonte */}
              <Grid item xs={12}>
                <Controller
                  name="source"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.source}>
                      <InputLabel>Fonte</InputLabel>
                      <Select
                        {...field}
                        label="Fonte"
                        disabled={submitLoading}
                        startAdornment={
                          <InputAdornment position="start">
                            <BusinessOutlined />
                          </InputAdornment>
                        }
                      >
                        {commonSources.map((source) => (
                          <MenuItem key={source.value} value={source.value}>
                            {source.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.source && (
                        <FormHelperText>{errors.source.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Ricorrenza */}
              <Grid item xs={12}>
                <Controller
                  name="isRecurring"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          {...field}
                          checked={field.value}
                          disabled={submitLoading}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <RepeatOutlined />
                          <Typography>Entrata ricorrente</Typography>
                        </Box>
                      }
                    />
                  )}
                />
              </Grid>

              {/* Opzioni ricorrenza */}
              <Collapse in={watchIsRecurring} sx={{ width: '100%' }}>
                <Grid container spacing={3} sx={{ mt: 0 }}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="recurringType"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.recurringType}>
                          <InputLabel>Tipo Ricorrenza</InputLabel>
                          <Select
                            {...field}
                            label="Tipo Ricorrenza"
                            disabled={submitLoading}
                          >
                            {recurringTypes.map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.label}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.recurringType && (
                            <FormHelperText>{errors.recurringType.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="recurringEndDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          {...field}
                          label="Data Fine Ricorrenza"
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !!errors.recurringEndDate,
                              helperText: errors.recurringEndDate?.message,
                              disabled: submitLoading,
                            },
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Collapse>

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
                  ? 'Aggiorna Entrata' 
                  : 'Crea Entrata'
              }
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default IncomeForm; 