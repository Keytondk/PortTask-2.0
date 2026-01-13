'use client';

import { Card, Button } from '@navo/ui';
import { LucideIcon, Plus } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
        {action && (
          <div className="mt-6">
            {action.href ? (
              <Link href={action.href}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {action.label}
                </Button>
              </Link>
            ) : (
              <Button onClick={action.onClick}>
                <Plus className="mr-2 h-4 w-4" />
                {action.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

interface SearchEmptyStateProps {
  icon: LucideIcon;
  title?: string;
  description?: string;
  onClear?: () => void;
}

export function SearchEmptyState({
  icon: Icon,
  title = 'No results found',
  description = 'Try adjusting your search or filter criteria',
  onClear,
}: SearchEmptyStateProps) {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {onClear && (
          <Button variant="outline" className="mt-4" onClick={onClear}>
            Clear filters
          </Button>
        )}
      </div>
    </Card>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an error while loading this page. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="border-destructive/50 p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <svg
            className="h-8 w-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {onRetry && (
          <Button className="mt-6" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    </Card>
  );
}
