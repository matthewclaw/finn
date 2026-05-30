import { format, parseISO, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

export function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function monthBounds(month: string): { start: string; end: string } {
  const d = parseISO(`${month}-01`);
  return {
    start: format(startOfMonth(d), 'yyyy-MM-dd'),
    end: format(endOfMonth(d), 'yyyy-MM-dd'),
  };
}

export function currentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function previousMonth(month: string): string {
  const d = parseISO(`${month}-01`);
  d.setMonth(d.getMonth() - 1);
  return format(d, 'yyyy-MM');
}

export function daysBetween(a: string, b: string): number {
  return Math.abs(differenceInDays(parseISO(b), parseISO(a)));
}

export function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
}

export function isValidMonth(s: string): boolean {
  return /^\d{4}-\d{2}$/.test(s);
}
