import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Stack,
  Paper,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  EditOutlined,
  SecurityOutlined,
  DownloadOutlined,
  DeleteOutlined,
  PhotoCameraOutlined,
  EmailOutlined,
  FamilyRestroomOutlined,
  AdminPanelSettingsOutlined,
  PersonOutlined,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { familyAPI, profileAPI } from '../services/api';
import { changePasswordSchema } from '../utils/validationSchemas';
import useApiCall from '../hooks/useApiCall';
import { useSettings } from '../contexts/SettingsContext';
import * as yup from 'yup';

// Schema per conferma password eliminazione account
const deleteAccountSchema = yup.object({
  password: yup
    .string()
    .required('La password è obbligatoria per confermare l\'eliminazione')
});

// URL avatar di default da Cloudinary (fuori dal componente per evitare re-render)
const DEFAULT_AVATAR_URL = `https://res.cloudinary.com/dw1vq50a6/image/upload/v1/familybudget/defaults/avatar-default.png`;

const ProfilePage = () => {
  const { user, updateUser, logout, isAuthenticated } = useAuth();
  const { settings, formatDate } = useSettings();
  const navigate = useNavigate();
  
  // Responsività
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Stati per dialogs
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  
  // Stati per loading e errori
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Stati per avatar
  const [avatarMethod, setAvatarMethod] = useState('upload'); // 'upload' o 'url'
  const [avatarUrl, setAvatarUrl] = useState('');

  // Stato per gestire l'eliminazione account
  const [accountDeleted, setAccountDeleted] = useState(false);

  // Effetto per navigare dopo l'eliminazione account
  useEffect(() => {
    if (accountDeleted && !isAuthenticated) {
      navigate('/register', { replace: true });
    }
  }, [accountDeleted, isAuthenticated, navigate]);

  // Fetch dati famiglia
  const fetchFamilyData = async () => {
    if (!user?.familyId) return null;
    return await familyAPI.getFamily();
  };

  const { data: familyResponse, loading: familyLoading } = useApiCall(fetchFamilyData, [user?.familyId]);
  const familyData = familyResponse?.data?.family;

  // Form per cambio password
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm({
    resolver: yupResolver(changePasswordSchema),
  });

  // Form per cambio email
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
    reset: resetEmailForm,
  } = useForm({
    defaultValues: { email: user?.email || '' },
  });

  // Form per conferma password eliminazione account
  const {
    register: registerDeletePassword,
    handleSubmit: handleDeleteSubmit,
    formState: { errors: deletePasswordErrors },
    reset: resetDeleteForm,
  } = useForm({
    resolver: yupResolver(deleteAccountSchema),
  });

  // Gestione cambio password
  const onPasswordSubmit = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      await profileAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      setSuccess('Password cambiata con successo!');
      setPasswordDialogOpen(false);
      resetPasswordForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nel cambio password');
    } finally {
      setLoading(false);
    }
  };

  // Gestione cambio email
  const onEmailSubmit = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await profileAPI.changeEmail({ email: data.email });
      updateUser(response.data.user);
      setSuccess('Email aggiornata con successo!');
      setEmailDialogOpen(false);
      resetEmailForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nell\'aggiornamento email');
    } finally {
      setLoading(false);
    }
  };

  // Gestione upload avatar
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await profileAPI.uploadAvatar(formData);
      updateUser(response.data.user);
      setSuccess('Avatar caricato con successo!');
      setAvatarDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nel caricamento avatar');
    } finally {
      setLoading(false);
    }
  };

  // Gestione avatar tramite URL
  const handleAvatarUrl = async () => {
    if (!avatarUrl.trim()) {
      setError('Inserisci un URL valido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await profileAPI.setAvatarUrl({ avatarUrl: avatarUrl.trim() });
      updateUser(response.data.user);
      setSuccess('Avatar aggiornato con successo!');
      setAvatarDialogOpen(false);
      setAvatarUrl('');
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nell\'aggiornamento avatar');
    } finally {
      setLoading(false);
    }
  };

  // Apri dialog avatar
  const openAvatarDialog = () => {
    setAvatarMethod('upload');
    setAvatarUrl('');
    setError('');
    setAvatarDialogOpen(true);
  };

  // Gestione esportazione dati
  const handleExportData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await profileAPI.exportData();
      
      // Crea e scarica il file JSON
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `familybudget_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess('Dati esportati con successo!');
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nell\'esportazione dati');
    } finally {
      setLoading(false);
    }
  };

  // Gestione eliminazione account
  const handleDeleteAccount = async (data) => {
    setLoading(true);
    setError('');

    try {
      await profileAPI.deleteAccount({ password: data.password });
      setDeleteDialogOpen(false);
      resetDeleteForm();
      
      // Imposta il flag per indicare che l'account è stato eliminato
      setAccountDeleted(true);
      
      // Logout senza navigazione immediata
      logout();
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nell\'eliminazione account');
      setLoading(false);
    }
  };

  // Formattazione date
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Non disponibile';
    const locale = settings.language === 'en' ? 'en-US' : 'it-IT';
    return new Date(dateString).toLocaleString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Trova il ruolo dell'utente nella famiglia
  const getUserFamilyRole = () => {
    if (!familyData || !user) return null;
    const member = familyData.members?.find(m => 
      m.user._id === user.id || m.user._id === user._id
    );
    return member?.role;
  };

  const getUserJoinDate = () => {
    if (!familyData || !user) return null;
    const member = familyData.members?.find(m => 
      m.user._id === user.id || m.user._id === user._id
    );
    return member?.joinedAt;
  };

  // Determina quale avatar mostrare
  const getAvatarSrc = () => {
    const avatarUrl = user?.avatar || DEFAULT_AVATAR_URL;
    return avatarUrl;
  };

  return (
    <Box sx={{ 
      maxWidth: isMobile ? '100%' : 600, 
      mx: 'auto', 
      p: isMobile ? 2 : 3 
    }}>
      {/* Header */}
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        component="h1" 
        fontWeight="bold" 
        gutterBottom
      >
        Profilo Utente
      </Typography>
      <Typography 
        variant={isMobile ? "body2" : "subtitle1"} 
        color="text.secondary" 
        sx={{ mb: isMobile ? 3 : 4 }}
      >
        Gestisci le tue informazioni personali e le impostazioni account
      </Typography>

      {/* Messaggi di feedback */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Stack spacing={isMobile ? 2 : 4}>
        {/* Sezione Avatar e Nome */}
        <Paper sx={{ p: isMobile ? 2 : 3 }}>
          <Stack 
            direction={isSmallMobile ? "column" : "row"} 
            spacing={isSmallMobile ? 2 : 3} 
            alignItems={isSmallMobile ? "center" : "center"}
          >
            <Box sx={{ position: 'relative' }}>
              <Avatar
                key={user?.avatar || 'default'}
                src={getAvatarSrc()}
                sx={{ 
                  width: isMobile ? 64 : 80, 
                  height: isMobile ? 64 : 80, 
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  bgcolor: 'primary.main'
                }}
              >
                {!user?.avatar && user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <IconButton
                component="button"
                onClick={openAvatarDialog}
                sx={{
                  position: 'absolute',
                  bottom: -5,
                  right: -5,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'grey.100' }
                }}
                size="small"
              >
                <PhotoCameraOutlined fontSize="small" />
              </IconButton>
            </Box>
            
            <Box sx={{ textAlign: isSmallMobile ? 'center' : 'left' }}>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                fontWeight="bold"
              >
                {user?.name}
              </Typography>
              <Stack 
                direction={isSmallMobile ? "column" : "row"} 
                spacing={1} 
                sx={{ mt: 1 }}
                alignItems={isSmallMobile ? "center" : "flex-start"}
              >
                {getUserFamilyRole() && (
                  <Chip
                    icon={getUserFamilyRole() === 'admin' ? <AdminPanelSettingsOutlined /> : <PersonOutlined />}
                    label={getUserFamilyRole() === 'admin' ? 'Amministratore' : 'Membro'}
                    color={getUserFamilyRole() === 'admin' ? 'primary' : 'default'}
                    size="small"
                  />
                )}
                {familyData && (
                  <Chip
                    icon={<FamilyRestroomOutlined />}
                    label={familyData.name}
                    variant="outlined"
                    size="small"
                  />
                )}
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {/* Sezione Informazioni Account */}
        <Paper sx={{ p: isMobile ? 2 : 3 }}>
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              fontSize: isMobile ? '1.1rem' : '1.25rem'
            }}
          >
            <EmailOutlined color="primary" />
            Informazioni Account
          </Typography>
          
          <Stack spacing={2}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: isSmallMobile ? 'flex-start' : 'center',
              flexDirection: isSmallMobile ? 'column' : 'row',
              gap: isSmallMobile ? 1 : 0
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">Email</Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    wordBreak: 'break-word',
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}
                >
                  {user?.email}
                </Typography>
              </Box>
              <IconButton 
                onClick={() => setEmailDialogOpen(true)} 
                title="Modifica email"
                size={isMobile ? "small" : "medium"}
              >
                <EditOutlined />
              </IconButton>
            </Box>
            
            <Divider />
            
            <Box>
              <Typography variant="body2" color="text.secondary">Registrato</Typography>
              <Typography 
                variant="body1"
                sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
              >
                {formatDate(user?.createdAt)}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">Ultimo accesso</Typography>
              <Typography 
                variant="body1"
                sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
              >
                {formatDateTime(user?.lastLogin)}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Sezione Famiglia */}
        {familyData && (
          <Paper sx={{ p: isMobile ? 2 : 3 }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                fontSize: isMobile ? '1.1rem' : '1.25rem'
              }}
            >
              <FamilyRestroomOutlined color="primary" />
              Famiglia
            </Typography>
            
            {familyLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Nome famiglia</Typography>
                  <Typography 
                    variant="body1"
                    sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
                  >
                    {familyData.name}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Ruolo</Typography>
                  <Typography 
                    variant="body1"
                    sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
                  >
                    {getUserFamilyRole() === 'admin' ? 'Amministratore' : 'Membro'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Membro dal</Typography>
                  <Typography 
                    variant="body1"
                    sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
                  >
                    {formatDate(getUserJoinDate())}
                  </Typography>
                </Box>
              </Stack>
            )}
          </Paper>
        )}

        {/* Sezione Sicurezza */}
        <Paper sx={{ p: isMobile ? 2 : 3 }}>
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              fontSize: isMobile ? '1.1rem' : '1.25rem'
            }}
          >
            <SecurityOutlined color="primary" />
            Sicurezza
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<SecurityOutlined />}
            onClick={() => setPasswordDialogOpen(true)}
            fullWidth
            size={isMobile ? "medium" : "large"}
          >
            Cambia Password
          </Button>
        </Paper>

        {/* Sezione Privacy e Dati */}
        <Paper sx={{ p: isMobile ? 2 : 3 }}>
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              fontSize: isMobile ? '1.1rem' : '1.25rem'
            }}
          >
            <DownloadOutlined color="primary" />
            Privacy e Dati
          </Typography>
          
          <Stack spacing={2}>
            <Button
              variant="outlined"
              startIcon={<DownloadOutlined />}
              onClick={handleExportData}
              fullWidth
              disabled={loading}
              size={isMobile ? "medium" : "large"}
            >
              Esporta Dati
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlined />}
              onClick={() => setDeleteDialogOpen(true)}
              fullWidth
              size={isMobile ? "medium" : "large"}
            >
              Elimina Account
            </Button>
          </Stack>
        </Paper>
      </Stack>

      {/* Dialog Cambio Password */}
      <Dialog 
        open={passwordDialogOpen} 
        onClose={() => setPasswordDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isSmallMobile}
      >
        <DialogTitle>Cambia Password</DialogTitle>
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
          <DialogContent>
            <TextField
              {...registerPassword('currentPassword')}
              fullWidth
              label="Password attuale"
              type="password"
              margin="normal"
              error={!!passwordErrors.currentPassword}
              helperText={passwordErrors.currentPassword?.message}
              size={isMobile ? "small" : "medium"}
            />
            
            <TextField
              {...registerPassword('newPassword')}
              fullWidth
              label="Nuova password"
              type="password"
              margin="normal"
              error={!!passwordErrors.newPassword}
              helperText={passwordErrors.newPassword?.message}
              size={isMobile ? "small" : "medium"}
            />
            
            <TextField
              {...registerPassword('confirmNewPassword')}
              fullWidth
              label="Conferma nuova password"
              type="password"
              margin="normal"
              error={!!passwordErrors.confirmNewPassword}
              helperText={passwordErrors.confirmNewPassword?.message}
              size={isMobile ? "small" : "medium"}
            />
          </DialogContent>
          <DialogActions sx={{ p: isMobile ? 2 : 1 }}>
            <Button onClick={() => setPasswordDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={loading}
              startIcon={loading && <CircularProgress size={16} />}
            >
              Cambia Password
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog Cambio Email */}
      <Dialog 
        open={emailDialogOpen} 
        onClose={() => setEmailDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isSmallMobile}
      >
        <DialogTitle>Modifica Email</DialogTitle>
        <form onSubmit={handleEmailSubmit(onEmailSubmit)}>
          <DialogContent>
            <TextField
              {...registerEmail('email')}
              fullWidth
              label="Nuova email"
              type="email"
              margin="normal"
              error={!!emailErrors.email}
              helperText={emailErrors.email?.message}
              size={isMobile ? "small" : "medium"}
            />
          </DialogContent>
          <DialogActions sx={{ p: isMobile ? 2 : 1 }}>
            <Button onClick={() => setEmailDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={loading}
              startIcon={loading && <CircularProgress size={16} />}
            >
              Aggiorna Email
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog Avatar */}
      <Dialog 
        open={avatarDialogOpen} 
        onClose={() => setAvatarDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isSmallMobile}
      >
        <DialogTitle>Cambia Avatar</DialogTitle>
        <DialogContent>
          <Tabs 
            value={avatarMethod} 
            onChange={(e, newValue) => setAvatarMethod(newValue)} 
            sx={{ mb: 3 }}
            variant={isMobile ? "fullWidth" : "standard"}
          >
            <Tab label="Carica File" value="upload" />
            <Tab label="Inserisci URL" value="url" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {avatarMethod === 'upload' ? (
            <Box>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ mb: 2, fontSize: isMobile ? '0.8rem' : '0.875rem' }}
              >
                Seleziona un'immagine dal tuo computer (max 5MB)
              </Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                disabled={loading}
                size={isMobile ? "medium" : "large"}
              >
                Scegli File
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ mb: 2, fontSize: isMobile ? '0.8rem' : '0.875rem' }}
              >
                Inserisci l'URL di un'immagine (JPEG, PNG, WebP, GIF)
              </Typography>
              <TextField
                fullWidth
                label="URL Immagine"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://esempio.com/immagine.jpg"
                disabled={loading}
                size={isMobile ? "small" : "medium"}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: isMobile ? 2 : 1 }}>
          <Button onClick={() => setAvatarDialogOpen(false)}>
            Annulla
          </Button>
          {avatarMethod === 'url' && (
            <Button 
              onClick={handleAvatarUrl}
              variant="contained"
              disabled={loading || !avatarUrl.trim()}
              startIcon={loading && <CircularProgress size={16} />}
            >
              Imposta Avatar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog Eliminazione Account */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isSmallMobile}
      >
        <DialogTitle color="error.main">Elimina Account</DialogTitle>
        <form onSubmit={handleDeleteSubmit(handleDeleteAccount)}>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography 
                variant="body2"
                sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
              >
                <strong>Attenzione!</strong> Questa azione è irreversibile.
              </Typography>
            </Alert>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Typography 
              variant="body2" 
              paragraph
              sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
            >
              Eliminando il tuo account:
            </Typography>
            <Typography 
              variant="body2" 
              component="ul" 
              sx={{ 
                pl: 2, 
                mb: 2,
                fontSize: isMobile ? '0.8rem' : '0.875rem'
              }}
            >
              <li>Perderai accesso a tutti i tuoi dati</li>
              <li>Le tue spese e entrate saranno rimosse</li>
              <li>Se sei l'unico membro della famiglia, la famiglia sarà eliminata</li>
              <li>Se sei amministratore, i privilegi saranno trasferiti automaticamente</li>
            </Typography>
            
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 2, 
                fontWeight: 'bold',
                fontSize: isMobile ? '0.8rem' : '0.875rem'
              }}
            >
              Inserisci la tua password per confermare l'eliminazione:
            </Typography>
            
            <TextField
              {...registerDeletePassword('password')}
              fullWidth
              label="Password"
              type="password"
              margin="normal"
              error={!!deletePasswordErrors.password}
              helperText={deletePasswordErrors.password?.message}
              autoFocus
              size={isMobile ? "small" : "medium"}
            />
          </DialogContent>
          <DialogActions sx={{ p: isMobile ? 2 : 1 }}>
            <Button onClick={() => {
              setDeleteDialogOpen(false);
              resetDeleteForm();
              setError('');
            }}>
              Annulla
            </Button>
            <Button 
              type="submit"
              color="error"
              variant="contained"
              disabled={loading}
              startIcon={loading && <CircularProgress size={16} />}
            >
              Elimina Account
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ProfilePage; 