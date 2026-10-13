import { MD3LightTheme } from 'react-native-paper';

export const palette = {
  mist: '#EAEFEF',
  slate: '#BFC9D1',
  ink: '#25343F',
  orange: '#FF9B51',
  white: '#FFFFFF',
} as const;

export const theme = {
  ...MD3LightTheme,
  roundness: 14,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.orange,
    onPrimary: palette.ink,
    primaryContainer: palette.slate,
    onPrimaryContainer: palette.ink,
    secondary: palette.slate,
    onSecondary: palette.ink,
    background: palette.mist,
    surface: palette.white,
    surfaceVariant: palette.mist,
    onSurface: palette.ink,
    onSurfaceVariant: palette.ink,
    error: palette.orange,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
