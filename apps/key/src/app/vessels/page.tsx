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
  Ship,
  MapPin,
  Anchor,
  Filter,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';

// Mock data
const vessels = [
  {
    id: '1',
    name: 'MV Pacific Star',
    imo: '9876543',
    type: 'Container',
    flag: 'Singapore',
    flagCode: 'SG',
    dwt: 65000,
    status: 'at_sea',
    currentLocation: 'South China Sea',
    destination: 'Singapore',
    eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    owner: 'Pacific Shipping Co.',
  },
  {
    id: '2',
    name: 'MV Atlantic Voyager',
    imo: '9765432',
    type: 'Bulk Carrier',
    flag: 'Panama',
    flagCode: 'PA',
    dwt: 82000,
    status: 'in_port',
    currentLocation: 'Rotterdam',
    destination: null,
    eta: null,
    owner: 'Atlantic Maritime Ltd.',
  },
  {
    id: '3',
    name: 'MT Gulf Trader',
    imo: '9654321',
    type: 'Tanker',
    flag: 'Marshall Islands',
    flagCode: 'MH',
    dwt: 105000,
    status: 'at_sea',
    currentLocation: 'Arabian Gulf',
    destination: 'Dubai (Jebel Ali)',
    eta: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    owner: 'Gulf Energy Transport',
  },
  {
    id: '4',
    name: 'MV Northern Spirit',
    imo: '9543210',
    type: 'Container',
    flag: 'Hong Kong',
    flagCode: 'HK',
    dwt: 71000,
    status: 'at_anchor',
    currentLocation: 'Shanghai Anchorage',
    destination: 'Shanghai',
    eta: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    owner: 'Northern Lines Asia',
  },
  {
    id: '5',
    name: 'MV Southern Cross',
    imo: '9432109',
    type: 'General Cargo',
    flag: 'Liberia',
    flagCode: 'LR',
    dwt: 28000,
    status: 'in_port',
    currentLocation: 'Houston',
    destination: null,
    eta: null,
    owner: 'Southern Shipping Inc.',
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  at_sea: {
    label: 'At Sea',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  },
  in_port: {
    label: 'In Port',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  },
  at_anchor: {
    label: 'At Anchor',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  },
  under_repair: {
    label: 'Under Repair',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  },
  laid_up: {
    label: 'Laid Up',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
};

function formatDate(date: Date | null): string {
  if (!date) return '-';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VesselsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredVessels = vessels.filter((vessel) => {
    const matchesSearch =
      vessel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vessel.imo.includes(searchQuery);
    const matchesType = typeFilter === 'all' || vessel.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || vessel.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vessels</h1>
          <p className="text-muted-foreground">Manage your fleet of vessels</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Vessel
        </Button>
      </div>

      {/* Filters and search */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or IMO..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Container">Container</SelectItem>
                <SelectItem value="Bulk Carrier">Bulk Carrier</SelectItem>
                <SelectItem value="Tanker">Tanker</SelectItem>
                <SelectItem value="General Cargo">General Cargo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="at_sea">At Sea</SelectItem>
                <SelectItem value="in_port">In Port</SelectItem>
                <SelectItem value="at_anchor">At Anchor</SelectItem>
                <SelectItem value="under_repair">Under Repair</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Vessels list - Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {filteredVessels.map((vessel) => (
          <Link key={vessel.id} href={`/vessels/${vessel.id}`}>
            <Card className="group p-4 transition-all hover:border-primary/20 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Ship className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{vessel.name}</p>
                    <p className="text-sm text-muted-foreground">
                      IMO {vessel.imo} · {vessel.type}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{vessel.currentLocation}</span>
                </div>
                <Badge className={statusConfig[vessel.status]?.color}>
                  {statusConfig[vessel.status]?.label}
                </Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Vessels list - Desktop table */}
      <Card className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="p-4 font-medium">Vessel</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Flag</th>
                <th className="p-4 font-medium">DWT</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium">Destination</th>
                <th className="p-4 font-medium">ETA</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredVessels.map((vessel) => (
                <tr key={vessel.id} className="group transition-colors hover:bg-muted/50">
                  <td className="p-4">
                    <Link href={`/vessels/${vessel.id}`} className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Ship className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold group-hover:text-primary">{vessel.name}</p>
                        <p className="text-sm text-muted-foreground">IMO {vessel.imo}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="p-4 text-sm">{vessel.type}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-xs">{vessel.flagCode}</span>
                      <span>{vessel.flag}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm">{vessel.dwt.toLocaleString()} MT</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{vessel.currentLocation}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm">{vessel.destination || '-'}</td>
                  <td className="p-4 text-sm">{formatDate(vessel.eta)}</td>
                  <td className="p-4">
                    <Badge className={statusConfig[vessel.status]?.color}>
                      {statusConfig[vessel.status]?.label}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Empty state */}
      {filteredVessels.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Ship className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No vessels found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
