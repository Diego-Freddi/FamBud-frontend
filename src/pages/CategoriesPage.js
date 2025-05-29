import React, { useState, useCallback, useEffect } from 'react';
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
} from '@mui/material';
import {
  AddOutlined,
  MoreVertOutlined,
  EditOutlined,
  DeleteOutlined,
  CategoryOutlined,
  RefreshOutlined,
  PaletteOutlined,
  BarChartOutlined,
  DragIndicatorOutlined,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { categoryAPI } from '../services/api';
import CategoryForm from '../components/Categories/CategoryForm';
import { categoryColors } from '../styles/theme';

// Mappatura icone backend a emoji
const ICON_MAP = {
  'shopping-cart': '🛒',
  'car': '🚗',
  'home': '🏠',
  'heart': '💊',
  'film': '🎬',
  'shirt': '👕',
  'book': '📚',
  'more-horizontal': '⚫',
  // Aggiungi altre mappature se necessario
};

const CategoriesPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Stati per form e modali
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedCategoryStats, setSelectedCategoryStats] = useState(null);
  
  // Menu per azioni
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Stati per categorie - gestione manuale
  const [categoriesData, setCategoriesData] = useState(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);

  // Stati per statistiche - gestione manuale
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Carica categorie
  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);
      const response = await categoryAPI.getCategories();
      setCategoriesData(response.data);
    } catch (error) {
      console.error('❌ Errore caricamento categorie:', error);
      setCategoriesError(error.response?.data?.message || 'Errore nel caricamento delle categorie');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Carica statistiche
  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await categoryAPI.getCategoryStats();
      setStatsData(response.data);
    } catch (error) {
      console.error('❌ Errore caricamento statistiche:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Carica dati iniziali
  useEffect(() => {
    loadCategories();
    loadStats();
  }, [loadCategories, loadStats]);

  // Funzione refetch per uso esterno
  const refetchCategories = useCallback(() => {
    loadCategories();
    loadStats();
  }, [loadCategories, loadStats]);

  const categories = categoriesData?.data?.categories || [];
  const stats = statsData?.data?.stats || {};

  // Funzione per ottenere l'icona corretta
  const getCategoryIcon = (category) => {
    if (!category.icon) {
      return category.name.charAt(0).toUpperCase();
    }
    
    // Se è un emoji (carattere Unicode), usalo direttamente
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
  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setFormOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteCategory = (category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  };

  const handleViewStats = (category) => {
    setSelectedCategoryStats(category);
    setStatsDialogOpen(true);
    setAnchorEl(null);
  };

  const confirmDelete = async () => {
    try {
      await categoryAPI.deleteCategory(categoryToDelete._id);
      refetchCategories();
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Errore durante l\'eliminazione:', error);
    }
  };

  const handleFormSuccess = useCallback(() => {
    refetchCategories();
    setFormOpen(false);
    setEditingCategory(null);
  }, []);

  // Menu azioni
  const handleMenuOpen = (event, category) => {
    setAnchorEl(event.currentTarget);
    setSelectedCategory(category);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCategory(null);
  };

  // Formattazione
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getCategoryUsage = (categoryId) => {
    const categoryStats = stats.byCategory?.find(s => s._id === categoryId);
    return categoryStats || { totalAmount: 0, count: 0, percentage: 0 };
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 30) return 'error';
    if (percentage >= 15) return 'warning';
    return 'success';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Gestione Categorie
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {categories.length} categorie configurate
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={refetchCategories} disabled={categoriesLoading}>
              <RefreshOutlined />
            </IconButton>
            {!isMobile && (
              <Button
                variant="contained"
                startIcon={<AddOutlined />}
                onClick={handleAddCategory}
              >
                Nuova Categoria
              </Button>
            )}
          </Box>
        </Box>

        {/* Statistiche generali */}
        {!statsLoading && stats.total && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistiche Generali
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {categories.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Categorie Totali
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {stats.total?.activeCategories || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Categorie Attive
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {formatAmount(stats.total?.totalSpent || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Speso Totale
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {stats.total?.totalTransactions || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Transazioni
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Errori */}
      {categoriesError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Errore nel caricamento delle categorie: {categoriesError}
        </Alert>
      )}

      {/* Lista categorie */}
      {categoriesLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CategoryOutlined sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nessuna categoria trovata
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Inizia creando la tua prima categoria personalizzata
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={handleAddCategory}
            >
              Crea Prima Categoria
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {categories.map((category) => {
            const usage = getCategoryUsage(category._id);
            const usageColor = getUsageColor(usage.percentage);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={category._id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    }
                  }}
                >
                  <CardContent>
                    {/* Header categoria */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <Avatar
                          sx={{
                            bgcolor: category.color,
                            width: 40,
                            height: 40,
                            fontSize: '1.2rem',
                          }}
                        >
                          {getCategoryIcon(category)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {category.name}
                          </Typography>
                          {category.description && (
                            <Typography variant="body2" color="text.secondary">
                              {category.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {category.isDefault && (
                          <Chip 
                            label="Default" 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, category)}
                        >
                          <MoreVertOutlined />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Statistiche utilizzo */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Utilizzo del mese
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color={`${usageColor}.main`}>
                          {usage.percentage.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(usage.percentage, 100)}
                        color={usageColor}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>

                    {/* Dettagli spese */}
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="error.main" fontWeight="bold">
                            {formatAmount(usage.totalAmount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Speso
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="info.main" fontWeight="bold">
                            {usage.count}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Transazioni
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
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
          aria-label="add category"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
          onClick={handleAddCategory}
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
        <MenuItemComponent onClick={() => handleEditCategory(selectedCategory)}>
          <EditOutlined sx={{ mr: 1 }} />
          Modifica
        </MenuItemComponent>
        <MenuItemComponent onClick={() => handleViewStats(selectedCategory)}>
          <BarChartOutlined sx={{ mr: 1 }} />
          Statistiche
        </MenuItemComponent>
        {selectedCategory && !selectedCategory.isDefault && (
          <MenuItemComponent onClick={() => handleDeleteCategory(selectedCategory)}>
            <DeleteOutlined sx={{ mr: 1 }} />
            Elimina
          </MenuItemComponent>
        )}
      </Menu>

      {/* Form categoria */}
      <CategoryForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        category={editingCategory}
        onSuccess={handleFormSuccess}
      />

      {/* Dialog conferma eliminazione */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Conferma Eliminazione</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler eliminare la categoria "{categoryToDelete?.name}"?
            Questa azione non può essere annullata e tutte le spese associate verranno spostate nella categoria "Altro".
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

      {/* Dialog statistiche categoria */}
      <Dialog 
        open={statsDialogOpen} 
        onClose={() => setStatsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                bgcolor: selectedCategoryStats?.color,
                width: 32,
                height: 32,
                fontSize: '1rem',
              }}
            >
              {selectedCategoryStats && getCategoryIcon(selectedCategoryStats)}
            </Avatar>
            Statistiche - {selectedCategoryStats?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedCategoryStats && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Dettagli utilizzo categoria per il mese corrente
              </Typography>
              
              {/* Implementare qui statistiche dettagliate */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Funzionalità statistiche dettagliate in arrivo...
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsDialogOpen(false)}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoriesPage; 