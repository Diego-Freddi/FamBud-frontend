import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Divider,
  Chip,
} from '@mui/material';
import { 
  FamilyRestroomOutlined, 
  PersonAddOutlined, 
  LoginOutlined,
  OpenInNewOutlined,
  PersonOutlined,
  EmailOutlined
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { familyAPI } from '../services/api';

const JoinFamilyPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inviteDetails, setInviteDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // Carica i dettagli dell'invito
  useEffect(() => {
    const loadInviteDetails = async () => {
      if (!token) {
        setLoadingDetails(false);
        return;
      }

      try {
        const response = await familyAPI.verifyInvite(token);
        if (response.data.success) {
          setInviteDetails(response.data.data);
        } else {
          setError(response.data.message || 'Invito non valido');
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Errore nel caricamento dei dettagli dell\'invito';
        setError(errorMessage);
      } finally {
        setLoadingDetails(false);
      }
    };

    loadInviteDetails();
  }, [token]);

  // Gestisce l'accettazione dell'invito
  const handleAcceptInvite = async () => {
    if (!isAuthenticated) {
      // Salva il token SOLO quando l'utente sceglie di andare al login
      localStorage.setItem('pendingInviteToken', token);
      navigate('/login', { 
        state: { 
          from: location,
          message: 'Effettua il login per accettare l\'invito alla famiglia'
        }
      });
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await familyAPI.joinFamily(token);
      
      if (response.data.success) {
        setSuccess('Ti sei unito alla famiglia con successo!');
        // Rimuovi il token se presente
        localStorage.removeItem('pendingInviteToken');
        
        // Reindirizza alla dashboard dopo 2 secondi
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
          window.location.reload(); // Forza il refresh per aggiornare il context
        }, 2000);
      } else {
        setError(response.data.message || 'Errore nell\'accettazione dell\'invito');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Errore nell\'accettazione dell\'invito';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Gestisce il reindirizzamento al login
  const handleGoToLogin = () => {
    // Salva il token SOLO quando l'utente sceglie di andare al login
    localStorage.setItem('pendingInviteToken', token);
    navigate('/login', { 
      state: { 
        from: location,
        message: 'Effettua il login per accettare l\'invito alla famiglia'
      }
    });
  };

  // Gestisce il reindirizzamento alla registrazione
  const handleGoToRegister = () => {
    // Salva il token SOLO quando l'utente sceglie di andare alla registrazione
    localStorage.setItem('pendingInviteToken', token);
    navigate('/register', { 
      state: { 
        from: location,
        message: 'Registrati per accettare l\'invito alla famiglia'
      }
    });
  };

  // Apre il link in una nuova finestra incognito (istruzioni)
  const handleOpenInIncognito = () => {
    const currentUrl = window.location.href;
    
    // Copia il link negli appunti
    navigator.clipboard.writeText(currentUrl).then(() => {
      alert('Link copiato negli appunti!\n\nPer accettare l\'invito:\n1. Apri una finestra in incognito\n2. Incolla questo link\n3. Effettua login/registrazione con l\'account corretto');
    }).catch(() => {
      alert('Per accettare l\'invito:\n1. Copia questo link: ' + currentUrl + '\n2. Apri una finestra in incognito\n3. Incolla il link\n4. Effettua login/registrazione con l\'account corretto');
    });
  };

  if (!token) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box textAlign="center">
            <Alert severity="error">
              Link di invito non valido. Il token è mancante.
            </Alert>
            <Button 
              variant="contained" 
              onClick={() => navigate('/login')}
              sx={{ mt: 2 }}
            >
              Vai al Login
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  if (loadingDetails) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box textAlign="center">
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body1">
              Caricamento dettagli invito...
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" mb={3}>
          <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'primary.main', width: 56, height: 56 }}>
            <FamilyRestroomOutlined fontSize="large" />
          </Avatar>
          <Typography variant="h4" component="h1" gutterBottom>
            Invito Famiglia
          </Typography>
          {inviteDetails ? (
            <Typography variant="body1" color="text.secondary">
              Sei stato invitato a unirti alla famiglia <strong>{inviteDetails.familyName}</strong>
            </Typography>
          ) : (
            <Typography variant="body1" color="text.secondary">
              Sei stato invitato a unirti a una famiglia su FamilyBudget
            </Typography>
          )}
        </Box>

        {/* Dettagli invito */}
        {inviteDetails && (
          <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary.main">
                📋 Dettagli Invito
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FamilyRestroomOutlined color="primary" fontSize="small" />
                  <Typography variant="body2">
                    <strong>Famiglia:</strong> {inviteDetails.familyName}
                  </Typography>
                </Box>
                {inviteDetails.familyDescription && (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                    {inviteDetails.familyDescription}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonOutlined color="primary" fontSize="small" />
                  <Typography variant="body2">
                    <strong>Invitato da:</strong> {inviteDetails.inviterName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailOutlined color="primary" fontSize="small" />
                  <Typography variant="body2">
                    <strong>Email invitata:</strong> {inviteDetails.invitedEmail}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label={inviteDetails.role === 'admin' ? 'Amministratore' : 'Membro'} 
                    color={inviteDetails.role === 'admin' ? 'secondary' : 'primary'}
                    size="small"
                  />
                  <Typography variant="body2">
                    <strong>Ruolo:</strong> {inviteDetails.role === 'admin' ? 'Amministratore' : 'Membro'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* Verifica email se l'utente è autenticato */}
        {isAuthenticated && inviteDetails && user?.email !== inviteDetails.invitedEmail && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Attenzione:</strong> Sei loggato come <strong>{user.email}</strong>, 
              ma l'invito è stato inviato a <strong>{inviteDetails.invitedEmail}</strong>.
            </Typography>
          </Alert>
        )}

        {!isAuthenticated ? (
          // Utente non autenticato - mostra opzioni login/registrazione
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Accesso Richiesto
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Per accettare l'invito devi effettuare il login con l'account corretto o registrarti se non hai ancora un account.
              </Typography>
              {inviteDetails && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <strong>Importante:</strong> L'invito è stato inviato a <strong>{inviteDetails.invitedEmail}</strong>. 
                  Assicurati di accedere con questo indirizzo email.
                </Alert>
              )}
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button
                  variant="contained"
                  startIcon={<LoginOutlined />}
                  onClick={handleGoToLogin}
                  fullWidth
                >
                  Accedi
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PersonAddOutlined />}
                  onClick={handleGoToRegister}
                  fullWidth
                >
                  Registrati
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : user?.familyId ? (
          // Utente autenticato ma già in una famiglia
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="warning.main">
                Appartieni già a una famiglia
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Sei autenticato come <strong>{user.email}</strong> e appartieni già a una famiglia.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Per accettare questo invito devi prima lasciare la tua famiglia attuale dalla pagina Famiglia.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/family')}
                fullWidth
              >
                Vai alla Mia Famiglia
              </Button>
            </CardContent>
          </Card>
        ) : isAuthenticated ? (
          // Utente autenticato senza famiglia - può accettare l'invito
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Accetta Invito
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Sei autenticato come <strong>{user?.email}</strong>.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Clicca il pulsante qui sotto per accettare l'invito e unirti alla famiglia.
              </Typography>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<FamilyRestroomOutlined />}
                onClick={handleAcceptInvite}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Accettazione in corso...
                  </>
                ) : (
                  'Accetta Invito'
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Utente loggato con account diverso - mostra opzioni alternative
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="warning.main">
                Account Diverso
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Sei attualmente loggato come <strong>{user?.email}</strong>, ma questo invito potrebbe essere stato inviato a un altro indirizzo email.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Opzioni disponibili:</strong>
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column', mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<FamilyRestroomOutlined />}
                  onClick={handleAcceptInvite}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Accettazione in corso...' : 'Accetta con questo account'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<OpenInNewOutlined />}
                  onClick={handleOpenInIncognito}
                  fullWidth
                >
                  Apri in finestra incognito
                </Button>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Suggerimento:</strong> Se l'invito è per un altro account, usa la finestra incognito per evitare conflitti.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        )}

        <Divider sx={{ my: 3 }} />

        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Non conosci il mittente di questo invito?{' '}
            <Button 
              variant="text" 
              size="small"
              onClick={() => navigate('/login')}
            >
              Ignora e vai al Login
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default JoinFamilyPage; 