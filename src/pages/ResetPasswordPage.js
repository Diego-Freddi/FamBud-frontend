import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { LockResetOutlined, FamilyRestroomOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { resetPasswordSchema } from '../utils/validationSchemas';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    setSubmitLoading(true);
    setError('');

    try {
      const result = await resetPassword(token, data.password);
      
      if (result.success) {
        navigate('/login', { 
          state: { message: 'Password reimpostata con successo! Ora puoi accedere.' }
        });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Errore durante il reset della password');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <FamilyRestroomOutlined
              sx={{ fontSize: 40, color: 'primary.main', mr: 1 }}
            />
            <Typography variant="h4" component="h1" fontWeight="bold">
              FamilyBudget
            </Typography>
          </Box>

          <Typography variant="h5" component="h2" gutterBottom>
            Nuova password
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Inserisci la tua nuova password
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ width: '100%' }}
          >
            <TextField
              {...register('password')}
              fullWidth
              label="Nuova password"
              type="password"
              autoComplete="new-password"
              autoFocus
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={submitLoading}
            />

            <TextField
              {...register('confirmPassword')}
              fullWidth
              label="Conferma nuova password"
              type="password"
              autoComplete="new-password"
              margin="normal"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              disabled={submitLoading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={submitLoading}
              startIcon={
                submitLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <LockResetOutlined />
                )
              }
              sx={{ mt: 3, mb: 2 }}
            >
              {submitLoading ? 'Aggiornamento in corso...' : 'Aggiorna password'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPasswordPage; 