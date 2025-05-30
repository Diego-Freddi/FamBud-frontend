import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Azioni per il reducer
const SETTINGS_ACTIONS = {
  SET_THEME: 'SET_THEME',
  SET_CURRENCY: 'SET_CURRENCY',
  SET_DATE_FORMAT: 'SET_DATE_FORMAT',
  SET_LANGUAGE: 'SET_LANGUAGE',
  SET_DASHBOARD_DEFAULT: 'SET_DASHBOARD_DEFAULT',
  LOAD_SETTINGS: 'LOAD_SETTINGS',
  RESET_SETTINGS: 'RESET_SETTINGS',
};

// Impostazioni di default
const DEFAULT_SETTINGS = {
  theme: 'light', // 'light' | 'dark'
  currency: 'EUR', // 'EUR' | 'USD' | 'GBP'
  dateFormat: 'DD/MM/YYYY', // 'DD/MM/YYYY' | 'MM/DD/YYYY'
  language: 'it', // 'it' | 'en'
  dashboardDefault: 'current-month', // 'current-month' | 'all-time'
  savedFilters: [], // Array di filtri salvati
};

// Reducer per gestire le impostazioni
const settingsReducer = (state, action) => {
  switch (action.type) {
    case SETTINGS_ACTIONS.SET_THEME:
      return { ...state, theme: action.payload };
    
    case SETTINGS_ACTIONS.SET_CURRENCY:
      return { ...state, currency: action.payload };
    
    case SETTINGS_ACTIONS.SET_DATE_FORMAT:
      return { ...state, dateFormat: action.payload };
    
    case SETTINGS_ACTIONS.SET_LANGUAGE:
      return { ...state, language: action.payload };
    
    case SETTINGS_ACTIONS.SET_DASHBOARD_DEFAULT:
      return { ...state, dashboardDefault: action.payload };
    
    case SETTINGS_ACTIONS.LOAD_SETTINGS:
      return { ...state, ...action.payload };
    
    case SETTINGS_ACTIONS.RESET_SETTINGS:
      return { ...DEFAULT_SETTINGS };
    
    default:
      return state;
  }
};

// Context
const SettingsContext = createContext();

// Provider component
export const SettingsProvider = ({ children }) => {
  const [settings, dispatch] = useReducer(settingsReducer, DEFAULT_SETTINGS);

  // Carica impostazioni da localStorage all'avvio
  useEffect(() => {
    const savedSettings = localStorage.getItem('familybudget_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        dispatch({
          type: SETTINGS_ACTIONS.LOAD_SETTINGS,
          payload: { ...DEFAULT_SETTINGS, ...parsedSettings }
        });
      } catch (error) {
        console.warn('Errore nel caricamento impostazioni:', error);
        // Se c'è un errore, usa le impostazioni di default
      }
    }
  }, []);

  // Salva impostazioni in localStorage quando cambiano
  useEffect(() => {
    localStorage.setItem('familybudget_settings', JSON.stringify(settings));
  }, [settings]);

  // Funzioni per aggiornare le impostazioni
  const setTheme = (theme) => {
    dispatch({ type: SETTINGS_ACTIONS.SET_THEME, payload: theme });
  };

  const setCurrency = (currency) => {
    dispatch({ type: SETTINGS_ACTIONS.SET_CURRENCY, payload: currency });
  };

  const setDateFormat = (format) => {
    dispatch({ type: SETTINGS_ACTIONS.SET_DATE_FORMAT, payload: format });
  };

  const setLanguage = (language) => {
    dispatch({ type: SETTINGS_ACTIONS.SET_LANGUAGE, payload: language });
  };

  const setDashboardDefault = (defaultView) => {
    dispatch({ type: SETTINGS_ACTIONS.SET_DASHBOARD_DEFAULT, payload: defaultView });
  };

  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const resetSettings = () => {
    dispatch({ type: SETTINGS_ACTIONS.RESET_SETTINGS });
  };

  // Funzioni di utilità
  const isDarkMode = settings.theme === 'dark';
  
  const formatCurrency = (amount) => {
    const currencySymbols = {
      EUR: '€',
      USD: '$',
      GBP: '£'
    };
    
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: settings.currency,
      currencyDisplay: 'symbol'
    }).format(amount);
  };

  const formatDate = (date) => {
    const dateObj = new Date(date);
    if (settings.dateFormat === 'MM/DD/YYYY') {
      return dateObj.toLocaleDateString('en-US');
    }
    return dateObj.toLocaleDateString('it-IT');
  };

  // Valore del context
  const value = {
    // Stato
    settings,
    isDarkMode,
    
    // Azioni
    setTheme,
    setCurrency,
    setDateFormat,
    setLanguage,
    setDashboardDefault,
    toggleTheme,
    resetSettings,
    
    // Utilità
    formatCurrency,
    formatDate,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Hook personalizzato per usare il context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  
  if (!context) {
    throw new Error('useSettings deve essere usato all\'interno di SettingsProvider');
  }
  
  return context;
};

export default SettingsContext; 