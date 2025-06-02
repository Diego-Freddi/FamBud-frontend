import { useState, useEffect, useCallback } from 'react';

const useApiCall = (apiFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Funzione per eseguire la chiamata API
  const executeCall = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiFunction();
      setData(response.data);
      
    } catch (err) {
      console.error('❌ Errore chiamata API:', err);
      setError(err.response?.data?.message || err.message || 'Errore di rete');
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  // Esegui chiamata quando cambiano le dipendenze
  useEffect(() => {
    executeCall();
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  // Funzione refetch per uso esterno
  const refetch = useCallback(() => {
    return executeCall();
  }, [executeCall]);

  return {
    data,
    loading,
    error,
    refetch
  };
};

export default useApiCall; 