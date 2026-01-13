'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@navo/ui';
import {
  Menu,
  X,
  Home,
  Anchor,
  Ship,
  Wrench,
  FileText,
  Building2,
  FolderOpen,
  Map,
  Settings,
  LogOut,
  BarChart3,
  Bell,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/port-calls', label: 'Port Calls', icon: Anchor },
  { href: '/vessels', label: 'Vessels', icon: Ship },
  { href: '/services', label: 'Services', icon: Wrench },
  { href: '/rfqs', label: 'RFQs', icon: FileText },
  { href: '/vendors', label: 'Vendors', icon: Building2 },
  { href: '/documents', label: 'Documents', icon: FolderOpen },
  { href: '/fleet-map', label: 'Fleet Map', icon: Map },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const secondaryItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile header */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Anchor className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold">Navo</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile menu drawer */}
      <nav
        className={`fixed bottom-0 right-0 top-0 z-50 w-72 transform bg-background shadow-xl transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Menu header */}
          <div className="flex h-14 items-center justify-between border-b px-4">
            <span className="font-semibold">Menu</span>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation items */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                    <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                  </Link>
                );
              })}
            </div>

            <div className="my-4 border-t" />

            <div className="space-y-1 px-3">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User section */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-semibold text-primary">JO</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">John Operator</p>
                <p className="text-xs text-muted-foreground">john@navo.io</p>
              </div>
            </div>
            <Button variant="outline" className="mt-3 w-full" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed header */}
      <div className="h-14 lg:hidden" />
    </>
  );
}
