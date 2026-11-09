import { Binary, Cpu, MessagesSquare, Monitor, Network, Server } from 'lucide-react';

const ICONS = {
  frontend: Monitor,
  backend: Server,
  'system-design': Network,
  dsa: Binary,
  'cs-fundamentals': Cpu,
  behavioral: MessagesSquare,
};

export const getCategoryIcon = (id) => ICONS[id] ?? Monitor;
