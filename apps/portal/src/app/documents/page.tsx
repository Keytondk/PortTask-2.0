'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  Input,
  Badge,
} from '@navo/ui';
import {
  FileText,
  Download,
  Search,
  Filter,
  Eye,
  Ship,
  Anchor,
  Calendar,
  FolderOpen,
  FileCheck,
  FileWarning,
  Clock,
} from 'lucide-react';

// Document categories for customer portal
const categories = [
  { id: 'all', label: 'All Documents', count: 48 },
  { id: 'vessel', label: 'Vessel Certificates', count: 22 },
  { id: 'port_call', label: 'Port Call Documents', count: 18 },
  { id: 'invoices', label: 'Invoices & Receipts', count: 8 },
];

// Mock documents data
const documents = [
  {
    id: '1',
    name: 'Certificate of Registry - MV Pacific Star',
    type: 'vessel',
    category: 'Registration',
    fileType: 'pdf',
    size: '2.4 MB',
    vessel: 'MV Pacific Star',
    status: 'valid',
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    name: 'Safety Management Certificate',
    type: 'vessel',
    category: 'Safety',
    fileType: 'pdf',
    size: '1.8 MB',
    vessel: 'MV Pacific Star',
    status: 'expiring',
    expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    uploadedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    name: 'Statement of Facts - Singapore',
    type: 'port_call',
    category: 'Operations',
    fileType: 'pdf',
    size: '856 KB',
    portCall: 'PC-25-0001',
    status: 'valid',
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    name: 'Bunker Delivery Note',
    type: 'port_call',
    category: 'Delivery',
    fileType: 'pdf',
    size: '1.2 MB',
    portCall: 'PC-25-0001',
    status: 'valid',
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: '5',
    name: 'Insurance Certificate',
    type: 'vessel',
    category: 'Insurance',
    fileType: 'pdf',
    size: '3.1 MB',
    vessel: 'MV Pacific Star',
    status: 'valid',
    expiryDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
    uploadedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  },
  {
    id: '6',
    name: 'Invoice - Bunker Supply Singapore',
    type: 'invoices',
    category: 'Invoice',
    fileType: 'pdf',
    size: '245 KB',
    portCall: 'PC-25-0001',
    status: 'valid',
    uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '7',
    name: 'Port Clearance Certificate',
    type: 'port_call',
    category: 'Clearance',
    fileType: 'pdf',
    size: '645 KB',
    portCall: 'PC-25-0002',
    status: 'valid',
    uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: '8',
    name: 'IOPP Certificate',
    type: 'vessel',
    category: 'Environmental',
    fileType: 'pdf',
    size: '2.2 MB',
    vessel: 'MV Atlantic Voyager',
    status: 'expired',
    expiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    uploadedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  valid: {
    label: 'Valid',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  },
  expiring: {
    label: 'Expiring Soon',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  },
  expired: {
    label: 'Expired',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  },
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDaysUntilExpiry(date?: Date): number | null {
  if (!date) return null;
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function DocumentsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory = selectedCategory === 'all' || doc.type === selectedCategory;
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Alert counts
  const expiringCount = documents.filter((d) => d.status === 'expiring').length;
  const expiredCount = documents.filter((d) => d.status === 'expired').length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Access vessel certificates, port call documents, and invoices
        </p>
      </div>

      {/* Alerts */}
      {(expiringCount > 0 || expiredCount > 0) && (
        <div className="flex flex-wrap gap-4">
          {expiredCount > 0 && (
            <Card className="flex items-center gap-3 border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
              <FileWarning className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">
                  {expiredCount} document{expiredCount > 1 ? 's' : ''} expired
                </p>
                <p className="text-sm text-red-600 dark:text-red-500">
                  Immediate action required
                </p>
              </div>
            </Card>
          )}
          {expiringCount > 0 && (
            <Card className="flex items-center gap-3 border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/20">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="font-medium text-yellow-700 dark:text-yellow-400">
                  {expiringCount} document{expiringCount > 1 ? 's' : ''} expiring soon
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                  Review and renew within 30 days
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Search and filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar categories */}
        <div className="space-y-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <span>{category.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  selectedCategory === category.id
                    ? 'bg-primary-foreground/20'
                    : 'bg-muted-foreground/20'
                }`}
              >
                {category.count}
              </span>
            </button>
          ))}
        </div>

        {/* Documents list */}
        <div className="space-y-3 lg:col-span-3">
          {filteredDocuments.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12">
              <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No documents found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </Card>
          ) : (
            filteredDocuments.map((doc) => {
              const daysUntilExpiry = getDaysUntilExpiry(doc.expiryDate);

              return (
                <Card
                  key={doc.id}
                  className="group flex items-center justify-between p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{doc.name}</h3>
                        <Badge className={statusConfig[doc.status]?.color}>
                          {statusConfig[doc.status]?.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {doc.vessel && (
                          <span className="flex items-center gap-1">
                            <Ship className="h-3 w-3" />
                            {doc.vessel}
                          </span>
                        )}
                        {doc.portCall && (
                          <span className="flex items-center gap-1">
                            <Anchor className="h-3 w-3" />
                            {doc.portCall}
                          </span>
                        )}
                        <span>{doc.category}</span>
                        <span>{doc.size}</span>
                        {doc.expiryDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Expires: {formatDate(doc.expiryDate)}
                            {daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
                              <span
                                className={`ml-1 font-medium ${
                                  daysUntilExpiry <= 0
                                    ? 'text-red-600'
                                    : 'text-yellow-600'
                                }`}
                              >
                                ({daysUntilExpiry <= 0
                                  ? 'Expired'
                                  : `${daysUntilExpiry} days`})
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
