export const priorities = ['low', 'medium', 'high'] as const;

export type Priority = (typeof priorities)[number];

export const priorityLabels: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};
