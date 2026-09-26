// Shared icon registry. Admin-managed content can store either a Lucide icon
// name or an uploaded image URL, so icons are not limited to this registry.

import React, { type ComponentType } from 'react';
import {
  ArrowRight, Bot, Facebook, Globe, Instagram, LayoutDashboard, Link2,
  Linkedin, Mail, MessageCircle, Palette, Phone, Plug, Server, Settings,
  Sparkles, TrendingUp, Twitter,
} from 'lucide-react';

export const iconMap: Record<string, ComponentType<any>> = {
  ArrowRight, Bot, Facebook, Globe, Instagram, LayoutDashboard, Link2,
  Linkedin, Mail, MessageCircle, Palette, Phone, Plug, Server, Settings,
  Sparkles, TrendingUp, Twitter,
};

export const ICON_NAMES: string[] = Object.keys(iconMap).sort();

function UploadedIcon(props: { size?: number; className?: string; src: string }) {
  const { size = 24, className, src } = props;
  return React.createElement('img', { src, alt: '', 'aria-hidden': true, width: size, height: size, className: className || 'object-contain' });
}

export function resolveIcon(name?: string): ComponentType<any> {
  if (name && (/^(https?:|\/)/.test(name))) return (props) => React.createElement(UploadedIcon, { ...props, src: name });
  return (name && iconMap[name]) || iconMap.Globe;
}
