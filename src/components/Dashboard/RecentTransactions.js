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
  Chip,
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
  // Dati di esempio se non ci sono dati reali
  const defaultData = [
    {
      id: 1,
      type: 'expense',
      description: 'Spesa al supermercato',
      category: 'Alimentari',
      amount: 45.50,
      date: new Date('2024-01-15'),
      user: 'Mario Rossi',
    },
    {
      id: 2,
      type: 'income',
      description: 'Stipendio gennaio',
      category: 'Stipendio',
      amount: 2500.00,
      date: new Date('2024-01-01'),
      user: 'Mario Rossi',
    },
    {
      id: 3,
      type: 'expense',
      description: 'Benzina auto',
      category: 'Trasporti',
      amount: 65.00,
      date: new Date('2024-01-14'),
      user: 'Anna Rossi',
    },
    {
      id: 4,
      type: 'expense',
      description: 'Bolletta elettricità',
      category: 'Casa',
      amount: 120.30,
      date: new Date('2024-01-13'),
      user: 'Mario Rossi',
    },
    {
      id: 5,
      type: 'expense',
      description: 'Cinema',
      category: 'Intrattenimento',
      amount: 24.00,
      date: new Date('2024-01-12'),
      user: 'Anna Rossi',
    },
  ];

  const transactions = data || defaultData;

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
    
    // Usa il colore della categoria se disponibile
    const categoryKey = category?.toLowerCase().replace(/\s+/g, '');
    return categoryColors[categoryKey] || 'error.main';
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" fontWeight="medium">
                      {transaction.description}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                    >
                      {formatAmount(transaction.amount, transaction.type)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={transaction.category}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem', height: 20 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {transaction.user}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(transaction.date)}
                    </Typography>
                  </Box>
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