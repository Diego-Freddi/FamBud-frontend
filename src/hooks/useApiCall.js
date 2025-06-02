import { useState, useEffect, useCallback } from 'react';

const useApiCall = (apiFunction, dependencies = [], options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Opzioni di configurazione con valori di default
  const {
    immediate = true,
    retryAttempts = 2, // Numero di tentativi in caso di timeout
    retryDelay = 3000, // Delay tra i tentativi (3 secondi)
    onSuccess,
    onError
  } = options;

  // Funzione per eseguire la chiamata API con retry automatico
  const executeCall = useCallback(async (retryCount = 0) => {
    if (!apiFunction) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiFunction();
      setData(response);
      
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      console.error('API call error:', err);
      
      // Verifica se è un errore di timeout/cold start e se possiamo ritentare
      const isTimeoutError = err.code === 'ECONNABORTED' || 
                            err.message?.includes('timeout') ||
                            (err.request && !err.response);
      
      if (isTimeoutError && retryCount < retryAttempts) {
        console.log(`Tentativo ${retryCount + 1}/${retryAttempts + 1} fallito, riprovo tra ${retryDelay}ms...`);
        
        // Attendi prima di ritentare
        setTimeout(() => {
          executeCall(retryCount + 1);
        }, retryDelay);
        
        return; // Non impostare l'errore ancora, stiamo ritentando
      }
      
      // Se tutti i tentativi sono falliti o non è un errore di timeout
      setError(err);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [apiFunction, retryAttempts, retryDelay, onSuccess, onError]);

  // Funzione per eseguire manualmente la chiamata
  const refetch = useCallback(() => {
    executeCall();
  }, [executeCall]);

  // Effetto per eseguire la chiamata automaticamente
  useEffect(() => {
    if (immediate) {
      executeCall();
    }
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch
  };
};

export default useApiCall; 