import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import useWindowResize from '../../hooks/useWindowResize';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MonthlyTrendChart = ({ 
  data, 
  loading = false, 
  title = "Andamento Mensile",
  formatCurrency
}) => {
  // Hook per gestire il ridimensionamento della finestra
  const windowSize = useWindowResize();
  
  // Funzione di formattazione di default
  const defaultFormatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Usa la funzione personalizzata se fornita, altrimenti quella di default
  const currencyFormatter = formatCurrency || defaultFormatCurrency;

  // Se non ci sono dati e non stiamo caricando, mostra messaggio
  if (!loading && (!data || !data.labels || data.labels.length === 0)) {
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
              Dati non disponibili
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              I dati del trend mensile verranno mostrati quando saranno disponibili più transazioni
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const barData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Entrate',
        data: data?.incomes || [],
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Spese',
        data: data?.expenses || [],
        backgroundColor: 'rgba(244, 67, 54, 0.8)',
        borderColor: 'rgba(244, 67, 54, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 0,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${currencyFormatter(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return currencyFormatter(value);
          },
        },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
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
      <CardHeader title={title} />
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, position: 'relative', minHeight: 300 }}>
          <Bar 
            key={`bar-${windowSize.width}-${windowSize.height}`}
            data={barData} 
            options={options} 
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default MonthlyTrendChart; 