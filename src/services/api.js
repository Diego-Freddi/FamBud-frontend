import axios from 'axios';

// Configurazione base API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

// Istanza axios configurata
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per aggiungere automaticamente il token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor per gestire risposte e errori
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log dell'errore per debugging
    console.warn('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      message: error.response?.data?.message || error.message
    });

    // Se il token è scaduto o non valido, rimuovilo
    if (error.response?.status === 401) {
      // Verifica che sia davvero un problema di autenticazione
      const errorMessage = error.response?.data?.message || '';
      const isAuthError = errorMessage.includes('Token') || 
                         errorMessage.includes('Accesso negato') ||
                         errorMessage.includes('non valido') ||
                         errorMessage.includes('scaduto');
      
      if (isAuthError) {
        console.warn('Token authentication failed, clearing localStorage:', errorMessage);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('dashboard_last_refresh');
        
        // Non fare reindirizzamento automatico - lascia che sia React Router a gestirlo
        // Il PrivateRoute si accorgerà che isAuthenticated è false e reindirizza
      }
    }
    
    return Promise.reject(error);
  }
);

// Servizi API organizzati per categoria

// AUTH SERVICES
export const authAPI = {
  // Registrazione
  register: (userData) => api.post('/auth/register', userData),
  
  // Login
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Profilo utente
  getProfile: () => api.get('/auth/me'),
  
  // Creazione famiglia
  createFamily: (familyData) => api.post('/auth/create-family', familyData),
  
  // Reset password
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

// FAMILY SERVICES
export const familyAPI = {
  // Ottieni famiglia
  getFamily: () => api.get('/family'),
  
  // Aggiorna famiglia
  updateFamily: (familyData) => api.put('/family', familyData),
  
  // Invita membro
  inviteMember: (inviteData) => api.post('/family/invite', inviteData),
  
  // Verifica dettagli invito
  verifyInvite: (token) => api.get(`/family/invite/${token}`),
  
  // Accetta invito
  joinFamily: (token) => api.post(`/family/join/${token}`),
  
  // Lascia famiglia
  leaveFamily: () => api.post('/family/leave'),
  
  // Aggiorna ruolo membro
  updateMemberRole: (userId, role) => api.put(`/family/members/${userId}`, { role }),
  
  // Rimuovi membro
  removeMember: (userId) => api.delete(`/family/members/${userId}`),
  
  // Gestione inviti
  getInvitations: () => api.get('/family/invitations'),
  
  // Cancella invito
  cancelInvitation: (invitationId) => api.delete(`/family/invitations/${invitationId}`),
  
  // Upload banner famiglia
  uploadFamilyBanner: (formData) => api.post('/family/upload-banner', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // Imposta banner tramite URL
  setFamilyBannerUrl: (bannerData) => api.put('/family/set-banner-url', bannerData),
  
  // Rimuovi banner famiglia
  removeFamilyBanner: () => api.delete('/family/banner'),
};

// PROFILE SERVICES
export const profileAPI = {
  // Cambia password
  changePassword: (passwordData) => api.put('/profile/change-password', passwordData),
  
  // Cambia email
  changeEmail: (emailData) => api.put('/profile/change-email', emailData),
  
  // Upload avatar
  uploadAvatar: (formData) => api.post('/profile/upload-avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // Imposta avatar tramite URL
  setAvatarUrl: (avatarData) => api.put('/profile/set-avatar-url', avatarData),
  
  // Esporta dati
  exportData: () => api.get('/profile/export-data'),
  
  // Elimina account
  deleteAccount: (passwordData) => api.delete('/profile/delete-account', { data: passwordData }),
};

// EXPENSE SERVICES
export const expenseAPI = {
  // Lista spese
  getExpenses: (params = {}) => api.get('/expenses', { params }),
  
  // Singola spesa
  getExpense: (id) => api.get(`/expenses/${id}`),
  
  // Crea spesa
  createExpense: (expenseData) => api.post('/expenses', expenseData),
  
  // Aggiorna spesa
  updateExpense: (id, expenseData) => api.put(`/expenses/${id}`, expenseData),
  
  // Elimina spesa
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
  
  // Statistiche spese
  getExpenseStats: (params = {}) => api.get('/expenses/stats', { params }),
};

// INCOME SERVICES
export const incomeAPI = {
  // Lista entrate
  getIncomes: (params = {}) => api.get('/incomes', { params }),
  
  // Singola entrata
  getIncome: (id) => api.get(`/incomes/${id}`),
  
  // Crea entrata
  createIncome: (incomeData) => api.post('/incomes', incomeData),
  
  // Aggiorna entrata
  updateIncome: (id, incomeData) => api.put(`/incomes/${id}`, incomeData),
  
  // Elimina entrata
  deleteIncome: (id) => api.delete(`/incomes/${id}`),
  
  // Statistiche entrate
  getIncomeStats: (params = {}) => api.get('/incomes/stats', { params }),
  
  // Processa entrate ricorrenti
  processRecurringIncomes: () => api.post('/incomes/process-recurring'),
};

// CATEGORY SERVICES
export const categoryAPI = {
  // Lista categorie
  getCategories: () => api.get('/categories'),
  
  // Singola categoria
  getCategory: (id) => api.get(`/categories/${id}`),
  
  // Crea categoria
  createCategory: (categoryData) => api.post('/categories', categoryData),
  
  // Aggiorna categoria
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  
  // Elimina categoria
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  
  // Statistiche categorie
  getCategoryStats: () => api.get('/categories/stats'),
  
  // Riordina categorie
  reorderCategories: (categoryIds) => api.put('/categories/reorder', { categoryIds }),
};

// BUDGET SERVICES
export const budgetAPI = {
  // Lista budget
  getBudgets: (params = {}) => api.get('/budgets', { params }),
  
  // Singolo budget
  getBudget: (id) => api.get(`/budgets/${id}`),
  
  // Crea budget
  createBudget: (budgetData) => api.post('/budgets', budgetData),
  
  // Aggiorna budget
  updateBudget: (id, budgetData) => api.put(`/budgets/${id}`, budgetData),
  
  // Elimina budget
  deleteBudget: (id) => api.delete(`/budgets/${id}`),
  
  // Riassunto budget
  getBudgetSummary: (params = {}) => api.get('/budgets/summary', { params }),
  
  // Creazione automatica budget
  autoCreateBudgets: (params = {}) => api.post('/budgets/auto-create', params),
  
  // Aggiorna statistiche
  refreshBudgetStats: () => api.post('/budgets/refresh-stats'),
};

// Utility per gestione errori
export const handleAPIError = (error) => {
  if (error.response) {
    // Errore dal server
    return {
      message: error.response.data.message || 'Errore del server',
      status: error.response.status,
      data: error.response.data
    };
  } else if (error.request) {
    // Errore di rete
    return {
      message: 'Errore di connessione. Controlla la tua connessione internet.',
      status: 0,
      data: null
    };
  } else {
    // Errore generico
    return {
      message: error.message || 'Errore sconosciuto',
      status: -1,
      data: null
    };
  }
};

export default api; 