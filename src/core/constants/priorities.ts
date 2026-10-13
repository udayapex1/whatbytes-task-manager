import { palette } from '../theme/theme';

export const priorities = ['low', 'medium', 'high'] as const;

export type Priority = (typeof priorities)[number];

export const priorityLabels: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const priorityColors: Record<Priority, string> = {
  low: palette.slate,
  medium: palette.orange,
  high: palette.ink,
};

export const priorityBackgroundColors: Record<Priority, string> = {
  low: palette.mist,
  medium: palette.mist,
  high: palette.slate,
};
