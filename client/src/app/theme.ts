'use client';

import { createTheme } from '@mui/material/styles';
import { Playfair_Display_SC, Kalnia_Glaze } from 'next/font/google';

const playfair = Playfair_Display_SC({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const kalnia = Kalnia_Glaze({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#d32f2f',
      light: '#ff6868ff',
      dark: '#6d0505ff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#636363ff',
      paper: '#4f4a4aff',
    },
    text: {
      primary: '#fff',
      secondary: '#fff',
    }
  },
  typography: {
    fontFamily: `${playfair.style.fontFamily}, sans-serif`,
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
});
