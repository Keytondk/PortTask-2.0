'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Button,
  Card,
  Input,
  Badge,
} from '@navo/ui';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  MoreHorizontal,
  Ship,
  Anchor,
  Building2,
  Calendar,
  FolderOpen,
  FileCheck,
  FileWarning,
  Clock,
  Plus,
} from 'lucide-react';

// Document categories
const categories = [
  { id: 'all', label: 'All Documents', count: 156 },
  { id: 'vessel', label: 'Vessel Documents', count: 45 },
  { id: 'port_call', label: 'Port Call Documents', count: 38 },
  { id: 'service', label: 'Service Documents', count: 32 },
  { id: 'vendor', label: 'Vendor Documents', count: 25 },
  { id: 'compliance', label: 'Compliance', count: 16 },
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
    entity: { type: 'vessel', name: 'MV Pacific Star', id: '1' },
    status: 'valid',
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    uploadedBy: 'John Operator',
    uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    name: 'Safety Management Certificate',
    type: 'vessel',
    category: 'Safety',
    fileType: 'pdf',
    size: '1.8 MB',
    entity: { type: 'vessel', name: 'MV Pacific Star', id: '1' },
    status: 'expiring',
    expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    uploadedBy: 'Sarah Admin',
    uploadedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    name: 'Statement of Facts - Singapore',
    type: 'port_call',
    category: 'Operations',
    fileType: 'pdf',
    size: '856 KB',
    entity: { type: 'port_call', name: 'PC-25-0001', id: '1' },
    status: 'valid',
    uploadedBy: 'John Operator',
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    name: 'Bunker Delivery Note',
    type: 'service',
    category: 'Delivery',
    fileType: 'pdf',
    size: '1.2 MB',
    entity: { type: 'service', name: 'SVC-25-0001', id: '1' },
    status: 'valid',
    uploadedBy: 'Marine Fuel Solutions',
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: '5',
    name: 'Insurance Certificate',
    type: 'compliance',
    category: 'Insurance',
    fileType: 'pdf',
    size: '3.1 MB',
    entity: { type: 'vessel', name: 'MV Pacific Star', id: '1' },
    status: 'valid',
    expiryDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
    uploadedBy: 'Sarah Admin',
    uploadedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  },
  {
    id: '6',
    name: 'Vendor Agreement - Marine Fuel Solutions',
    type: 'vendor',
    category: 'Contracts',
    fileType: 'pdf',
    size: '4.5 MB',
    entity: { type: 'vendor', name: 'Marine Fuel Solutions', id: '1' },
    status: 'valid',
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    uploadedBy: 'Sarah Admin',
    uploadedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
  },
  {
    id: '7',
    name: 'Port Clearance Certificate',
    type: 'port_call',
    category: 'Clearance',
    fileType: 'pdf',
    size: '645 KB',
    entity: { type: 'port_call', name: 'PC-25-0002', id: '2' },
    status: 'valid',
    uploadedBy: 'Port Agent',
    uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: '8',
    name: 'International Oil Pollution Prevention Certificate',
    type: 'compliance',
    category: 'Environmental',
    fileType: 'pdf',
    size: '2.2 MB',
    entity: { type: 'vessel', name: 'MV Atlantic Voyager', id: '2' },
    status: 'expired',
    expiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    uploadedBy: 'Sarah Admin',
    uploadedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  valid: {
    label: 'Valid',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    icon: FileCheck,
  },
  expiring: {
    label: 'Expiring Soon',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    icon: Clock,
  },
  expired: {
    label: 'Expired',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    icon: FileWarning,
  },
};

const entityIcons: Record<string, any> = {
  vessel: Ship,
  port_call: Anchor,
  vendor: Building2,
  service: FileText,
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatFileSize(size: string): string {
  return size;
}

function getDaysUntilExpiry(date?: Date): number | null {
  if (!date) return null;
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function DocumentsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory = selectedCategory === 'all' || doc.type === selectedCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.entity.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const stats = {
    total: documents.length,
    expiring: documents.filter((d) => d.status === 'expiring').length,
    expired: documents.filter((d) => d.status === 'expired').length,
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Manage all documents across vessels, port calls, and vendors
          </p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Documents</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.expiring}</p>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <FileWarning className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.expired}</p>
              <p className="text-sm text-muted-foreground">Expired</p>
            </div>
          </div>
        </Card>
      </div>

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
              <p className="mb-4 text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Upload your first document to get started'}
              </p>
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </Card>
          ) : (
            filteredDocuments.map((doc) => {
              const EntityIcon = entityIcons[doc.entity.type] || FileText;
              const StatusIcon = statusConfig[doc.status]?.icon || FileCheck;
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
                        <span className="flex items-center gap-1">
                          <EntityIcon className="h-3 w-3" />
                          {doc.entity.name}
                        </span>
                        <span>{doc.category}</span>
                        <span>{doc.size}</span>
                        {doc.expiryDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Expires: {formatDate(doc.expiryDate)}
                            {daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
                              <span
                                className={`ml-1 ${
                                  daysUntilExpiry <= 0
                                    ? 'text-red-600'
                                    : 'text-yellow-600'
                                }`}
                              >
                                ({daysUntilExpiry <= 0
                                  ? 'Expired'
                                  : `${daysUntilExpiry} days left`})
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Uploaded by {doc.uploadedBy} on {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg p-6">
            <h2 className="mb-4 text-lg font-semibold">Upload Document</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Document Name *
                </label>
                <Input placeholder="Enter document name" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Category *
                  </label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select category...</option>
                    <option value="vessel">Vessel Document</option>
                    <option value="port_call">Port Call Document</option>
                    <option value="service">Service Document</option>
                    <option value="vendor">Vendor Document</option>
                    <option value="compliance">Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Expiry Date
                  </label>
                  <Input type="date" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Related Entity
                </label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select entity...</option>
                  <option value="vessel-1">MV Pacific Star (Vessel)</option>
                  <option value="vessel-2">MV Atlantic Voyager (Vessel)</option>
                  <option value="pc-1">PC-25-0001 (Port Call)</option>
                  <option value="vendor-1">Marine Fuel Solutions (Vendor)</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  File *
                </label>
                <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
                  <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop your file here, or click to browse
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PDF, DOC, DOCX, XLS, XLSX up to 25MB
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => setShowUploadModal(false)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
