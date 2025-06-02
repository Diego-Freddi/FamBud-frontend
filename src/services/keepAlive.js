// Servizio Keep-Alive per ridurre i cold start del server
class KeepAliveService {
  constructor() {
    this.intervalId = null;
    this.isActive = false;
    this.pingInterval = 10 * 60 * 1000; // 10 minuti
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 secondi
  }

  // Avvia il servizio keep-alive
  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    console.log('🔄 Keep-alive service started');
    
    // Primo ping immediato
    this.ping();
    
    // Ping periodici
    this.intervalId = setInterval(() => {
      this.ping();
    }, this.pingInterval);
  }

  // Ferma il servizio keep-alive
  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('⏹️ Keep-alive service stopped');
  }

  // Esegue un ping al server
  async ping(retryCount = 0) {
    if (!this.isActive) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondi timeout

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5050/api'}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ Keep-alive ping successful');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn(`⚠️ Keep-alive ping failed (attempt ${retryCount + 1}):`, error.message);
      
      // Retry se non abbiamo superato il limite
      if (retryCount < this.maxRetries && this.isActive) {
        setTimeout(() => {
          this.ping(retryCount + 1);
        }, this.retryDelay);
      }
    }
  }

  // Verifica se il servizio è attivo
  isRunning() {
    return this.isActive;
  }

  // Cambia l'intervallo di ping
  setInterval(minutes) {
    this.pingInterval = minutes * 60 * 1000;
    
    if (this.isActive) {
      this.stop();
      this.start();
    }
  }
}

// Istanza singleton
const keepAliveService = new KeepAliveService();

// Hook per utilizzare il servizio nei componenti React
export const useKeepAlive = () => {
  const start = () => keepAliveService.start();
  const stop = () => keepAliveService.stop();
  const isRunning = () => keepAliveService.isRunning();
  const setInterval = (minutes) => keepAliveService.setInterval(minutes);

  return {
    start,
    stop,
    isRunning,
    setInterval
  };
};

export default keepAliveService;