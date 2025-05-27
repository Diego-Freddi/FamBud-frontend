import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

const PrivateRoute = ({ children, requireFamily = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Mostra loading durante il caricamento
  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Caricamento...
        </Typography>
      </Box>
    );
  }

  // Se non autenticato, reindirizza al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se richiede famiglia ma l'utente non ne ha una
  if (requireFamily && !user?.familyId) {
    return <Navigate to="/create-family" replace />;
  }

  // Se tutto ok, mostra il componente
  return children;
};

export default PrivateRoute; 