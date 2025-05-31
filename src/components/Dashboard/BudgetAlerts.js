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
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  WarningOutlined,
  ErrorOutlined,
  CheckCircleOutlined,
  InfoOutlined,
} from '@mui/icons-material';

const BudgetAlerts = ({ 
  data, 
  loading = false, 
  title = "Stato Budget",
  formatCurrency
}) => {
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

  const defaultFormatAmount = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Usa la funzione personalizzata se fornita, altrimenti quella di default
  const amountFormatter = formatCurrency || defaultFormatAmount;

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
    <Box sx={{ width: '100%', display: 'block' }}>
      <Card sx={{ 
        height: '100%', 
        minHeight: '500px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <CardHeader 
          title={title}
          subheader={`Budget totale: ${amountFormatter(totalBudget)} (${overallPercentage}% utilizzato)`}
        />
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                    <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <Typography variant="body2" fontWeight="medium" component="span">
                        {budget.category}
                      </Typography>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          border: `1px solid ${budget.status === 'safe' ? '#4caf50' : budget.status === 'warning' ? '#ff9800' : '#f44336'}`,
                          borderRadius: '12px',
                          backgroundColor: budget.status === 'safe' ? '#e8f5e8' : budget.status === 'warning' ? '#fff3e0' : '#ffebee',
                          color: budget.status === 'safe' ? '#2e7d32' : budget.status === 'warning' ? '#e65100' : '#c62828',
                        }}
                      >
                        {getStatusText(budget.status, budget.percentage)}
                      </span>
                    </span>
                  }
                  secondary={
                    <span>
                      <span style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <Typography variant="caption" color="text.secondary" component="span">
                          {amountFormatter(budget.spentAmount)} di {amountFormatter(budget.budgetAmount)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" component="span">
                          Rimanenti: {amountFormatter(budget.budgetAmount - budget.spentAmount)}
                        </Typography>
                      </span>
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
                    </span>
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
    </Box>
  );
};

export default BudgetAlerts; 