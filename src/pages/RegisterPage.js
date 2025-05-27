import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Divider,
  Link as MuiLink,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { PersonAddOutlined, FamilyRestroomOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { registerSchema } from '../utils/validationSchemas';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated, error, clearError } = useAuth();
  const [submitLoading, setSubmitLoading] = useState(false);

  // Redirect se già autenticato
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      createFamily: false,
      familyName: '',
    },
  });

  const watchCreateFamily = watch('createFamily');

  // Pulisci errori quando il componente si monta
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Gestione submit
  const onSubmit = async (data) => {
    setSubmitLoading(true);
    clearError();

    try {
      const result = await registerUser(data);
      
      if (result.success) {
        // Registrazione riuscita
        navigate('/dashboard', { replace: true });
      } else {
        // Errore dal server
        if (result.error.includes('email')) {
          setError('email', { message: result.error });
        } else if (result.error.includes('nome')) {
          setError('name', { message: result.error });
        }
      }
    } catch (err) {
      console.error('Register error:', err);
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
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <FamilyRestroomOutlined
              sx={{ fontSize: 40, color: 'primary.main', mr: 1 }}
            />
            <Typography variant="h4" component="h1" fontWeight="bold">
              FamilyBudget
            </Typography>
          </Box>

          <Typography variant="h5" component="h2" gutterBottom>
            Crea il tuo account
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Inizia a gestire le finanze della tua famiglia oggi stesso
          </Typography>

          {/* Errore globale */}
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ width: '100%' }}
          >
            <TextField
              {...register('name')}
              fullWidth
              label="Nome completo"
              autoComplete="name"
              autoFocus
              margin="normal"
              error={!!errors.name}
              helperText={errors.name?.message}
              disabled={submitLoading}
            />

            <TextField
              {...register('email')}
              fullWidth
              label="Email"
              type="email"
              autoComplete="email"
              margin="normal"
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={submitLoading}
            />

            <TextField
              {...register('password')}
              fullWidth
              label="Password"
              type="password"
              autoComplete="new-password"
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={submitLoading}
            />

            <TextField
              {...register('confirmPassword')}
              fullWidth
              label="Conferma password"
              type="password"
              autoComplete="new-password"
              margin="normal"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              disabled={submitLoading}
            />

            <FormControlLabel
              control={
                <Checkbox
                  {...register('createFamily')}
                  disabled={submitLoading}
                />
              }
              label="Crea una nuova famiglia"
              sx={{ mt: 2, mb: 1 }}
            />

            {watchCreateFamily && (
              <TextField
                {...register('familyName')}
                fullWidth
                label="Nome della famiglia"
                margin="normal"
                error={!!errors.familyName}
                helperText={errors.familyName?.message}
                disabled={submitLoading}
                placeholder="es. Famiglia Rossi"
              />
            )}

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
                  <PersonAddOutlined />
                )
              }
              sx={{ mt: 3, mb: 2 }}
            >
              {submitLoading ? 'Registrazione in corso...' : 'Registrati'}
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                oppure
              </Typography>
            </Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Hai già un account?{' '}
                <MuiLink
                  component={Link}
                  to="/login"
                  variant="body2"
                  fontWeight="medium"
                  underline="hover"
                >
                  Accedi qui
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © 2024 FamilyBudget. Gestione familiare delle finanze.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterPage; 