import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  WarningOutlined,
  ErrorOutlined,
  CheckCircleOutlined,
  InfoOutlined,
} from '@mui/icons-material';

const BudgetAlerts = ({ data, loading = false, title = "Stato Budget" }) => {
  // Processa i dati dall'API
  const processBudgets = (apiData) => {
    if (!apiData || !Array.isArray(apiData)) return [];
    
    return apiData.map(item => {
      const percentage = item.percentageUsed || 0;
      let status = 'safe';
      
      if (percentage >= 100) {
        status = 'exceeded';
      } else if (percentage >= (item.alertThreshold || 80)) {
        status = 'warning';
      }
      
      return {
        id: item._id || item.id,
        category: item.categoryId?.name || 'Sconosciuto',
        budgetAmount: item.amount || 0,
        spentAmount: item.spent || 0,
        percentage: Math.round(percentage),
        status,
      };
    });
  };

  const budgets = processBudgets(data);
  
  // Se non ci sono dati, mostra messaggio
  if (!loading && (!budgets || budgets.length === 0)) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader title={title} />
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nessun budget configurato
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Imposta i tuoi budget mensili per tenere traccia delle spese
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'safe':
        return <CheckCircleOutlined color="success" />;
      case 'warning':
        return <WarningOutlined color="warning" />;
      case 'exceeded':
        return <ErrorOutlined color="error" />;
      default:
        return <InfoOutlined color="info" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'safe':
        return 'success';
      case 'warning':
        return 'warning';
      case 'exceeded':
        return 'error';
      default:
        return 'info';
    }
  };

  const getStatusText = (status, percentage) => {
    switch (status) {
      case 'safe':
        return `${percentage}% utilizzato`;
      case 'warning':
        return `${percentage}% - Attenzione!`;
      case 'exceeded':
        return `${percentage}% - Superato!`;
      default:
        return `${percentage}%`;
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'safe':
        return 'success';
      case 'warning':
        return 'warning';
      case 'exceeded':
        return 'error';
      default:
        return 'primary';
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Calcola statistiche generali
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.budgetAmount, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spentAmount, 0);
  const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const exceededCount = budgets.filter(b => b.status === 'exceeded').length;
  const warningCount = budgets.filter(b => b.status === 'warning').length;

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader title={title} />
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 200,
            }}
          >
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader 
        title={title}
        subheader={`Budget totale: ${formatAmount(totalBudget)} (${overallPercentage}% utilizzato)`}
      />
      <CardContent>
        {/* Avvisi generali */}
        {exceededCount > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {exceededCount} categorie hanno superato il budget!
          </Alert>
        )}
        
        {warningCount > 0 && exceededCount === 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {warningCount} categorie si stanno avvicinando al limite.
          </Alert>
        )}

        {exceededCount === 0 && warningCount === 0 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Tutti i budget sono sotto controllo! 🎉
          </Alert>
        )}

        {/* Lista budget */}
        <List disablePadding>
          {budgets.map((budget, index) => (
            <ListItem
              key={budget.id}
              sx={{
                px: 0,
                py: 1,
                borderBottom: index < budgets.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {getStatusIcon(budget.status)}
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {budget.category}
                    </Typography>
                    <Chip
                      label={getStatusText(budget.status, budget.percentage)}
                      size="small"
                      color={getStatusColor(budget.status)}
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatAmount(budget.spentAmount)} di {formatAmount(budget.budgetAmount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Rimanenti: {formatAmount(budget.budgetAmount - budget.spentAmount)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(budget.percentage, 100)}
                      color={getProgressColor(budget.status)}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'grey.200',
                      }}
                    />
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
        
        {budgets.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Nessun budget configurato
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetAlerts; 