// src/styles/theme.ts
import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    teal: Palette['primary'];
    charcoal: Palette['primary'];
    coral: Palette['primary'];
    sand: Palette['primary'];
    offWhite: Palette['primary'];
  }
  interface PaletteOptions {
    teal?: PaletteOptions['primary'];
    charcoal?: PaletteOptions['primary'];
    coral?: PaletteOptions['primary'];
    sand?: PaletteOptions['primary'];
    offWhite?: PaletteOptions['primary'];
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#17BEBB',  // Teal
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#CD5334',  // Coral
      contrastText: '#FFFFFF',
    },
    teal: {
      main: '#17BEBB',
      light: '#4CCBC9',
      dark: '#108583',
      contrastText: '#FFFFFF',
    },
    charcoal: {
      main: '#2E282A',
      light: '#4E4A4B',
      dark: '#1F1C1D',
      contrastText: '#FFFFFF',
    },
    coral: {
      main: '#CD5334',
      light: '#D7785F',
      dark: '#A3422A',
      contrastText: '#FFFFFF',
    },
    sand: {
      main: '#E2D1C3',
      light: '#E9DCD2',
      dark: '#C5B5A7',
      contrastText: '#2E282A',
    },
    offWhite: {
      main: '#F2E9E2',
      light: '#FFFFFF',
      dark: '#D5CDC6',
      contrastText: '#2E282A',
    },
    background: {
      default: '#F2E9E2',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2E282A',
      secondary: '#4E4A4B',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      color: '#2E282A',
    },
    h2: {
      fontWeight: 600,
      color: '#2E282A',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: {
          backgroundColor: '#17BEBB',
          '&:hover': {
            backgroundColor: '#108583',
          },
        },
        containedSecondary: {
          backgroundColor: '#CD5334',
          '&:hover': {
            backgroundColor: '#A3422A',
          },
        },
      },
    },
  },
});

export default theme;
