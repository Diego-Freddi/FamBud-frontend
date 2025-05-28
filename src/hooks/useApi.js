import { useState, useEffect, useCallback, useRef } from 'react';
import { handleAPIError } from '../services/api';

// Hook per chiamate API con gestione automatica di loading e errori
export const useApi = (apiFunction, dependencies = [], immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const executeRef = useRef();

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFunction(...args);
      
      // Controlla se il componente è ancora montato
      if (mountedRef.current) {
        setData(response.data);
      }
      return { success: true, data: response.data };
    } catch (err) {
      const errorInfo = handleAPIError(err);
      if (mountedRef.current) {
        setError(errorInfo.message);
      }
      return { success: false, error: errorInfo.message };
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiFunction]);

  // Aggiorna la ref ogni volta che execute cambia
  useEffect(() => {
    executeRef.current = execute;
  });

  // Funzione refetch stabilizzata che usa la ref
  const refetch = useCallback((...args) => {
    return executeRef.current(...args);
  }, []);

  // Esegui la chiamata iniziale solo se immediate è true
  useEffect(() => {
    if (immediate) {
      execute();
    }
    
    // Cleanup function
    return () => {
      mountedRef.current = false;
    };
  }, [immediate, ...dependencies]);

  return {
    data,
    loading,
    error,
    execute,
    refetch,
    setData, // Per aggiornamenti ottimistici
  };
};

export default useApi; 