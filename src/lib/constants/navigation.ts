import { Home, Map, MessageCircle, CreditCard, Settings } from 'lucide-react';

export const BOTTOM_NAV_ITEMS = [
  { key: 'home', label: 'Home', href: '/app', icon: 'Home' },
  { key: 'map', label: 'Map', href: '/app/map', icon: 'Map' },
  { key: 'chat', label: 'Chat', href: '/app/chat', icon: 'MessageCircle' },
  { key: 'plan', label: 'Plan', href: '/app/plan', icon: 'CreditCard' },
  { key: 'settings', label: 'Settings', href: '/app/settings', icon: 'Settings' },
] as const;

export const CHAT_TABS = [
  { key: 'matches', label: 'MATCHES' },
  { key: 'chat', label: 'CHAT' },
] as const;
