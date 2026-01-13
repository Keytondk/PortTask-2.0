'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Button,
  Card,
  Input,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@navo/ui';
import {
  Plus,
  Search,
  Building2,
  MapPin,
  Star,
  Phone,
  Mail,
  ChevronRight,
  Filter,
} from 'lucide-react';

const vendors = [
  {
    id: '1',
    name: 'Marine Fuel Solutions',
    type: 'Bunker Supplier',
    location: 'Singapore',
    country: 'SG',
    rating: 4.8,
    reviewCount: 156,
    services: ['Bunker Supply', 'Lubricants'],
    status: 'active',
    contact: {
      name: 'John Smith',
      email: 'john@marinefuel.com',
      phone: '+65 9123 4567',
    },
    totalOrders: 45,
    lastOrder: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    name: 'Port Services International',
    type: 'Multi-Service Provider',
    location: 'Rotterdam',
    country: 'NL',
    rating: 4.6,
    reviewCount: 89,
    services: ['Provisions', 'Crew Services', 'Waste Disposal'],
    status: 'active',
    contact: {
      name: 'Hans Mueller',
      email: 'hans@portservices.eu',
      phone: '+31 20 123 4567',
    },
    totalOrders: 28,
    lastOrder: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    name: 'Gulf Marine Services',
    type: 'Ship Repairs & Maintenance',
    location: 'Dubai',
    country: 'AE',
    rating: 4.4,
    reviewCount: 67,
    services: ['Repairs', 'Maintenance', 'Spare Parts'],
    status: 'active',
    contact: {
      name: 'Ahmed Hassan',
      email: 'ahmed@gulfmarine.ae',
      phone: '+971 4 123 4567',
    },
    totalOrders: 15,
    lastOrder: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    name: 'Singapore Bunker Co.',
    type: 'Bunker Supplier',
    location: 'Singapore',
    country: 'SG',
    rating: 4.5,
    reviewCount: 112,
    services: ['Bunker Supply'],
    status: 'active',
    contact: {
      name: 'Li Wei',
      email: 'liwei@sgbunker.com',
      phone: '+65 9234 5678',
    },
    totalOrders: 38,
    lastOrder: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: '5',
    name: 'Asia Pacific Fuels',
    type: 'Bunker Supplier',
    location: 'Hong Kong',
    country: 'HK',
    rating: 4.2,
    reviewCount: 45,
    services: ['Bunker Supply', 'Fresh Water'],
    status: 'inactive',
    contact: {
      name: 'David Chen',
      email: 'david@apfuels.hk',
      phone: '+852 1234 5678',
    },
    totalOrders: 12,
    lastOrder: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
  },
];

const serviceFilters = [
  { id: 'bunker', name: 'Bunker Supply' },
  { id: 'water', name: 'Fresh Water' },
  { id: 'waste', name: 'Waste Disposal' },
  { id: 'repairs', name: 'Repairs' },
  { id: 'provisions', name: 'Provisions' },
  { id: 'crew', name: 'Crew Services' },
];

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function VendorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">Manage your vendor network</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      {/* Search and filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search vendors..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Vendors grid - Mobile */}
      <div className="space-y-3 lg:hidden">
        {filteredVendors.map((vendor) => (
          <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
            <Card className="group p-4 transition-all hover:border-primary/20 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{vendor.name}</p>
                    <p className="text-sm text-muted-foreground">{vendor.type}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{vendor.location}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{vendor.rating}</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Vendors grid - Desktop */}
      <div className="hidden grid-cols-1 gap-4 md:grid-cols-2 lg:grid xl:grid-cols-3">
        {filteredVendors.map((vendor) => (
          <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
            <Card className="group h-full p-5 transition-all hover:border-primary/20 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary">{vendor.name}</h3>
                    <p className="text-sm text-muted-foreground">{vendor.type}</p>
                  </div>
                </div>
                <Badge
                  className={
                    vendor.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  }
                >
                  {vendor.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{vendor.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-foreground">{vendor.rating}</span>
                  <span>({vendor.reviewCount})</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {vendor.services.slice(0, 3).map((service) => (
                  <Badge key={service} variant="outline" className="text-xs font-normal">
                    {service}
                  </Badge>
                ))}
                {vendor.services.length > 3 && (
                  <Badge variant="outline" className="text-xs font-normal">
                    +{vendor.services.length - 3}
                  </Badge>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Orders: </span>
                  <span className="font-medium">{vendor.totalOrders}</span>
                </div>
                <div className="text-muted-foreground">
                  Last: {formatDate(vendor.lastOrder)}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {filteredVendors.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No vendors found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
