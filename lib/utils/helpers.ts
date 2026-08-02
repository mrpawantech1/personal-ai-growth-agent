import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  if (typeof date === 'string') date = new Date(date);
  return format(date, 'MMM d, yyyy h:mm a');
}

export function formatDateShort(date: Date | string): string {
  if (typeof date === 'string') date = new Date(date);
  return format(date, 'MMM d, yyyy');
}

export function timeAgo(date: Date | string): string {
  if (typeof date === 'string') date = new Date(date);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDateShort(date);
}

export function truncate(text: string, length: number = 100): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
