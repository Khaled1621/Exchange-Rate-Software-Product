import { createTheme } from '@mui/material/styles';

// Light theme colors
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3da0d9',
      light: '#6fd1ff',
      dark: '#0073a7',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0093d5',
      light: '#58c4ff',
      dark: '#0065a3',
      contrastText: '#ffffff',
    },
    background: {
      default: '#e9ebf0',
      paper: '#ffffff',
      card: '#D4E9F5',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
    chart: {
      usdToLbp: 'rgb(75, 192, 192)',
      lbpToUsd: 'rgb(255, 99, 132)',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 8px rgba(41, 7, 136, 0.2)',
        },
      },
    },
  },
});

// Dark theme colors
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4ba6de',
      light: '#6fd1ff',
      dark: '#0073a7',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0093d5',
      light: '#58c4ff',
      dark: '#0065a3',
      contrastText: '#ffffff',
    },
    background: {
      default: '#1a1a2e',
      paper: '#1e1e1e',
      card: '#1a2035',
      header: '#1a1a2e',
      exchangeCard: '#1e2130',
      exchangeHighlight: '#2a3142',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#a0a0a0',
      accent: '#4ba6de',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    chart: {
      usdToLbp: 'rgb(75, 192, 192)',
      lbpToUsd: 'rgb(255, 99, 132)',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a2e',
        },
      },
    },
  },
});

export { lightTheme, darkTheme };
