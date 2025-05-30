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
} from '@mui/material';
import {
  SaveOutlined,
  CloseOutlined,
  CategoryOutlined,
  PaletteOutlined,
  EmojiObjectsOutlined,
} from '@mui/icons-material';
import { categorySchema } from '../../utils/validationSchemas';
import { categoryAPI } from '../../services/api';

// Colori predefiniti per le categorie
const PRESET_COLORS = [
  '#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2',
  '#303f9f', '#0288d1', '#00796b', '#689f38', '#fbc02d',
  '#ff8f00', '#f57c00', '#e64a19', '#5d4037', '#616161',
  '#455a64', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
  '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800'
];

// Icone predefinite per le categorie
const PRESET_ICONS = [
  '🏠', '🍕', '🚗', '💊', '🎬', '👕', '📚', '⚽', '✈️', '🎵',
  '💻', '🛒', '☕', '🍺', '🎁', '💰', '🏦', '⛽', '🚌', '🎯',
  '🔧', '🌟', '📱', '🎮', '🏃', '🍎', '🏥', '🎨', '📖', '🎪'
];

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

const CategoryForm = ({ 
  open, 
  onClose, 
  category = null, 
  onSuccess 
}) => {
  const isEdit = Boolean(category);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedColor, setSelectedColor] = useState('#1976d2');
  const [selectedIcon, setSelectedIcon] = useState('');
  const [customColor, setCustomColor] = useState('');

  // Setup form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#1976d2',
      icon: '',
    },
  });

  // Funzione per ottenere l'icona corretta (stessa del CategoriesPage)
  const getCategoryIcon = (iconValue, name) => {
    if (!iconValue) {
      return name?.charAt(0)?.toUpperCase() || '?';
    }
    
    // Se è un emoji (carattere Unicode), usalo direttamente
    if (iconValue.length <= 2 && /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(iconValue)) {
      return iconValue;
    }
    
    // Se è un nome di icona, mappalo a emoji
    if (ICON_MAP[iconValue]) {
      return ICON_MAP[iconValue];
    }
    
    // Fallback alla prima lettera del nome
    return name?.charAt(0)?.toUpperCase() || '?';
  };

  // Carica dati categoria se in modalità edit
  useEffect(() => {
    if (isEdit && category) {
      reset({
        name: category.name,
        description: category.description || '',
        color: category.color,
        icon: category.icon || '',
      });
      setSelectedColor(category.color);
      setSelectedIcon(category.icon || '');
    } else {
      reset({
        name: '',
        description: '',
        color: '#1976d2',
        icon: '',
      });
      setSelectedColor('#1976d2');
      setSelectedIcon('');
    }
  }, [isEdit, category, reset]);

  // Reset form quando si chiude
  useEffect(() => {
    if (!open) {
      setError('');
      setCustomColor('');
    }
  }, [open]);

  // Gestione colore
  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setValue('color', color);
    setCustomColor('');
  };

  const handleCustomColorChange = (event) => {
    const color = event.target.value;
    setCustomColor(color);
    if (color.match(/^#[0-9A-F]{6}$/i)) {
      setSelectedColor(color);
      setValue('color', color);
    }
  };

  // Gestione icona
  const handleIconSelect = (icon) => {
    setSelectedIcon(icon);
    setValue('icon', icon);
  };

  // Submit form
  const onSubmit = async (data) => {
    setSubmitLoading(true);
    setError('');

    try {
      let categoryData;
      
      // Per categorie default, invia solo colore e icona
      if (isEdit && category?.isDefault) {
        categoryData = {
          color: selectedColor,
          icon: selectedIcon,
        };
      } else {
        // Per categorie personalizzate, invia tutti i campi
        categoryData = {
          ...data,
          color: selectedColor,
          icon: selectedIcon,
        };
      }

      let response;
      if (isEdit) {
        response = await categoryAPI.updateCategory(category._id, categoryData);
      } else {
        response = await categoryAPI.createCategory(categoryData);
      }

      if (response.data.success) {
        onSuccess?.(response.data.data.category);
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
          <CategoryOutlined color="primary" />
          <Typography variant="h6">
            {isEdit ? 'Modifica Categoria' : 'Nuova Categoria'}
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

          {/* Avviso per categorie default */}
          {isEdit && category?.isDefault && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Per le categorie predefinite è possibile modificare solo colore e icona
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Preview categoria */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Anteprima
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: selectedColor,
                      width: 56,
                      height: 56,
                      fontSize: '1.5rem',
                    }}
                  >
                    {getCategoryIcon(selectedIcon, watch('name'))}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {watch('name') || 'Nome Categoria'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {watch('description') || 'Descrizione categoria'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Nome */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nome Categoria"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CategoryOutlined />
                        </InputAdornment>
                      ),
                    }}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    disabled={submitLoading || (isEdit && category?.isDefault)}
                  />
                )}
              />
            </Grid>

            {/* Descrizione */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Descrizione (opzionale)"
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    disabled={submitLoading || (isEdit && category?.isDefault)}
                  />
                )}
              />
            </Grid>

            {/* Selezione colore */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PaletteOutlined />
                <Typography variant="subtitle1" component="div">
                  Colore Categoria
                </Typography>
              </Box>
              
              {/* Colori predefiniti */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Colori predefiniti
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {PRESET_COLORS.map((color, index) => (
                    <Box
                      key={`color-${index}`}
                      onClick={() => handleColorSelect(color)}
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: color,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        border: selectedColor === color ? '3px solid #000' : '2px solid #fff',
                        boxShadow: 1,
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Colore personalizzato */}
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Colore personalizzato
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField
                    label="Codice colore"
                    value={customColor}
                    onChange={handleCustomColorChange}
                    placeholder="#1976d2"
                    size="small"
                    sx={{ width: 120 }}
                  />
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => handleColorSelect(e.target.value)}
                    style={{
                      width: 40,
                      height: 40,
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer',
                    }}
                  />
                  <Chip
                    label={selectedColor}
                    sx={{
                      backgroundColor: selectedColor,
                      color: 'white',
                    }}
                  />
                </Box>
              </Box>
            </Grid>

            {/* Selezione icona */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <EmojiObjectsOutlined />
                <Typography variant="subtitle1" component="div">
                  Icona Categoria (opzionale)
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Seleziona un'icona o lascia vuoto per usare la prima lettera del nome
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 200, overflowY: 'auto' }}>
                  {/* Opzione nessuna icona */}
                  <Box
                    onClick={() => handleIconSelect('')}
                    sx={{
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: selectedIcon === '' ? '2px solid #1976d2' : '1px solid #ddd',
                      borderRadius: 1,
                      cursor: 'pointer',
                      backgroundColor: selectedIcon === '' ? '#e3f2fd' : 'white',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}
                  >
                    ABC
                  </Box>
                  
                  {/* Icone predefinite */}
                  {PRESET_ICONS.map((icon, index) => (
                    <Box
                      key={`icon-${index}`}
                      onClick={() => handleIconSelect(icon)}
                      sx={{
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: selectedIcon === icon ? '2px solid #1976d2' : '1px solid #ddd',
                        borderRadius: 1,
                        cursor: 'pointer',
                        backgroundColor: selectedIcon === icon ? '#e3f2fd' : 'white',
                        fontSize: '1.2rem',
                        transition: 'all 0.2s',
                        '&:hover': {
                          backgroundColor: '#f5f5f5',
                        }
                      }}
                    >
                      {icon}
                    </Box>
                  ))}
                </Box>
              </Box>
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
                ? 'Aggiorna Categoria' 
                : 'Crea Categoria'
            }
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CategoryForm; 