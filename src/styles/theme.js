import { createTheme } from '@mui/material/styles';

// Palette colori personalizzata per FamilyBudget
const palette = {
  primary: {
    main: '#1976d2', // Blu principale
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#dc004e', // Rosa/Rosso per accenti
    light: '#ff5983',
    dark: '#9a0036',
    contrastText: '#ffffff',
  },
  success: {
    main: '#2e7d32', // Verde per entrate/successi
    light: '#4caf50',
    dark: '#1b5e20',
  },
  warning: {
    main: '#ed6c02', // Arancione per avvisi budget
    light: '#ff9800',
    dark: '#e65100',
  },
  error: {
    main: '#d32f2f', // Rosso per errori/spese eccessive
    light: '#ef5350',
    dark: '#c62828',
  },
  info: {
    main: '#0288d1', // Blu chiaro per informazioni
    light: '#03a9f4',
    dark: '#01579b',
  },
  background: {
    default: '#fafafa',
    paper: '#ffffff',
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
  },
};

// Tipografia personalizzata
const typography = {
  fontFamily: [
    'Roboto',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(','),
  h1: {
    fontSize: '2.5rem',
    fontWeight: 600,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.6,
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.5,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.43,
  },
  button: {
    textTransform: 'none', // Rimuove il maiuscolo automatico
    fontWeight: 500,
  },
};

// Componenti personalizzati
const components = {
  // Card personalizzate
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'box-shadow 0.3s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        },
      },
    },
  },
  
  // Button personalizzati
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '8px 16px',
        fontSize: '0.875rem',
        fontWeight: 500,
      },
      contained: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        },
      },
    },
  },
  
  // TextField personalizzati
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
        },
      },
    },
  },
  
  // Paper personalizzato
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
      elevation1: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
      elevation2: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
      },
      elevation3: {
        boxShadow: '0 3px 9px rgba(0,0,0,0.1)',
      },
    },
  },
  
  // Chip personalizzati
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        fontWeight: 500,
      },
    },
  },
  
  // AppBar personalizzata
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    },
  },
  
  // Drawer personalizzato
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: '1px solid rgba(0,0,0,0.08)',
      },
    },
  },
};

// Tema principale (light mode)
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    ...palette,
  },
  typography,
  components,
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
});

// Tema scuro
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
      light: '#e3f2fd',
      dark: '#42a5f5',
    },
    secondary: {
      main: '#f48fb1',
      light: '#fce4ec',
      dark: '#ad1457',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  typography,
  components: {
    ...components,
    MuiCard: {
      styleOverrides: {
        root: {
          ...components.MuiCard.styleOverrides.root,
          backgroundColor: '#1e1e1e',
          borderRadius: 12,
        },
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
});

// Colori specifici per categorie (consistenti con il backend)
export const categoryColors = {
  alimentari: '#10B981',     // Verde (backend)
  trasporti: '#3B82F6',      // Blu (backend)
  casa: '#8B5CF6',           // Viola (backend)
  salute: '#EF4444',         // Rosso (backend)
  intrattenimento: '#F59E0B', // Arancione (backend)
  abbigliamento: '#EC4899',  // Rosa (backend)
  educazione: '#06B6D4',     // Ciano (backend)
  altro: '#6B7280',          // Grigio (backend)
};

// Breakpoints personalizzati
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
};

// Utilità per responsive design
export const useResponsive = (theme) => ({
  isMobile: theme.breakpoints.down('sm'),
  isTablet: theme.breakpoints.between('sm', 'md'),
  isDesktop: theme.breakpoints.up('lg'),
});

export default lightTheme; 