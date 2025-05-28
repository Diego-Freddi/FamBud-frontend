import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { categoryColors } from '../../styles/theme';

ChartJS.register(ArcElement, Tooltip, Legend);

const ExpensesPieChart = ({ data, loading = false, title = "Spese per Categoria" }) => {
  // Processa i dati dall'API
  const processChartData = (apiData) => {
    if (!apiData || !Array.isArray(apiData)) return [];
    
    return apiData.map(item => ({
      category: item.categoryName || item.category || 'Sconosciuto',
      amount: item.totalAmount || item.amount || 0,
      color: categoryColors[item.categoryName?.toLowerCase().replace(/\s+/g, '')] || categoryColors.altro,
    }));
  };

  const chartData = processChartData(data);
  
  // Se non ci sono dati, mostra messaggio
  if (!loading && (!chartData || chartData.length === 0)) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader title={title} />
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: 300,
              gap: 2,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Nessuna spesa registrata
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Inizia ad aggiungere le tue spese per vedere i grafici
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const pieData = {
    labels: chartData.map(item => item.category),
    datasets: [
      {
        data: chartData.map(item => item.amount),
        backgroundColor: chartData.map(item => item.color),
        borderColor: chartData.map(item => item.color),
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Usiamo una legenda personalizzata
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `€${value.toFixed(2)} (${percentage}%)`;
          },
        },
      },
    },
  };

  const total = chartData.reduce((sum, item) => sum + item.amount, 0);

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
              height: 300,
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
        subheader={`Totale: €${total.toFixed(2)}`}
      />
      <CardContent>
        <Box sx={{ display: 'flex', gap: 2, height: 300 }}>
          {/* Grafico */}
          <Box sx={{ flex: 1, position: 'relative' }}>
            <Pie data={pieData} options={options} />
          </Box>
          
          {/* Legenda personalizzata */}
          <Box sx={{ width: 200 }}>
            <List dense>
              {chartData.map((item, index) => {
                const percentage = ((item.amount / total) * 100).toFixed(1);
                return (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          backgroundColor: item.color,
                          borderRadius: '50%',
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight="medium">
                          {item.category}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          €{item.amount.toFixed(2)} ({percentage}%)
                        </Typography>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ExpensesPieChart; 