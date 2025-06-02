import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authAPI, handleAPIError } from '../services/api';
import keepAliveService from '../services/keepAlive';

// Stato iniziale
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Azioni
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

// Reducer per gestire lo stato
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
    case AUTH_ACTIONS.LOAD_USER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
    case AUTH_ACTIONS.LOAD_USER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload.user },
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Gestione keep-alive service basato sullo stato di autenticazione
  useEffect(() => {
    if (state.isAuthenticated && !state.isLoading) {
      // Avvia keep-alive quando l'utente è autenticato
      keepAliveService.start();
    } else {
      // Ferma keep-alive quando l'utente non è autenticato
      keepAliveService.stop();
    }

    // Cleanup al unmount del componente
    return () => {
      keepAliveService.stop();
    };
  }, [state.isAuthenticated, state.isLoading]);

  // Carica utente al mount se c'è un token
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          dispatch({ type: AUTH_ACTIONS.LOAD_USER_START });
          
          // Verifica che il token sia ancora valido
          const response = await authAPI.getProfile();
          
          dispatch({
            type: AUTH_ACTIONS.LOAD_USER_SUCCESS,
            payload: {
              user: response.data.data.user,
            },
          });
        } catch (error) {
          console.warn('Token validation failed:', error);
          
          // Token non valido, rimuovi dati e forza logout
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          dispatch({
            type: AUTH_ACTIONS.LOAD_USER_FAILURE,
            payload: { error: 'Sessione scaduta, effettua nuovamente il login' },
          });
        }
      } else {
        // Nessun token, utente non autenticato
        dispatch({
          type: AUTH_ACTIONS.LOAD_USER_FAILURE,
          payload: { error: null },
        });
      }
    };

    loadUser();
  }, []);

  // Funzione di login
  const login = useCallback(async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const response = await authAPI.login(credentials);
      const { user, token } = response.data.data;

      // Salva in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token },
      });

      return { success: true, user, token };
    } catch (error) {
      const errorInfo = handleAPIError(error);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorInfo.message },
      });

      return { success: false, error: errorInfo.message };
    }
  }, []);

  // Funzione di registrazione
  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });

      const response = await authAPI.register(userData);
      const { user, token } = response.data.data;

      // Salva in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: { user, token },
      });

      return { success: true, user, token };
    } catch (error) {
      const errorInfo = handleAPIError(error);
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: { error: errorInfo.message },
      });

      return { success: false, error: errorInfo.message };
    }
  }, []);

  // Funzione di logout
  const logout = useCallback(() => {
    try {
      // Rimuovi dati da localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('dashboard_last_refresh');

      // Pulisci lo stato
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      
      // Non fare reindirizzamento automatico - lascia che sia il chiamante a decidere
    } catch (error) {
      console.error('Errore durante il logout:', error);
      // Pulisci comunque lo stato
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, []);

  // Funzione per creare famiglia
  const createFamily = useCallback(async (familyData) => {
    try {
      const response = await authAPI.createFamily(familyData);
      const { user } = response.data.data;

      // Aggiorna utente con nuova famiglia
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: { user },
      });

      return { success: true, user };
    } catch (error) {
      const errorInfo = handleAPIError(error);
      return { success: false, error: errorInfo.message };
    }
  }, []);

  // Funzione per reset password
  const forgotPassword = useCallback(async (email) => {
    try {
      await authAPI.forgotPassword(email);
      return { success: true };
    } catch (error) {
      const errorInfo = handleAPIError(error);
      return { success: false, error: errorInfo.message };
    }
  }, []);

  // Funzione per reset password con token
  const resetPassword = useCallback(async (token, password) => {
    try {
      await authAPI.resetPassword(token, password);
      return { success: true };
    } catch (error) {
      const errorInfo = handleAPIError(error);
      return { success: false, error: errorInfo.message };
    }
  }, []);

  // Funzione per aggiornare profilo utente
  const updateUser = useCallback((userData) => {
    const updatedUser = { ...state.user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: { user: userData },
    });
  }, [state.user]);

  // Funzione per pulire errori
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Valore del context
  const value = {
    // Stato
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Azioni
    login,
    register,
    logout,
    createFamily,
    forgotPassword,
    resetPassword,
    updateUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizzato per usare il context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve essere usato all\'interno di AuthProvider');
  }
  
  return context;
};

export default AuthContext; 