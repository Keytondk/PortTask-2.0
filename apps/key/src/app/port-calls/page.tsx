import { Suspense } from 'react';
import { Button, Card, Input, Badge, Skeleton } from '@navo/ui';
import { Plus, Search, Download } from 'lucide-react';
import Link from 'next/link';
import { PortCallsTable } from '@/components/port-calls/port-calls-table';
import { PortCallsFilters } from '@/components/port-calls/port-calls-filters';

function TableLoading() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function PortCallsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Port Calls</h1>
          <p className="text-muted-foreground">
            Manage and monitor all port call activities
          </p>
        </div>
        <Link href="/port-calls/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Port Call
          </Button>
        </Link>
      </div>

      {/* Filters and search */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by vessel, port, or reference..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Suspense fallback={null}>
              <PortCallsFilters />
            </Suspense>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Port calls table */}
      <Card>
        <Suspense fallback={<TableLoading />}>
          <PortCallsTable />
        </Suspense>
      </Card>
    </div>
  );
}
