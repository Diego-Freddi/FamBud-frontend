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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MonthlyTrendChart = ({ data, loading = false, title = "Andamento Mensile" }) => {
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
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: €${context.parsed.y.toFixed(2)}`;
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
            return '€' + value;
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
    <Card sx={{ height: '100%' }}>
      <CardHeader title={title} />
      <CardContent>
        <Box sx={{ height: 300, position: 'relative' }}>
          <Bar data={barData} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default MonthlyTrendChart; 