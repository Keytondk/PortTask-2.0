'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Anchor,
  Ship,
  ClipboardList,
  FileText,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  X,
} from 'lucide-react';
import { cn, Button, Separator } from '@navo/ui';

const navigation = [
  { name: 'Command', href: '/', icon: LayoutDashboard },
  { name: 'Port Calls', href: '/port-calls', icon: Anchor },
  { name: 'Vessels', href: '/vessels', icon: Ship },
  { name: 'Services', href: '/services', icon: ClipboardList },
  { name: 'RFQs', href: '/rfqs', icon: FileText },
  { name: 'Vendors', href: '/vendors', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/" className="flex items-center gap-3" onClick={onClose}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
            <Anchor className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight">Navo</span>
            <p className="text-[10px] text-muted-foreground">Maritime Operations</p>
          </div>
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Main Menu
        </p>
        {navigation.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary-foreground')} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Secondary navigation */}
      <div className="border-t p-3">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Support
        </p>
        {secondaryNavigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* User info */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            JO
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium">John Operator</p>
            <p className="truncate text-xs text-muted-foreground">operator@navo.io</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function DesktopSidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r bg-card lg:flex">
      <Sidebar />
    </aside>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-card shadow-xl lg:hidden animate-in slide-in-from-left duration-300">
        <Sidebar onClose={onClose} />
      </div>
    </>
  );
}
