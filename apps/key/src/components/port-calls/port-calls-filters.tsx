'use client';

import { Button, Badge } from '@navo/ui';
import { Filter, X } from 'lucide-react';
import { useState } from 'react';

const statusFilters = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'planned', label: 'Planned' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'alongside', label: 'Alongside' },
  { value: 'completed', label: 'Completed' },
];

export function PortCallsFilters() {
  const [activeStatus, setActiveStatus] = useState('all');

  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <div className="flex gap-1">
        {statusFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={activeStatus === filter.value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveStatus(filter.value)}
            className="h-8"
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
