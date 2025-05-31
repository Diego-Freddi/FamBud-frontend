import React from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Grid,
} from '@mui/material';
import {
  DarkModeOutlined,
  LightModeOutlined,
  LanguageOutlined,
  AttachMoneyOutlined,
  CalendarTodayOutlined,
  DashboardOutlined,
  RestoreOutlined,
} from '@mui/icons-material';
import { useSettings } from '../contexts/SettingsContext';

const SettingsPage = () => {
  const {
    settings,
    isDarkMode,
    setCurrency,
    setDateFormat,
    setLanguage,
    setDashboardDefault,
    toggleTheme,
    resetSettings,
  } = useSettings();

  const handleResetSettings = () => {
    if (window.confirm('Sei sicuro di voler ripristinare tutte le impostazioni ai valori predefiniti?')) {
      resetSettings();
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Impostazioni
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Personalizza la tua esperienza con FamilyBudget
        </Typography>
      </Box>

      {/* Sezione Aspetto */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Aspetto" 
          subheader="Personalizza l'interfaccia dell'applicazione"
          avatar={<DarkModeOutlined color="primary" />}
        />
        <CardContent>
          <Grid container spacing={3}>
            {/* Dark Mode Toggle */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {isDarkMode ? <DarkModeOutlined /> : <LightModeOutlined />}
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      Tema scuro
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Attiva il tema scuro per ridurre l'affaticamento degli occhi
                    </Typography>
                  </Box>
                </Box>
                <Switch
                  checked={isDarkMode}
                  onChange={toggleTheme}
                  color="primary"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Sezione Localizzazione */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Localizzazione" 
          subheader="Imposta lingua, valuta e formato date"
          avatar={<LanguageOutlined color="primary" />}
        />
        <CardContent>
          <Grid container spacing={3}>
            {/* Lingua */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Lingua</InputLabel>
                <Select
                  value={settings.language}
                  label="Lingua"
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <MenuItem value="it">🇮🇹 Italiano</MenuItem>
                  <MenuItem value="en">🇬🇧 English</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Valuta */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Valuta</InputLabel>
                <Select
                  value={settings.currency}
                  label="Valuta"
                  onChange={(e) => setCurrency(e.target.value)}
                  startAdornment={<AttachMoneyOutlined sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  <MenuItem value="EUR">€ Euro (EUR)</MenuItem>
                  <MenuItem value="USD">$ Dollaro USA (USD)</MenuItem>
                  <MenuItem value="GBP">£ Sterlina (GBP)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Formato Date */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Formato Date</InputLabel>
                <Select
                  value={settings.dateFormat}
                  label="Formato Date"
                  onChange={(e) => setDateFormat(e.target.value)}
                  startAdornment={<CalendarTodayOutlined sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY (Europeo)</MenuItem>
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY (Americano)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Sezione Dashboard */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Dashboard" 
          subheader="Personalizza la vista predefinita della dashboard"
          avatar={<DashboardOutlined color="primary" />}
        />
        <CardContent>
          <Grid container spacing={3}>
            {/* Vista predefinita Dashboard */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Vista Predefinita</InputLabel>
                <Select
                  value={settings.dashboardDefault}
                  label="Vista Predefinita"
                  onChange={(e) => setDashboardDefault(e.target.value)}
                >
                  <MenuItem value="current-month">Mese Corrente</MenuItem>
                  <MenuItem value="all-time">Dall'Inizio</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Anteprima Impostazioni */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Anteprima" subheader="Vedi come appaiono le tue impostazioni" />
        <CardContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Tema:</strong> {isDarkMode ? 'Scuro' : 'Chiaro'} • 
              <strong> Valuta:</strong> {settings.currency} • 
              <strong> Date:</strong> {settings.dateFormat} • 
              <strong> Lingua:</strong> {settings.language === 'it' ? 'Italiano' : 'English'}
            </Typography>
          </Alert>
          
          <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Esempio formattazione:
            </Typography>
            <Typography variant="body1">
              Data: {new Date().toLocaleDateString(settings.dateFormat === 'MM/DD/YYYY' ? 'en-US' : 'it-IT')}
            </Typography>
            <Typography variant="body1">
              Importo: {new Intl.NumberFormat('it-IT', {
                style: 'currency',
                currency: settings.currency
              }).format(1234.56)}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Azioni */}
      <Card>
        <CardHeader title="Azioni" subheader="Gestisci le tue impostazioni" />
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<RestoreOutlined />}
              onClick={handleResetSettings}
            >
              Ripristina Predefinite
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SettingsPage; 