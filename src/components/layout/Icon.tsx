"use client";

import {
  Bookmark, BookmarkCheck, Bus, Briefcase, Building2, Calendar, Car, Check, CheckCircle2,
  ChevronLeft, ChevronRight, ChevronDown, CircleAlert, Clock, Construction, Copy, CreditCard,
  Droplets, FileText, Filter, GraduationCap, Heart, HeartPulse, Home, IdCard, Image as ImageIcon,
  Info, LayoutDashboard, LayoutGrid, Leaf, Lightbulb, Link2, ListFilter, Loader2, MapPin, Megaphone,
  Menu, MessageCircle, Moon, Newspaper, Paperclip, Pencil, Phone, Plug, Plus, Search, Send,
  Share2, ShieldAlert, Signal, SignalZero, Sparkles, Star, Sun, Trash2, TrendingUp, Trash,
  Users, Wallet, Waves, X, Zap, ArrowLeft, ArrowUpRight, AlertTriangle, BarChart3, Layers,
  RefreshCw, Download, LogOut, Settings, CircleCheck, Timer, Target, Wifi, WifiOff, Eye,
} from "lucide-react";
import type { ComponentProps } from "react";

const MAP = {
  bookmark: Bookmark, "bookmark-check": BookmarkCheck, bus: Bus, briefcase: Briefcase,
  "building-2": Building2, calendar: Calendar, car: Car, check: Check,
  "check-circle": CheckCircle2, "chevron-left": ChevronLeft, "chevron-right": ChevronRight,
  "chevron-down": ChevronDown, "circle-alert": CircleAlert, clock: Clock,
  construction: Construction, copy: Copy, "credit-card": CreditCard, droplets: Droplets,
  "file-text": FileText, filter: Filter, "graduation-cap": GraduationCap, heart: Heart,
  "heart-pulse": HeartPulse, home: Home, "id-card": IdCard, image: ImageIcon, info: Info,
  "layout-dashboard": LayoutDashboard, "layout-grid": LayoutGrid, leaf: Leaf,
  lightbulb: Lightbulb, "link-2": Link2, "list-filter": ListFilter, loader: Loader2,
  "map-pin": MapPin, megaphone: Megaphone, menu: Menu, "message-circle": MessageCircle,
  moon: Moon, newspaper: Newspaper, paperclip: Paperclip, pencil: Pencil, phone: Phone,
  plug: Plug, plus: Plus, search: Search, send: Send, "share-2": Share2,
  "shield-alert": ShieldAlert, signal: Signal, "signal-zero": SignalZero, sparkles: Sparkles,
  star: Star, sun: Sun, "trash-2": Trash2, "trending-up": TrendingUp, trash: Trash,
  users: Users, wallet: Wallet, waves: Waves, x: X, zap: Zap, "arrow-left": ArrowLeft,
  "arrow-up-right": ArrowUpRight, "alert-triangle": AlertTriangle, "bar-chart": BarChart3,
  layers: Layers, "refresh-cw": RefreshCw, download: Download, "log-out": LogOut,
  settings: Settings, "circle-check": CircleCheck, timer: Timer, target: Target,
  wifi: Wifi, "wifi-off": WifiOff, eye: Eye,
} as const;

export type IconName = keyof typeof MAP;

export function Icon({
  name,
  size = 18,
  ...props
}: { name: string; size?: number } & Omit<ComponentProps<"svg">, "name" | "ref">) {
  const Component = MAP[name as IconName] ?? Info;
  return <Component size={size} strokeWidth={1.9} {...props} />;
}
