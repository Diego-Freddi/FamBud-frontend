import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
} from '@mui/material';
import { TrendingUpOutlined, TrendingDownOutlined } from '@mui/icons-material';

const StatsCard = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
  trendValue,
  loading = false,
}) => {
  const formatValue = (val) => {
    if (typeof val === 'number') {
      return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
      }).format(val);
    }
    return val;
  };

  const getTrendColor = () => {
    if (!trend) return 'default';
    return trend === 'up' ? 'success' : trend === 'down' ? 'error' : 'default';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUpOutlined fontSize="small" />;
    if (trend === 'down') return <TrendingDownOutlined fontSize="small" />;
    return null;
  };

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: (theme) => theme.shadows[8],
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            
            <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 1 }}>
              {loading ? '...' : formatValue(value)}
            </Typography>
            
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            
            {trend && trendValue && (
              <Box sx={{ mt: 1 }}>
                <Chip
                  icon={getTrendIcon()}
                  label={`${trendValue}%`}
                  size="small"
                  color={getTrendColor()}
                  variant="outlined"
                />
              </Box>
            )}
          </Box>
          
          {icon && (
            <Avatar
              sx={{
                bgcolor: `${color}.main`,
                width: 56,
                height: 56,
              }}
            >
              {icon}
            </Avatar>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard; 