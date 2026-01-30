import { createTheme } from '@mui/material/styles';

// Industrial color palette - professional and clean
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1565c0', // Industrial Blue
      light: '#1976d2',
      dark: '#0d47a1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#37474f', // Industrial Gray
      light: '#546e7a',
      dark: '#263238',
    },
    success: {
      main: '#2e7d32', // Industrial Green
      light: '#4caf50',
      dark: '#1b5e20',
    },
    warning: {
      main: '#f57c00', // Industrial Orange
      light: '#ff9800',
      dark: '#e65100',
    },
    error: {
      main: '#c62828', // Industrial Red
      light: '#ef5350',
      dark: '#b71c1c',
    },
    info: {
      main: '#0277bd',
      light: '#03a9f4',
      dark: '#01579b',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#616161',
    },
    divider: '#e0e0e0',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 500,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
    overline: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      letterSpacing: '1px',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'uppercase',
      fontWeight: 500,
      fontSize: '0.875rem',
      letterSpacing: '0.5px',
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          border: '1px solid #e0e0e0',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          },
          transition: 'box-shadow 0.2s ease',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 4,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1565c0',
          color: '#ffffff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          height: 6,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
  },
});

export default theme;
