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
import { categoryColors } from '../../styles/theme';

const RecentTransactions = ({ data, loading = false, title = "Ultime Transazioni" }) => {
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
              Nessuna transazione recente
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Le tue ultime spese e entrate appariranno qui
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(date));
  };

  const formatAmount = (amount, type) => {
    const formatted = new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
    
    return type === 'income' ? `+${formatted}` : `-${formatted}`;
  };

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
    <Card sx={{ height: '100%' }}>
      <CardHeader 
        title={title}
        action={
          <IconButton size="small">
            <MoreVertOutlined />
          </IconButton>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <List disablePadding>
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
                      {formatAmount(transaction.amount, transaction.type)}
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
                      {formatDate(transaction.date)}
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
              Nessuna transazione recente
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTransactions; 