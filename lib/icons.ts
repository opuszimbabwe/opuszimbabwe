// Shared lucide icon registry. Admin-managed content stores icon names as
// strings (D1 text columns), so every place that renders one resolves it here.

import type { ComponentType } from 'react';
import {
  ArrowRight,
  Bot,
  Facebook,
  Globe,
  Instagram,
  LayoutDashboard,
  Link2,
  Linkedin,
  Mail,
  MessageCircle,
  Palette,
  Phone,
  Plug,
  Server,
  Settings,
  Sparkles,
  TrendingUp,
  Twitter,
} from 'lucide-react';

export const iconMap: Record<string, ComponentType<any>> = {
  ArrowRight,
  Bot,
  Facebook,
  Globe,
  Instagram,
  LayoutDashboard,
  Link2,
  Linkedin,
  Mail,
  MessageCircle,
  Palette,
  Phone,
  Plug,
  Server,
  Settings,
  Sparkles,
  TrendingUp,
  Twitter,
};

export const ICON_NAMES: string[] = Object.keys(iconMap).sort();

export function resolveIcon(name?: string): ComponentType<any> {
  return (name && iconMap[name]) || iconMap.Globe;
}
