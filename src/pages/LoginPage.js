import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
} from '@mui/material';
import { LoginOutlined, FamilyRestroomOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { loginSchema } from '../utils/validationSchemas';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const [submitLoading, setSubmitLoading] = useState(false);

  // Controlla se c'è un messaggio dallo state (da JoinFamilyPage)
  const stateMessage = location.state?.message;
  
  // Controlla se l'utente arriva da un invito (solo se c'è il messaggio di stato)
  const isFromInvite = stateMessage && stateMessage.includes('invito');

  // Redirect se già autenticato
  useEffect(() => {
    if (isAuthenticated) {
      // Controlla se c'è un token di invito pendente E se l'utente arriva da un invito
      const pendingToken = localStorage.getItem('pendingInviteToken');
      if (pendingToken && isFromInvite) {
        navigate(`/join-family/${pendingToken}`, { replace: true });
        return;
      }
      
      // Se non arriva da un invito, pulisci eventuali token pendenti e vai alla dashboard
      if (!isFromInvite && pendingToken) {
        localStorage.removeItem('pendingInviteToken');
      }
      
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, isFromInvite]);

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Pulisci errori quando il componente si monta
  useEffect(() => {
    clearError();
  }, []); // Array vuoto - esegui solo al mount

  // Gestione submit
  const onSubmit = async (data) => {
    setSubmitLoading(true);
    clearError();

    try {
      const result = await login(data);
      
      if (result.success) {
        // Login riuscito, controlla se c'è un token di invito pendente E se arriva da invito
        const pendingToken = localStorage.getItem('pendingInviteToken');
        if (pendingToken && isFromInvite) {
          navigate(`/join-family/${pendingToken}`, { replace: true });
          return;
        }
        
        // Se non arriva da un invito, pulisci eventuali token pendenti
        if (!isFromInvite && pendingToken) {
          localStorage.removeItem('pendingInviteToken');
        }
        
        // Altrimenti redirect normale
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        // Errore dal server
        if (result.error.includes('email')) {
          setError('email', { message: result.error });
        } else if (result.error.includes('password')) {
          setError('password', { message: result.error });
        }
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Mostra loading durante il caricamento iniziale
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

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
            Accedi al tuo account
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Gestisci le finanze della tua famiglia in modo semplice e sicuro
          </Typography>

          {/* Messaggio da JoinFamilyPage */}
          {stateMessage && (
            <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
              {stateMessage}
            </Alert>
          )}

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
              {...register('email')}
              fullWidth
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
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
              autoComplete="current-password"
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
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
                  <LoginOutlined />
                )
              }
              sx={{ mt: 3, mb: 2 }}
            >
              {submitLoading ? 'Accesso in corso...' : 'Accedi'}
            </Button>

            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <MuiLink
                component={Link}
                to="/forgot-password"
                variant="body2"
                underline="hover"
              >
                Hai dimenticato la password?
              </MuiLink>
            </Box>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                oppure
              </Typography>
            </Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Non hai ancora un account?{' '}
                <MuiLink
                  component={Link}
                  to="/register"
                  variant="body2"
                  fontWeight="medium"
                  underline="hover"
                >
                  Registrati qui
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

export default LoginPage; 