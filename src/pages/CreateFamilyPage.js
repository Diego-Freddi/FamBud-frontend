import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { FamilyRestroomOutlined, AddOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { createFamilySchema } from '../utils/validationSchemas';

const CreateFamilyPage = () => {
  const navigate = useNavigate();
  const { createFamily, user } = useAuth();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(createFamilySchema),
  });

  const onSubmit = async (data) => {
    setSubmitLoading(true);
    setError('');

    try {
      const result = await createFamily(data);
      
      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Errore durante la creazione della famiglia');
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
            Crea la tua famiglia
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
            Ciao <strong>{user?.name}</strong>!
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Per iniziare a gestire le finanze, crea la tua famiglia o attendi un invito da un familiare.
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
              {...register('name')}
              fullWidth
              label="Nome della famiglia"
              autoFocus
              margin="normal"
              error={!!errors.name}
              helperText={errors.name?.message}
              disabled={submitLoading}
              placeholder="es. Famiglia Rossi"
            />

            <TextField
              {...register('description')}
              fullWidth
              label="Descrizione (opzionale)"
              multiline
              rows={3}
              margin="normal"
              error={!!errors.description}
              helperText={errors.description?.message}
              disabled={submitLoading}
              placeholder="Una breve descrizione della vostra famiglia..."
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
                  <AddOutlined />
                )
              }
              sx={{ mt: 3, mb: 2 }}
            >
              {submitLoading ? 'Creazione in corso...' : 'Crea famiglia'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Diventerai automaticamente l'amministratore della famiglia e potrai invitare altri membri.
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateFamilyPage; 