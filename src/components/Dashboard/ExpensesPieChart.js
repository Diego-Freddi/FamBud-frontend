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
  useTheme,
  useMediaQuery,
} from '@mui/material';
import useWindowResize from '../../hooks/useWindowResize';

ChartJS.register(ArcElement, Tooltip, Legend);

const ExpensesPieChart = ({ 
  data, 
  loading = false, 
  title = "Spese per Categoria",
  formatCurrency
}) => {
  // Hook per gestire il ridimensionamento della finestra
  const windowSize = useWindowResize();
  
  // Hook per responsività
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Funzione di formattazione di default
  const defaultFormatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Usa la funzione personalizzata se fornita, altrimenti quella di default
  const currencyFormatter = formatCurrency || defaultFormatCurrency;

  // Processa i dati dall'API usando i colori reali delle categorie
  const processChartData = (apiData) => {
    if (!apiData || !Array.isArray(apiData)) return [];
    
    return apiData.map(item => ({
      category: item.categoryName || item.category || 'Sconosciuto',
      amount: item.totalAmount || item.amount || 0,
      color: item.color || item.categoryColor || '#6B7280', // Usa il colore reale della categoria
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
    resizeDelay: 0,
    interaction: {
      // Migliora l'interazione touch su mobile
      intersect: false,
      mode: 'nearest',
    },
    plugins: {
      legend: {
        display: false, // Usiamo una legenda personalizzata
      },
      tooltip: {
        enabled: true,
        // Migliora i tooltip per mobile
        position: 'nearest',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: theme.palette.primary.main,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${currencyFormatter(value)} (${percentage}%)`;
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
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader 
        title={title}
        subheader={`Totale: ${currencyFormatter(total)}`}
      />
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          flex: 1, 
          minHeight: isMobile ? 250 : 300,
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          {/* Grafico */}
          <Box sx={{ 
            flex: 1, 
            position: 'relative',
            minHeight: isMobile ? 200 : 250
          }}>
            <Pie 
              key={`pie-${windowSize.width}-${windowSize.height}`}
              data={pieData} 
              options={options} 
            />
          </Box>
          
          {/* Legenda personalizzata - nascosta su mobile */}
          {!isMobile && (
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
                          <Typography variant="body2" fontWeight="medium" component="span">
                            {item.category}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary" component="span">
                            {currencyFormatter(item.amount)} ({percentage}%)
                          </Typography>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}
          
          {/* Messaggio informativo su mobile */}
          {isMobile && (
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                💡 Tocca le sezioni del grafico per vedere i dettagli
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ExpensesPieChart; 