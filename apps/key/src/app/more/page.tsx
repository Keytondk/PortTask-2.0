'use client';

import Link from 'next/link';
import { Card } from '@navo/ui';
import {
  FileText,
  Building2,
  FolderOpen,
  Map,
  BarChart3,
  Settings,
  HelpCircle,
  Bell,
  User,
  ChevronRight,
} from 'lucide-react';

const menuItems = [
  {
    category: 'Operations',
    items: [
      { href: '/rfqs', label: 'RFQs', icon: FileText, description: 'Manage quotes' },
      { href: '/vendors', label: 'Vendors', icon: Building2, description: 'Vendor network' },
      { href: '/documents', label: 'Documents', icon: FolderOpen, description: 'File management' },
      { href: '/fleet-map', label: 'Fleet Map', icon: Map, description: 'Track vessels' },
    ],
  },
  {
    category: 'Insights',
    items: [
      { href: '/analytics', label: 'Analytics', icon: BarChart3, description: 'Reports & metrics' },
      { href: '/notifications', label: 'Notifications', icon: Bell, description: 'Alerts & updates' },
    ],
  },
  {
    category: 'Account',
    items: [
      { href: '/profile', label: 'Profile', icon: User, description: 'Your account' },
      { href: '/settings', label: 'Settings', icon: Settings, description: 'Preferences' },
      { href: '/help', label: 'Help & Support', icon: HelpCircle, description: 'Get assistance' },
    ],
  },
];

export default function MorePage() {
  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">More</h1>
        <p className="text-muted-foreground">Additional features and settings</p>
      </div>

      {menuItems.map((group) => (
        <div key={group.category}>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            {group.category}
          </h2>
          <Card className="divide-y">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              );
            })}
          </Card>
        </div>
      ))}

      {/* App version */}
      <div className="pt-4 text-center text-xs text-muted-foreground">
        <p>Navo Maritime Platform v1.0.0</p>
        <p>&copy; {new Date().getFullYear()} Navo. All rights reserved.</p>
      </div>
    </div>
  );
}
