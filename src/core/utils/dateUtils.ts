const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const isSameDay = (firstDate: Date, secondDate: Date): boolean =>
  startOfDay(firstDate).getTime() === startOfDay(secondDate).getTime();

export const isOverdue = (date: Date, now: Date = new Date()): boolean =>
  startOfDay(date).getTime() < startOfDay(now).getTime();

export const formatDate = (date: Date): string =>
  date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export const formatToday = (date: Date = new Date()): string =>
  date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

export const getDateGroup = (date: Date, now: Date = new Date()): string => {
  if (isSameDay(date, now)) return 'Today';

  const tomorrow = new Date(startOfDay(now));
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(date, tomorrow)) return 'Tomorrow';

  const nextWeek = new Date(startOfDay(now));
  nextWeek.setDate(nextWeek.getDate() + 7);
  return startOfDay(date).getTime() < nextWeek.getTime() ? 'This week' : 'Later';
};

export const dateUtils = {
  formatDate,
  formatToday,
  getDateGroup,
  isOverdue,
  isSameDay,
};
