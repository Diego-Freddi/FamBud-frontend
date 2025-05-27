import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Link as MuiLink,
} from '@mui/material';
import { EmailOutlined, ArrowBackOutlined, FamilyRestroomOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { forgotPasswordSchema } from '../utils/validationSchemas';

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    setSubmitLoading(true);
    setError('');

    try {
      const result = await forgotPassword(data.email);
      
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Errore durante l\'invio della richiesta');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (success) {
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
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <EmailOutlined sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Email inviata!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Controlla la tua casella email per le istruzioni su come reimpostare la password.
            </Typography>
            <Button
              component={Link}
              to="/login"
              variant="contained"
              startIcon={<ArrowBackOutlined />}
            >
              Torna al login
            </Button>
          </Paper>
        </Box>
      </Container>
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <FamilyRestroomOutlined
              sx={{ fontSize: 40, color: 'primary.main', mr: 1 }}
            />
            <Typography variant="h4" component="h1" fontWeight="bold">
              FamilyBudget
            </Typography>
          </Box>

          <Typography variant="h5" component="h2" gutterBottom>
            Recupera password
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Inserisci la tua email e ti invieremo le istruzioni per reimpostare la password
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
                  <EmailOutlined />
                )
              }
              sx={{ mt: 3, mb: 2 }}
            >
              {submitLoading ? 'Invio in corso...' : 'Invia email di recupero'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <MuiLink
                component={Link}
                to="/login"
                variant="body2"
                underline="hover"
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
              >
                <ArrowBackOutlined fontSize="small" />
                Torna al login
              </MuiLink>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage; 