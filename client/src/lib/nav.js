import { CalendarPlus, FileText, LayoutDashboard, LayoutGrid, ListChecks } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/categories', label: 'Categories', icon: LayoutGrid },
  { to: '/book', label: 'Book a session', icon: CalendarPlus },
  { to: '/interviews', label: 'My sessions', icon: ListChecks },
  { to: '/resumes', label: 'Resumes', icon: FileText },
];
