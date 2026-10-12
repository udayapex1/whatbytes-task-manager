import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6C63FF',
    onPrimary: '#FFFFFF',
    primaryContainer: '#E8E6FF',
    onPrimaryContainer: '#2D3250',
    secondary: '#5F6380',
    background: '#F6F7FB',
    surface: '#FFFFFF',
    surfaceVariant: '#EEF0F6',
    onSurface: '#2D3250',
    onSurfaceVariant: '#686D82',
    error: '#BA1A1A',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
