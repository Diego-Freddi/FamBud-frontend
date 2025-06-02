import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  LinearProgress,
  Typography,
  Button,
  Collapse
} from '@mui/material';
import {
  RefreshOutlined,
  InfoOutlined
} from '@mui/icons-material';

const ColdStartNotification = ({ 
  show, 
  onRetry, 
  retryCount = 0, 
  maxRetries = 2,
  onDismiss 
}) => {
  const [countdown, setCountdown] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Countdown per il prossimo tentativo automatico
  useEffect(() => {
    if (show && retryCount < maxRetries) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [show, retryCount, maxRetries]);

  if (!show) return null;

  const isRetrying = retryCount > 0 && retryCount < maxRetries;
  const hasExceededRetries = retryCount >= maxRetries;

  return (
    <Alert 
      severity={hasExceededRetries ? "error" : "warning"} 
      sx={{ mb: 2 }}
      action={
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isRetrying && (
            <Button
              color="inherit"
              size="small"
              onClick={onRetry}
              startIcon={<RefreshOutlined />}
            >
              Riprova
            </Button>
          )}
          {onDismiss && (
            <Button
              color="inherit"
              size="small"
              onClick={onDismiss}
            >
              Chiudi
            </Button>
          )}
        </Box>
      }
    >
      <AlertTitle>
        {hasExceededRetries 
          ? "Problema di connessione persistente" 
          : "Server in avvio..."
        }
      </AlertTitle>
      
      {hasExceededRetries ? (
        <Typography variant="body2">
          Il server non risponde dopo diversi tentativi. 
          Verifica la tua connessione internet o riprova più tardi.
        </Typography>
      ) : (
        <>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Il server sta riavviandosi dopo un periodo di inattività. 
            {isRetrying && countdown > 0 && (
              <> Nuovo tentativo tra {countdown} secondi...</>
            )}
          </Typography>
          
          {isRetrying && (
            <Box sx={{ mt: 1 }}>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Tentativo {retryCount + 1} di {maxRetries + 1}
              </Typography>
            </Box>
          )}
        </>
      )}

      <Button
        size="small"
        startIcon={<InfoOutlined />}
        onClick={() => setShowDetails(!showDetails)}
        sx={{ mt: 1, p: 0, minWidth: 'auto' }}
      >
        {showDetails ? 'Nascondi dettagli' : 'Perché succede?'}
      </Button>

      <Collapse in={showDetails}>
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Cos'è il Cold Start?</strong><br />
            Il nostro server gratuito va in "sleep mode" dopo 15 minuti di inattività 
            per risparmiare risorse. Al primo accesso dopo il riposo, il server 
            impiega 30-60 secondi per riavviarsi completamente.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <strong>Cosa puoi fare?</strong><br />
            • Attendi qualche secondo e riprova<br />
            • Il problema si risolve automaticamente dopo il primo accesso<br />
            • Gli accessi successivi saranno immediati
          </Typography>
        </Box>
      </Collapse>
    </Alert>
  );
};

export default ColdStartNotification;