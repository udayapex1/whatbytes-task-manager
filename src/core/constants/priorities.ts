export const priorities = ['low', 'medium', 'high'] as const;

export type Priority = (typeof priorities)[number];

export const priorityLabels: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const priorityColors: Record<Priority, string> = {
  low: '#2E9B68',
  medium: '#D8891E',
  high: '#D84C4C',
};

export const priorityBackgroundColors: Record<Priority, string> = {
  low: '#E4F6EC',
  medium: '#FFF0D7',
  high: '#FCE5E5',
};
