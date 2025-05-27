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
    // Se il token è scaduto, rimuovilo e reindirizza al login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
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
  // Info famiglia
  getFamily: () => api.get('/family'),
  
  // Aggiorna famiglia
  updateFamily: (familyData) => api.put('/family', familyData),
  
  // Invita membro
  inviteMember: (inviteData) => api.post('/family/invite', inviteData),
  
  // Accetta invito
  joinFamily: (token) => api.post(`/family/join/${token}`),
  
  // Lascia famiglia
  leaveFamily: () => api.post('/family/leave'),
  
  // Gestione membri
  updateMemberRole: (userId, role) => api.put(`/family/members/${userId}`, { role }),
  removeMember: (userId) => api.delete(`/family/members/${userId}`),
  
  // Gestione inviti
  getInvitations: () => api.get('/family/invitations'),
  cancelInvitation: (invitationId) => api.delete(`/family/invitations/${invitationId}`),
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