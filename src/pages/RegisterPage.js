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
  Card,
  CardContent,
} from '@mui/material';
import { PersonAddOutlined, FamilyRestroomOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { registerSchema } from '../utils/validationSchemas';
import { familyAPI } from '../services/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register: registerUser, isAuthenticated, error, clearError } = useAuth();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [inviteDetails, setInviteDetails] = useState(null);
  const [loadingInviteDetails, setLoadingInviteDetails] = useState(false);

  // Controlla se c'è un messaggio dallo state (da JoinFamilyPage)
  const stateMessage = location.state?.message;
  
  // Controlla se l'utente arriva da un invito (solo se c'è il messaggio di stato)
  const isFromInvite = stateMessage && stateMessage.includes('invito');
  
  // Controlla se c'è un token di invito pendente SOLO se arriva da invito
  const pendingToken = isFromInvite ? localStorage.getItem('pendingInviteToken') : null;

  // Carica i dettagli dell'invito se c'è un token pendente
  useEffect(() => {
    const loadInviteDetails = async () => {
      if (!pendingToken) return;

      setLoadingInviteDetails(true);
      try {
        const response = await familyAPI.verifyInvite(pendingToken);
        if (response.data.success) {
          setInviteDetails(response.data.data);
        }
      } catch (err) {
        console.error('Errore nel caricamento dettagli invito:', err);
        // Non mostrare errore all'utente, continua con la registrazione normale
      } finally {
        setLoadingInviteDetails(false);
      }
    };

    loadInviteDetails();
  }, [pendingToken]);

  // Redirect se già autenticato
  useEffect(() => {
    if (isAuthenticated) {
      // Controlla se c'è un token di invito pendente E se l'utente arriva da un invito
      if (pendingToken && isFromInvite) {
        navigate(`/join-family/${pendingToken}`, { replace: true });
        return;
      }
      
      // Se non arriva da un invito, pulisci eventuali token pendenti
      if (!isFromInvite) {
        const anyPendingToken = localStorage.getItem('pendingInviteToken');
        if (anyPendingToken) {
          localStorage.removeItem('pendingInviteToken');
        }
      }
      
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, pendingToken, isFromInvite]);

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      createFamily: !pendingToken, // false se c'è un invito pendente, true altrimenti
      familyName: '',
    },
  });

  // Pulisci errori quando il componente si monta
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Gestione submit
  const onSubmit = async (data) => {
    console.log('🚀 RegisterPage - onSubmit function called!');
    setSubmitLoading(true);
    clearError();

    try {
      console.log('🔍 RegisterPage - Starting registration with data:', {
        name: data.name,
        email: data.email,
        hasPassword: !!data.password,
        hasConfirmPassword: !!data.confirmPassword,
        createFamily: data.createFamily,
        familyName: data.familyName,
        pendingToken,
        isFromInvite
      });

      // Prepara i dati da inviare al backend
      const registrationData = {
        name: data.name,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      };

      // Includi familyName SOLO se createFamily è true
      if (data.createFamily && data.familyName) {
        registrationData.familyName = data.familyName;
      }

      console.log('📤 RegisterPage - Sending registration data:', registrationData);

      const result = await registerUser(registrationData);
      
      console.log('📥 RegisterPage - Registration result:', result);
      
      if (result.success) {
        console.log('✅ RegisterPage - Registration successful');
        
        // Registrazione riuscita, controlla se c'è un token di invito pendente E se arriva da invito
        if (pendingToken && isFromInvite) {
          console.log('🔄 RegisterPage - Redirecting to join family with token:', pendingToken);
          navigate(`/join-family/${pendingToken}`, { replace: true });
          return;
        }
        
        // Se non arriva da un invito, pulisci eventuali token pendenti
        if (!isFromInvite) {
          const anyPendingToken = localStorage.getItem('pendingInviteToken');
          if (anyPendingToken) {
            console.log('🧹 RegisterPage - Cleaning pending token');
            localStorage.removeItem('pendingInviteToken');
          }
        }
        
        // Altrimenti redirect normale
        console.log('🏠 RegisterPage - Redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        console.error('❌ RegisterPage - Registration failed:', result.error);
        
        // Errore dal server
        if (result.error.includes('email')) {
          setError('email', { message: result.error });
        } else if (result.error.includes('nome')) {
          setError('name', { message: result.error });
        } else {
          // Mostra errore generico se non è specifico per un campo
          console.error('❌ RegisterPage - Generic error:', result.error);
          // L'errore generico dovrebbe essere già gestito dallo stato error del context
        }
      }
    } catch (err) {
      console.error('💥 RegisterPage - Exception during registration:', err);
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
            {pendingToken ? 'Registrati per accettare l\'invito' : 'Crea il tuo account'}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {pendingToken 
              ? 'Completa la registrazione per unirti alla famiglia'
              : 'Inizia a gestire le finanze della tua famiglia oggi stesso'
            }
          </Typography>

          {/* Dettagli invito */}
          {pendingToken && inviteDetails && !loadingInviteDetails && (
            <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary.main">
                  📋 Invito Famiglia
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Famiglia:</strong> {inviteDetails.familyName}
                </Typography>
                {inviteDetails.familyDescription && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {inviteDetails.familyDescription}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Invitato da:</strong> {inviteDetails.inviterName}
                </Typography>
                <Typography variant="body2">
                  <strong>Ruolo:</strong> {inviteDetails.role === 'admin' ? 'Amministratore' : 'Membro'}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Messaggio da JoinFamilyPage */}
          {stateMessage && (
            <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
              {stateMessage}
            </Alert>
          )}

          {/* Avviso invito pendente */}
          {pendingToken && !inviteDetails && !loadingInviteDetails && (
            <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
              Hai un invito famiglia pendente. Dopo la registrazione verrai automaticamente reindirizzato per accettarlo.
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

            {/* Campo nome famiglia condizionale */}
            {!pendingToken && (
              <TextField
                {...register('familyName')}
                fullWidth
                label="Nome famiglia"
                margin="normal"
                error={!!errors.familyName}
                helperText={errors.familyName?.message || 'Inserisci il nome della tua famiglia'}
                disabled={submitLoading}
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={submitLoading}
              onClick={() => {
                console.log('🖱️ RegisterPage - Button clicked!');
                console.log('🔍 RegisterPage - Form errors:', errors);
                console.log('🔍 RegisterPage - Submit loading:', submitLoading);
              }}
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