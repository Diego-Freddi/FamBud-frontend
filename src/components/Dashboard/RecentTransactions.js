import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  ReceiptOutlined,
  TrendingUpOutlined,
  MoreVertOutlined,
} from '@mui/icons-material';

const RecentTransactions = ({ 
  data, 
  loading = false, 
  title = "Transazioni del Mese",
  formatCurrency,
  formatDate: customFormatDate
}) => {
  // Processa i dati dall'API
  const processTransactions = (apiData) => {
    if (!apiData || !Array.isArray(apiData)) return [];
    
    return apiData.map(item => ({
      id: item._id || item.id,
      type: item.type,
      description: item.description,
      category: item.categoryId?.name || item.category?.name || item.source || 'Sconosciuto',
      amount: item.amount,
      date: new Date(item.date),
      user: item.userId?.name || 'Utente',
    }));
  };

  const transactions = processTransactions(data);
  
  // Se non ci sono dati, mostra messaggio
  if (!loading && (!transactions || transactions.length === 0)) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader title={title} />
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nessuna transazione questo mese
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Le tue spese e entrate del mese appariranno qui
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const defaultFormatDate = (date) => {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(date));
  };

  const defaultFormatAmount = (amount, type) => {
    const formatted = new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
    
    return type === 'income' ? `+${formatted}` : `-${formatted}`;
  };

  // Usa le funzioni personalizzate se fornite, altrimenti quelle di default
  const dateFormatter = customFormatDate || defaultFormatDate;
  const amountFormatter = formatCurrency ? 
    (amount, type) => {
      const formatted = formatCurrency(amount);
      return type === 'income' ? `+${formatted}` : `-${formatted}`;
    } : defaultFormatAmount;

  const getTransactionIcon = (type, category) => {
    if (type === 'income') {
      return <TrendingUpOutlined />;
    }
    return <ReceiptOutlined />;
  };

  const getTransactionColor = (type, category) => {
    if (type === 'income') {
      return 'success.main';
    }
    
    // Per le spese, usa sempre il colore rosso standard per coerenza con le card
    return 'error.main';
  };

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
          action={
            <IconButton size="small">
              <MoreVertOutlined />
            </IconButton>
          }
        />
        <CardContent sx={{ pt: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <List 
            disablePadding
            sx={{
              maxHeight: '400px',
              overflowY: 'auto',
              pr: 1,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'transparent',
                borderRadius: '3px',
                transition: 'background-color 0.2s ease',
              },
              '&:hover::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.2)',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: 'rgba(0,0,0,0.3)',
              },
            }}
          >
            {transactions.map((transaction, index) => (
              <ListItem
                key={transaction.id}
                sx={{
                  px: 0,
                  borderBottom: index < transactions.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: getTransactionColor(transaction.type, transaction.category),
                      width: 40,
                      height: 40,
                    }}
                  >
                    {getTransactionIcon(transaction.type, transaction.category)}
                  </Avatar>
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight="medium" component="span">
                        {transaction.description}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                        component="span"
                      >
                        {amountFormatter(transaction.amount, transaction.type)}
                      </Typography>
                    </span>
                  }
                  secondary={
                    <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '12px',
                            backgroundColor: '#f5f5f5',
                            color: '#666',
                          }}
                        >
                          {transaction.category}
                        </span>
                        <Typography variant="caption" color="text.secondary" component="span">
                          {transaction.user}
                        </Typography>
                      </span>
                      <Typography variant="caption" color="text.secondary" component="span">
                        {dateFormatter(transaction.date)}
                      </Typography>
                    </span>
                  }
                />
              </ListItem>
            ))}
          </List>
          
          {transactions.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Nessuna transazione questo mese
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RecentTransactions; 