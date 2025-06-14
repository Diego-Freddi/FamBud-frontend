import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
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
  Tab,
  Tabs,
  Chip,
  Collapse,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  PersonAddOutlined,
  MoreVertOutlined,
  EmailOutlined,
  DeleteOutlined,
  EditOutlined,
  RefreshOutlined,
  GroupOutlined,
  ExpandMoreOutlined,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { familyAPI } from '../services/api';
import { useSettings } from '../contexts/SettingsContext';
import MemberStats from '../components/MemberStats';
import useApiCall from '../hooks/useApiCall';

// URL avatar di default (stesso di ProfilePage e AppLayout)
const DEFAULT_AVATAR_URL = `https://res.cloudinary.com/dw1vq50a6/image/upload/v1/familybudget/defaults/avatar-default.png`;

const FamilyPage = () => {
  const { user } = useAuth();
  const { formatDate } = useSettings();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [error, setError] = useState('');
  
  // Stati per dialoghi
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [memberMenuAnchor, setMemberMenuAnchor] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [bannerTabValue, setBannerTabValue] = useState(0);
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerUploading, setBannerUploading] = useState(false);
  const [expandedMembers, setExpandedMembers] = useState(new Set());
  
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

  // Gestione banner famiglia
  const handleBannerFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setBannerUploading(true);
    try {
      const formData = new FormData();
      formData.append('banner', file);

      const response = await familyAPI.uploadFamilyBanner(formData);
      if (response.data.success) {
        refetchFamilyData();
        setBannerDialogOpen(false);
      } else {
        setError(response.data.message || 'Errore nell\'upload banner');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nell\'upload banner');
    } finally {
      setBannerUploading(false);
    }
  };

  const handleBannerUrlSubmit = async () => {
    if (!bannerUrl.trim()) return;

    setBannerUploading(true);
    try {
      const response = await familyAPI.setFamilyBannerUrl({ bannerUrl: bannerUrl.trim() });
      if (response.data.success) {
        refetchFamilyData();
        setBannerDialogOpen(false);
        setBannerUrl('');
      } else {
        setError(response.data.message || 'Errore nell\'impostazione banner');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nell\'impostazione banner');
    } finally {
      setBannerUploading(false);
    }
  };

  const handleRemoveBanner = async () => {
    try {
      const response = await familyAPI.removeFamilyBanner();
      if (response.data.success) {
        refetchFamilyData();
        setBannerDialogOpen(false);
      } else {
        setError(response.data.message || 'Errore nella rimozione banner');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nella rimozione banner');
    }
  };

  // Gestione espansione card membri
  const toggleMemberExpansion = (memberId) => {
    setExpandedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
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
      {/* Hero Header Section */}
      <Box 
        sx={{ 
          background: familyData?.banner 
            ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${familyData.banner})`
            : (theme) => theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #424242 0%, #616161 100%)'
              : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: 2,
          p: isMobile ? 2 : 4,
          mb: 4,
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: isMobile ? 'flex-start' : 'center', 
            gap: 2, 
            mb: 3,
            flexDirection: isSmallMobile ? 'column' : 'row'
          }}>
            <Avatar 
              sx={{ 
                width: isMobile ? 48 : 64, 
                height: isMobile ? 48 : 64, 
                bgcolor: 'rgba(255,255,255,0.2)',
                fontSize: isMobile ? '1.5rem' : '2rem'
              }}
            >
              <GroupOutlined sx={{ fontSize: isMobile ? '1.5rem' : '2rem' }} />
            </Avatar>
          <Box sx={{ flex: 1 }}>
              <Typography 
                variant={isMobile ? "h4" : "h3"} 
                component="h1" 
                fontWeight="bold" 
                gutterBottom
                sx={{ 
                  fontSize: isSmallMobile ? '1.5rem' : undefined,
                  lineHeight: 1.2
                }}
              >
                {familyData?.name}
              </Typography>
              <Typography 
                variant={isMobile ? "body1" : "h6"} 
                sx={{ 
                  opacity: 0.9,
                  fontSize: isSmallMobile ? '0.875rem' : undefined
                }}
              >
                {familyData?.description || 'La tua famiglia digitale'}
              </Typography>
            </Box>
          </Box>
          
          {/* Stats Cards */}
          <Box sx={{ 
            display: 'flex', 
            gap: isMobile ? 1 : 2, 
            flexWrap: 'wrap',
            justifyContent: isSmallMobile ? 'space-between' : 'flex-start'
          }}>
            <Box 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.15)', 
                borderRadius: 2, 
                p: isMobile ? 1.5 : 2, 
                minWidth: isSmallMobile ? 80 : 120,
                textAlign: 'center',
                flex: isSmallMobile ? 1 : 'none'
              }}
            >
              <Typography 
                variant={isMobile ? "h5" : "h4"} 
                fontWeight="bold"
                sx={{ fontSize: isSmallMobile ? '1.25rem' : undefined }}
              >
                {familyData?.members?.length || 0}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.9,
                  fontSize: isSmallMobile ? '0.75rem' : undefined
                }}
              >
                Membri
              </Typography>
            </Box>
            <Box 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.15)', 
                borderRadius: 2, 
                p: isMobile ? 1.5 : 2, 
                minWidth: isSmallMobile ? 80 : 120,
                textAlign: 'center',
                flex: isSmallMobile ? 1 : 'none'
              }}
            >
              <Typography 
                variant={isMobile ? "h5" : "h4"} 
                fontWeight="bold"
                sx={{ fontSize: isSmallMobile ? '1.25rem' : undefined }}
              >
                {familyData?.invitations?.filter(inv => inv.status === 'pending').length || 0}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.9,
                  fontSize: isSmallMobile ? '0.75rem' : undefined
                }}
              >
                {isSmallMobile ? 'Inviti' : 'Inviti Pendenti'}
              </Typography>
            </Box>
            <Box 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.15)', 
                borderRadius: 2, 
                p: isMobile ? 1.5 : 2, 
                minWidth: isSmallMobile ? 80 : 120,
                textAlign: 'center',
                flex: isSmallMobile ? 1 : 'none'
              }}
            >
              <Typography 
                variant={isMobile ? "h5" : "h4"} 
                fontWeight="bold"
                sx={{ fontSize: isSmallMobile ? '1.25rem' : undefined }}
              >
                {new Date(familyData?.createdAt).getFullYear() || new Date().getFullYear()}
            </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.9,
                  fontSize: isSmallMobile ? '0.75rem' : undefined
                }}
              >
                {isSmallMobile ? 'Anno' : 'Anno Creazione'}
            </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* Action Buttons */}
        <Box sx={{ 
          position: 'absolute', 
          top: isMobile ? 8 : 16, 
          right: isMobile ? 8 : 16, 
          display: 'flex', 
          gap: 1 
        }}>
          <IconButton 
            onClick={refetchFamilyData} 
            sx={{ 
              color: 'white', 
              bgcolor: 'rgba(255,255,255,0.1)',
              width: isMobile ? 36 : 40,
              height: isMobile ? 36 : 40
            }}
          >
              <RefreshOutlined sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }} />
            </IconButton>
            {isUserAdmin() && (
            <IconButton
              onClick={() => setBannerDialogOpen(true)}
              sx={{ 
                color: 'white', 
                bgcolor: 'rgba(255,255,255,0.1)',
                width: isMobile ? 36 : 40,
                height: isMobile ? 36 : 40
              }}
              title="Cambia banner famiglia"
            >
              <EditOutlined sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }} />
            </IconButton>
            )}
          </Box>
        </Box>

        {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

      {/* Membri Famiglia Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
          👥 Gestione Membri
        </Typography>
        
        {/* Layout responsive: due colonne su desktop, una colonna su mobile */}
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          flexDirection: isMobile ? 'column' : 'row',
          flexWrap: 'wrap' 
        }}>
          {/* Colonna Sinistra: Membri Attivi */}
          <Box sx={{ flex: 1, minWidth: isMobile ? 'auto' : 300 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
              👥 Membri Attivi ({familyData?.activeMembers?.length || 0})
                </Typography>
            
            {familyData?.activeMembers && familyData.activeMembers.length > 0 ? (
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexWrap: 'wrap',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                {familyData.activeMembers
                  .filter(member => member.user) // Filtra membri con utente valido
                  .map((member) => (
                  <Box 
                    key={member.user._id} 
                    sx={{ 
                      minWidth: isMobile ? 'auto' : 390, 
                      maxWidth: isMobile ? 'none' : 390,
                      width: isMobile ? '100%' : 'auto'
                    }}
                  >
                    <Card 
                      sx={{ 
                        border: '1px solid',
                        borderColor: member.role === 'admin' ? 'error.main' : 'primary.main',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 3,
                        }
                      }}
                      onClick={() => toggleMemberExpansion(member.user._id)}
                    >
                      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2, 
                          mb: 2,
                          flexDirection: isSmallMobile ? 'column' : 'row',
                          textAlign: isSmallMobile ? 'center' : 'left'
                        }}>
                          <Avatar 
                            src={member.user?.avatar || DEFAULT_AVATAR_URL}
                            sx={{ 
                              width: isMobile ? 48 : 56, 
                              height: isMobile ? 48 : 56,
                              border: member.role === 'admin' ? '3px solid #d32f2f' : '3px solid #1976d2'
                            }}
                          >
                            {!member.user?.avatar && member.user?.name?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1, 
                              mb: 0.5,
                              flexDirection: isSmallMobile ? 'column' : 'row',
                              justifyContent: isSmallMobile ? 'center' : 'flex-start'
                            }}>
                              <Typography 
                                variant={isMobile ? "body1" : "h6"} 
                                fontWeight="bold"
                                sx={{ fontSize: isSmallMobile ? '1rem' : undefined }}
                              >
                                {member.user?.name || 'Utente eliminato'}
                              </Typography>
                              {member.user?._id === user?.id && (
                                <Chip label="Tu" size="small" color="primary" />
                              )}
                            </Box>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                fontSize: isSmallMobile ? '0.75rem' : undefined,
                                wordBreak: 'break-word'
                              }}
                            >
                              {member.user?.email || 'Email non disponibile'}
                            </Typography>
                          </Box>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            flexDirection: isSmallMobile ? 'row' : 'row'
                          }}>
                            <ExpandMoreOutlined 
                              sx={{ 
                                transform: expandedMembers.has(member.user._id) ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s'
                              }} 
                            />
                            {isUserAdmin() && member.user?._id !== user?.id && (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMemberMenuOpen(e, member);
                                }}
                              >
                                <MoreVertOutlined />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          flexDirection: isSmallMobile ? 'column' : 'row',
                          gap: isSmallMobile ? 1 : 0
                        }}>
                          <Chip
                            icon={member.role === 'admin' ? <span>👑</span> : <span>👤</span>}
                            label={member.role === 'admin' ? 'Amministratore' : 'Membro'}
                            color={member.role === 'admin' ? 'error' : 'default'}
                            variant="outlined"
                            size={isMobile ? "small" : "medium"}
                          />
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              fontSize: isSmallMobile ? '0.7rem' : '0.75rem',
                              textAlign: isSmallMobile ? 'center' : 'right'
                            }}
                          >
                            📊 Clicca per statistiche
                          </Typography>
                        </Box>
                      </CardContent>
                      
                      {/* Sezione Statistiche Espandibile */}
                      <Collapse in={expandedMembers.has(member.user._id)} timeout="auto" unmountOnExit>
                        <Box sx={{ 
                          borderTop: '1px solid', 
                          borderColor: 'divider',
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                          p: isMobile ? 1.5 : 2
                        }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            mb: 2,
                            fontWeight: 'bold',
                            fontSize: isMobile ? '0.875rem' : undefined
                          }}>
                            📊 Statistiche di {member.user?.name || 'Utente eliminato'}
                          </Typography>
                          <MemberStats memberId={member.user._id} memberName={member.user?.name || 'Utente eliminato'} />
                        </Box>
                      </Collapse>
                    </Card>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary" variant="body2">
                  Nessun membro attivo
                </Typography>
              </Box>
            )}
          </Box>

          {/* Colonna Destra: Ex-Membri */}
          <Box sx={{ flex: 1, minWidth: isMobile ? 'auto' : 300 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2, color: 'text.secondary' }}>
              👤❌ Ex-Membri ({familyData?.formerMembers?.length || 0})
            </Typography>
            
            {familyData?.formerMembers && familyData.formerMembers.length > 0 ? (
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexWrap: 'wrap',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                {familyData.formerMembers
                  .filter(formerMember => formerMember.user) // Filtra ex-membri con utente valido
                  .map((formerMember) => (
                  <Box 
                    key={formerMember.user._id} 
                    sx={{ 
                      minWidth: isMobile ? 'auto' : 280, 
                      maxWidth: isMobile ? 'none' : 360,
                      width: isMobile ? '100%' : 'auto'
                    }}
                  >
                    <Card 
                      sx={{ 
                        opacity: 0.7,
                        border: '1px dashed',
                        borderColor: 'text.secondary',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.9,
                          transform: 'translateY(-2px)',
                        }
                      }}
                      onClick={() => toggleMemberExpansion(formerMember.user._id)}
                    >
                      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2, 
                          mb: 2,
                          flexDirection: isSmallMobile ? 'column' : 'row',
                          textAlign: isSmallMobile ? 'center' : 'left'
                        }}>
                          <Avatar 
                            src={formerMember.user?.avatar || DEFAULT_AVATAR_URL}
                            sx={{ 
                              width: isMobile ? 48 : 56, 
                              height: isMobile ? 48 : 56,
                              filter: 'grayscale(50%)',
                              border: '3px solid #9e9e9e'
                            }}
                          >
                            {!formerMember.user?.avatar && formerMember.user?.name?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1, 
                              mb: 0.5,
                              flexDirection: isSmallMobile ? 'column' : 'row',
                              justifyContent: isSmallMobile ? 'center' : 'flex-start'
                            }}>
                              <Typography 
                                variant={isMobile ? "body1" : "h6"} 
                                fontWeight="bold" 
                                sx={{ 
                                  color: 'text.secondary',
                                  fontSize: isSmallMobile ? '1rem' : undefined
                                }}
                              >
                                {formerMember.user?.name || 'Utente eliminato'}
                              </Typography>
                              <Chip label="Ex-membro" size="small" color="default" variant="outlined" />
                            </Box>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                fontSize: isSmallMobile ? '0.75rem' : undefined,
                                wordBreak: 'break-word'
                              }}
                            >
                              {formerMember.user?.email || 'Email non disponibile'}
                            </Typography>
                            {formerMember.leftAt && (
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ fontSize: isSmallMobile ? '0.7rem' : undefined }}
                              >
                                Uscito il {formatDate(formerMember.leftAt)}
                              </Typography>
                            )}
                          </Box>
                          <ExpandMoreOutlined 
                            sx={{ 
                              transform: expandedMembers.has(formerMember.user._id) ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s',
                              color: 'text.secondary'
                            }} 
                          />
                        </Box>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          flexDirection: isSmallMobile ? 'column' : 'row',
                          gap: isSmallMobile ? 1 : 0
                        }}>
                          <Chip
                            icon={<span>👤</span>}
                            label={`Era ${formerMember.role === 'admin' ? 'Amministratore' : 'Membro'}`}
                            color="default"
                            variant="outlined"
                            sx={{ opacity: 0.7 }}
                            size={isMobile ? "small" : "medium"}
                          />
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              fontSize: isSmallMobile ? '0.7rem' : '0.75rem',
                              textAlign: isSmallMobile ? 'center' : 'right'
                            }}
                          >
                            📊 Clicca per statistiche storiche
                          </Typography>
                        </Box>
                      </CardContent>
                      
                      {/* Sezione Statistiche Espandibili per Ex-Membri */}
                      <Collapse in={expandedMembers.has(formerMember.user._id)} timeout="auto" unmountOnExit>
                        <Box sx={{ 
                          borderTop: '1px solid', 
                          borderColor: 'divider',
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                          p: isMobile ? 1.5 : 2
                        }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            mb: 2,
                            fontWeight: 'bold',
                            color: 'text.secondary',
                            fontSize: isMobile ? '0.875rem' : undefined
                          }}>
                            📊 Statistiche storiche di {formerMember.user?.name || 'Utente eliminato'}
                          </Typography>
                          <MemberStats memberId={formerMember.user._id} memberName={formerMember.user?.name || 'Utente eliminato'} />
                        </Box>
                      </Collapse>
                    </Card>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary" variant="body2">
                  Nessun ex-membro
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Inviti e Impostazioni Row */}
      <Box sx={{ 
        display: 'flex', 
        gap: 3, 
        mb: 4, 
        flexWrap: 'wrap',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        {/* Inviti Pendenti */}
        <Box sx={{ flex: 1, minWidth: isMobile ? 'auto' : 300 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
            📧 Inviti Pendenti
          </Typography>
          
        <Card>
          <CardContent>
            {familyData?.invitations?.filter(inv => inv.status === 'pending').length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <EmailOutlined sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary" gutterBottom>
                Nessun invito pendente
              </Typography>
                  {isUserAdmin() && (
                    <Button
                      variant="outlined"
                      startIcon={<PersonAddOutlined />}
                      onClick={() => setInviteDialogOpen(true)}
                      sx={{ mt: 1 }}
                    >
                      Invita qualcuno
                    </Button>
                  )}
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {familyData.invitations
                  .filter(inv => inv.status === 'pending')
                    .map((invitation) => (
                      <Box 
                        key={invitation._id}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2,
                          p: 2,
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                          borderRadius: 1
                        }}
                      >
                        <Avatar size="small">
                            <EmailOutlined />
                          </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {invitation.email}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={invitation.role === 'admin' ? 'Amministratore' : 'Membro'}
                              size="small"
                              color={invitation.role === 'admin' ? 'error' : 'default'}
                              variant="outlined"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(invitation.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                        {isUserAdmin() && (
                            <IconButton
                            size="small"
                              onClick={() => handleCancelInvitation(invitation._id)}
                              color="error"
                            >
                              <DeleteOutlined />
                            </IconButton>
                        )}
                      </Box>
                  ))}
                </Box>
            )}
          </CardContent>
        </Card>
        </Box>

        {/* Impostazioni Famiglia */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
            ⚙️ Configurazione
          </Typography>
          
            <Card>
              <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Nome Famiglia"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      disabled={!isUserAdmin()}
                  size="small"
                    />
                    <TextField
                      fullWidth
                      label="Descrizione"
                      multiline
                  rows={2}
                      value={familyDescription}
                      onChange={(e) => setFamilyDescription(e.target.value)}
                      disabled={!isUserAdmin()}
                  size="small"
                    />
                  {isUserAdmin() && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          onClick={handleSaveFamilySettings}
                      size="small"
                        >
                      Salva
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setFamilyName(familyData?.name || '');
                            setFamilyDescription(familyData?.description || '');
                          }}
                      size="small"
                        >
                      Reset
                        </Button>
                      </Box>
                )}
                {!isUserAdmin() && (
                  <Typography variant="caption" color="text.secondary">
                    Solo gli amministratori possono modificare le impostazioni
                  </Typography>
                  )}
              </Box>
              </CardContent>
            </Card>
        </Box>
      </Box>

      {/* Azioni Rapide */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
          🚀 Azioni Rapide
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {isUserAdmin() && (
            <Button
              variant="contained"
              startIcon={<PersonAddOutlined />}
              onClick={() => setInviteDialogOpen(true)}
            >
              Invita Membro
            </Button>
          )}
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={handleLeaveFamily}
                    disabled={isUserAdmin() && familyData?.members?.length > 1}
                  >
                    Lascia Famiglia
                  </Button>
        </Box>
        
        {(isUserAdmin() && familyData?.members?.length > 1) && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Non puoi lasciare la famiglia finché ci sono altri membri. Trasferisci prima i diritti di amministratore.
                  </Typography>
        )}
                </Box>

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

      {/* Dialog banner famiglia */}
      <Dialog open={bannerDialogOpen} onClose={() => setBannerDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cambia Banner Famiglia</DialogTitle>
        <DialogContent>
          <Tabs value={bannerTabValue} onChange={(e, newValue) => setBannerTabValue(newValue)} sx={{ mb: 2 }}>
            <Tab label="Carica File" />
            <Tab label="Inserisci URL" />
          </Tabs>
          
          {bannerTabValue === 0 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="banner-upload"
                type="file"
                onChange={handleBannerFileUpload}
                disabled={bannerUploading}
              />
              <label htmlFor="banner-upload">
                <Button
                  variant="outlined"
                  component="span"
                  disabled={bannerUploading}
                  sx={{ mb: 2 }}
                >
                  {bannerUploading ? <CircularProgress size={20} /> : 'Seleziona Immagine'}
                </Button>
              </label>
              <Typography variant="body2" color="text.secondary">
                Formati supportati: JPG, PNG, WebP (max 5MB)
              </Typography>
            </Box>
          )}
          
          {bannerTabValue === 1 && (
            <Box sx={{ py: 2 }}>
              <TextField
                fullWidth
                label="URL Immagine"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://esempio.com/immagine.jpg"
                margin="normal"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Inserisci l'URL di un'immagine online
              </Typography>
            </Box>
          )}
          
          {familyData?.banner && (
            <Box sx={{ mt: 2, p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" gutterBottom>
                Banner attuale:
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  height: 100,
                  backgroundImage: `url(${familyData.banner})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 1,
                  mb: 1
                }}
              />
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={handleRemoveBanner}
              >
                Rimuovi Banner
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBannerDialogOpen(false)}>
            Annulla
          </Button>
          {bannerTabValue === 1 && (
            <Button
              onClick={handleBannerUrlSubmit}
              variant="contained"
              disabled={bannerUploading || !bannerUrl.trim()}
            >
              {bannerUploading ? <CircularProgress size={20} /> : 'Imposta Banner'}
            </Button>
          )}
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