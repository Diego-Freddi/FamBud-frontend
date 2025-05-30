import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Menu,
  Divider,
  Paper,
  Tab,
  Tabs,
} from '@mui/material';
import {
  PersonAddOutlined,
  MoreVertOutlined,
  EmailOutlined,
  DeleteOutlined,
  EditOutlined,
  RefreshOutlined,
  GroupOutlined,
  BarChartOutlined,
  SettingsOutlined,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { familyAPI } from '../services/api';
import MemberStats from '../components/MemberStats';
import useApiCall from '../hooks/useApiCall';

// URL avatar di default (stesso di ProfilePage e AppLayout)
const DEFAULT_AVATAR_URL = `https://res.cloudinary.com/dw1vq50a6/image/upload/v1/familybudget/defaults/avatar-default.png`;

const FamilyPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState('');
  
  // Stati per dialoghi
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [memberMenuAnchor, setMemberMenuAnchor] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  
  // Stati per form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [familyDescription, setFamilyDescription] = useState('');

  // Funzione API per dati famiglia
  const fetchFamilyData = useCallback(async () => {
    const response = await familyAPI.getFamily();
    
    if (response.data.success) {
      const familyInfo = response.data.data.family;
      // Inizializza i campi del form
      setFamilyName(familyInfo.name);
      setFamilyDescription(familyInfo.description || '');
      return response;
    } else {
      throw new Error(response.data.message || 'Errore nel caricamento famiglia');
    }
  }, []);

  // Uso l'hook per gestire la chiamata API
  const { data: familyResponse, loading, error: apiError, refetch } = useApiCall(fetchFamilyData, []);

  // Estraggo i dati dalla risposta
  const familyData = familyResponse?.data?.family || null;

  // Funzione refetch per le altre operazioni (mantengo la stessa interfaccia)
  const refetchFamilyData = () => {
    refetch();
  };

  // Gestione invito membro
  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;
    
    setInviteLoading(true);
    try {
      const response = await familyAPI.inviteMember({
        email: inviteEmail,
        role: inviteRole
      });
      
      if (response.data.success) {
        setInviteDialogOpen(false);
        setInviteEmail('');
        setInviteRole('member');
        refetchFamilyData(); // Ricarica dati
      } else {
        setError(response.data.message || 'Errore nell\'invio invito');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nell\'invio invito');
    } finally {
      setInviteLoading(false);
    }
  };

  // Gestione menu membro
  const handleMemberMenuOpen = (event, member) => {
    setMemberMenuAnchor(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMemberMenuClose = () => {
    setMemberMenuAnchor(null);
    setSelectedMember(null);
  };

  // Rimuovi membro
  const handleRemoveMember = async (memberId) => {
    try {
      const response = await familyAPI.removeMember(memberId);
      if (response.data.success) {
        refetchFamilyData();
        handleMemberMenuClose();
      } else {
        setError(response.data.message || 'Errore nella rimozione membro');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nella rimozione membro');
    }
  };

  // Cambia ruolo membro
  const handleChangeRole = async (memberId, newRole) => {
    try {
      const response = await familyAPI.updateMemberRole(memberId, newRole);
      if (response.data.success) {
        refetchFamilyData();
        handleMemberMenuClose();
      } else {
        setError(response.data.message || 'Errore nel cambio ruolo');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nel cambio ruolo');
    }
  };

  // Cancella invito
  const handleCancelInvitation = async (invitationId) => {
    try {
      const response = await familyAPI.cancelInvitation(invitationId);
      if (response.data.success) {
        refetchFamilyData();
      } else {
        setError(response.data.message || 'Errore nella cancellazione invito');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nella cancellazione invito');
    }
  };

  // Salva impostazioni famiglia
  const handleSaveFamilySettings = async () => {
    try {
      const response = await familyAPI.updateFamily({
        name: familyName,
        description: familyDescription
      });
      
      if (response.data.success) {
        refetchFamilyData();
        setError(''); // Pulisci eventuali errori precedenti
      } else {
        setError(response.data.message || 'Errore nel salvataggio impostazioni');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nel salvataggio impostazioni');
    }
  };

  // Lascia famiglia
  const handleLeaveFamily = async () => {
    if (window.confirm('Sei sicuro di voler lasciare la famiglia? Perderai l\'accesso a tutti i dati condivisi.')) {
      try {
        const response = await familyAPI.leaveFamily();
        if (response.data.success) {
          // Reindirizza alla pagina di creazione famiglia
          window.location.href = '/create-family';
        } else {
          setError(response.data.message || 'Errore nel lasciare la famiglia');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Errore nel lasciare la famiglia');
      }
    }
  };

  // Verifica se l'utente è admin
  const isUserAdmin = () => {
    if (!familyData || !user) return false;
    const member = familyData.members?.find(m => 
      m.user._id === user.id || m.user._id === user._id
    );
    return member?.role === 'admin';
  };

  // Gestione cambio tab
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (apiError && !familyData) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {apiError}
        </Alert>
        <Button onClick={refetchFamilyData} startIcon={<RefreshOutlined />}>
          Riprova
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Gestione Famiglia
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Gestisci i membri della tua famiglia e le loro autorizzazioni
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={refetchFamilyData} title="Aggiorna">
              <RefreshOutlined />
            </IconButton>
            {isUserAdmin() && (
              <Button
                variant="contained"
                startIcon={<PersonAddOutlined />}
                onClick={() => setInviteDialogOpen(true)}
              >
                Invita Membro
              </Button>
            )}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab icon={<GroupOutlined />} label="Membri" />
          <Tab icon={<EmailOutlined />} label="Inviti" />
          <Tab icon={<BarChartOutlined />} label="Statistiche" />
          <Tab icon={<SettingsOutlined />} label="Impostazioni" />
        </Tabs>
      </Paper>

      {/* Contenuto tabs */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Info famiglia */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader 
                title="Informazioni Famiglia"
                action={
                  isUserAdmin() && (
                    <IconButton onClick={() => setInviteDialogOpen(true)}>
                      <EditOutlined />
                    </IconButton>
                  )
                }
              />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {familyData?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {familyData?.description || 'Nessuna descrizione'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <span style={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}>
                    {familyData?.members?.length || 0} membri
                  </span>
                  <span style={{
                    backgroundColor: '#ed6c02',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}>
                    {familyData?.invitations?.filter(inv => inv.status === 'pending').length || 0} inviti pendenti
                  </span>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Lista membri */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Membri Famiglia" />
              <CardContent>
                <List>
                  {familyData?.members?.map((member, index) => (
                    <React.Fragment key={member.user._id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar src={member.user.avatar || DEFAULT_AVATAR_URL}>
                            {!member.user.avatar && member.user.name.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '1rem', fontWeight: 500 }}>
                                {member.user.name}
                              </span>
                              {member.user._id === user?.id && (
                                <span style={{
                                  backgroundColor: '#1976d2',
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 500
                                }}>
                                  Tu
                                </span>
                              )}
                            </span>
                          }
                          secondary={
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                              <span style={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                                {member.user.email}
                              </span>
                              <span style={{
                                backgroundColor: member.role === 'admin' ? '#d32f2f' : '#e0e0e0',
                                color: member.role === 'admin' ? 'white' : 'rgba(0, 0, 0, 0.87)',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 500
                              }}>
                                {member.role === 'admin' ? '👑' : '👤'} {member.role === 'admin' ? 'Amministratore' : 'Membro'}
                              </span>
                            </span>
                          }
                        />
                        {isUserAdmin() && member.user._id !== user?.id && (
                          <ListItemSecondaryAction>
                            <IconButton
                              onClick={(e) => handleMemberMenuOpen(e, member)}
                            >
                              <MoreVertOutlined />
                            </IconButton>
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                      {index < familyData.members.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <CardHeader title="Inviti Pendenti" />
          <CardContent>
            {familyData?.invitations?.filter(inv => inv.status === 'pending').length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                Nessun invito pendente
              </Typography>
            ) : (
              <List>
                {familyData.invitations
                  .filter(inv => inv.status === 'pending')
                  .map((invitation, index) => (
                    <React.Fragment key={invitation._id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <EmailOutlined />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={invitation.email}
                          secondary={
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                              <span style={{
                                backgroundColor: invitation.role === 'admin' ? '#d32f2f' : '#e0e0e0',
                                color: invitation.role === 'admin' ? 'white' : 'rgba(0, 0, 0, 0.87)',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 500
                              }}>
                                {invitation.role === 'admin' ? 'Amministratore' : 'Membro'}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                                Invitato il {new Date(invitation.createdAt).toLocaleDateString('it-IT')}
                              </span>
                            </span>
                          }
                        />
                        {isUserAdmin() && (
                          <ListItemSecondaryAction>
                            <IconButton
                              onClick={() => handleCancelInvitation(invitation._id)}
                              color="error"
                            >
                              <DeleteOutlined />
                            </IconButton>
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                      {index < familyData.invitations.filter(inv => inv.status === 'pending').length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          {familyData?.members?.map((member) => (
            <Grid item xs={12} md={6} lg={4} key={member.user._id}>
              <Card>
                <CardHeader
                  avatar={
                    <Avatar src={member.user.avatar || DEFAULT_AVATAR_URL}>
                      {!member.user.avatar && member.user.name.charAt(0).toUpperCase()}
                    </Avatar>
                  }
                  title={member.user.name}
                  subheader={member.role === 'admin' ? 'Amministratore' : 'Membro'}
                />
                <CardContent>
                  <MemberStats memberId={member.user._id} memberName={member.user.name} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Impostazioni Famiglia" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nome Famiglia"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      disabled={!isUserAdmin()}
                      helperText={!isUserAdmin() ? "Solo gli amministratori possono modificare il nome" : ""}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Descrizione"
                      multiline
                      rows={3}
                      value={familyDescription}
                      onChange={(e) => setFamilyDescription(e.target.value)}
                      disabled={!isUserAdmin()}
                      helperText={!isUserAdmin() ? "Solo gli amministratori possono modificare la descrizione" : ""}
                    />
                  </Grid>
                  {isUserAdmin() && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          variant="contained"
                          onClick={handleSaveFamilySettings}
                        >
                          Salva Modifiche
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setFamilyName(familyData?.name || '');
                            setFamilyDescription(familyData?.description || '');
                          }}
                        >
                          Annulla
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Azioni Famiglia" />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={handleLeaveFamily}
                    disabled={isUserAdmin() && familyData?.members?.length > 1}
                  >
                    Lascia Famiglia
                  </Button>
                  {isUserAdmin() && familyData?.members?.length === 1 && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        // Implementa elimina famiglia
                        console.log('Elimina famiglia');
                      }}
                    >
                      Elimina Famiglia
                    </Button>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {isUserAdmin() && familyData?.members?.length > 1 
                      ? "Non puoi lasciare la famiglia finché ci sono altri membri. Trasferisci prima i diritti di amministratore."
                      : "Lasciando la famiglia perderai l'accesso a tutti i dati condivisi."
                    }
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Dialog invita membro */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invita Nuovo Membro</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Ruolo</InputLabel>
            <Select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              label="Ruolo"
            >
              <MenuItem value="member">Membro</MenuItem>
              <MenuItem value="admin">Amministratore</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>
            Annulla
          </Button>
          <Button
            onClick={handleInviteMember}
            variant="contained"
            disabled={inviteLoading || !inviteEmail.trim()}
          >
            {inviteLoading ? <CircularProgress size={20} /> : 'Invia Invito'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu azioni membro */}
      <Menu
        anchorEl={memberMenuAnchor}
        open={Boolean(memberMenuAnchor)}
        onClose={handleMemberMenuClose}
      >
        {selectedMember?.role === 'member' ? (
          <MenuItem onClick={() => handleChangeRole(selectedMember.user._id, 'admin')}>
            <span style={{ marginRight: '8px' }}>👑</span>
            Promuovi ad Admin
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleChangeRole(selectedMember.user._id, 'member')}>
            <span style={{ marginRight: '8px' }}>👤</span>
            Rimuovi Admin
          </MenuItem>
        )}
        <MenuItem 
          onClick={() => handleRemoveMember(selectedMember?.user._id)}
          sx={{ color: 'error.main' }}
        >
          <DeleteOutlined sx={{ mr: 1 }} />
          Rimuovi dalla Famiglia
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default FamilyPage; 