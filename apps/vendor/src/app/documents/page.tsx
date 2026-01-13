'use client';

import { useState } from 'react';
import { VendorShell } from '@/components/layout/vendor-shell';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Award,
  Calendar,
  Search,
  Filter,
  Plus,
  Eye,
  MoreVertical,
  Building2,
  FileCheck,
} from 'lucide-react';
import { format, formatDistanceToNow, isBefore, addDays } from 'date-fns';
import { clsx } from 'clsx';

// Mock data
const certifications = [
  {
    id: '1',
    name: 'ISO 9001:2015',
    issuer: 'SGS',
    documentUrl: '/docs/iso9001.pdf',
    issuedAt: '2023-03-15',
    expiresAt: '2026-03-14',
    status: 'verified',
  },
  {
    id: '2',
    name: 'ISO 14001:2015',
    issuer: 'Bureau Veritas',
    documentUrl: '/docs/iso14001.pdf',
    issuedAt: '2023-06-20',
    expiresAt: '2026-06-19',
    status: 'verified',
  },
  {
    id: '3',
    name: 'ISPS Code Compliance',
    issuer: 'Lloyd\'s Register',
    documentUrl: '/docs/isps.pdf',
    issuedAt: '2024-01-10',
    expiresAt: '2025-01-09',
    status: 'expiring_soon',
  },
  {
    id: '4',
    name: 'MARPOL Compliance',
    issuer: 'ClassNK',
    documentUrl: '/docs/marpol.pdf',
    issuedAt: '2024-08-01',
    expiresAt: '2027-07-31',
    status: 'pending',
  },
];

const documents = [
  {
    id: '1',
    name: 'Company Registration Certificate',
    type: 'legal',
    fileName: 'company_reg.pdf',
    uploadedAt: '2023-01-15',
    size: '245 KB',
    status: 'verified',
  },
  {
    id: '2',
    name: 'Business License',
    type: 'legal',
    fileName: 'business_license.pdf',
    uploadedAt: '2023-01-15',
    size: '189 KB',
    status: 'verified',
  },
  {
    id: '3',
    name: 'Insurance Certificate',
    type: 'insurance',
    fileName: 'insurance_2024.pdf',
    uploadedAt: '2024-01-05',
    size: '512 KB',
    status: 'verified',
  },
  {
    id: '4',
    name: 'Bank Verification Letter',
    type: 'financial',
    fileName: 'bank_verification.pdf',
    uploadedAt: '2024-06-20',
    size: '128 KB',
    status: 'pending',
  },
  {
    id: '5',
    name: 'Tax Clearance Certificate',
    type: 'financial',
    fileName: 'tax_clearance.pdf',
    uploadedAt: '2024-09-01',
    size: '156 KB',
    status: 'verified',
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  verified: { label: 'Verified', color: 'text-green-600 bg-green-100 dark:bg-green-900/20', icon: CheckCircle2 },
  pending: { label: 'Pending Review', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20', icon: Clock },
  expiring_soon: { label: 'Expiring Soon', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20', icon: AlertCircle },
  expired: { label: 'Expired', color: 'text-red-600 bg-red-100 dark:bg-red-900/20', icon: AlertCircle },
  rejected: { label: 'Rejected', color: 'text-red-600 bg-red-100 dark:bg-red-900/20', icon: AlertCircle },
};

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<'certifications' | 'documents'>('certifications');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const verifiedCerts = certifications.filter((c) => c.status === 'verified').length;
  const pendingCerts = certifications.filter((c) => c.status === 'pending').length;
  const expiringCerts = certifications.filter((c) => c.status === 'expiring_soon').length;

  return (
    <VendorShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Documents & Certifications
            </h1>
            <p className="text-slate-500 mt-1">
              Manage your company documents and certification records
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Verified</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                  {verifiedCerts}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400">Pending</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                  {pendingCerts}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">
                  {expiringCerts}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('certifications')}
              className={clsx(
                'pb-3 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === 'certifications'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Certifications
              </div>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={clsx(
                'pb-3 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === 'documents'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documents
              </div>
            </button>
          </nav>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        {/* Certifications List */}
        {activeTab === 'certifications' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {certifications
                .filter((cert) =>
                  !searchQuery ||
                  cert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  cert.issuer.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((cert) => {
                  const status = statusConfig[cert.status];
                  const StatusIcon = status.icon;
                  const expiryDate = new Date(cert.expiresAt);
                  const daysUntilExpiry = Math.ceil(
                    (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={cert.id}
                      className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                        <Award className="w-6 h-6 text-amber-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                            {cert.name}
                          </h3>
                          <span
                            className={clsx(
                              'px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1',
                              status.color
                            )}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">
                          Issued by {cert.issuer}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Issued: {format(new Date(cert.issuedAt), 'MMM d, yyyy')}
                          </span>
                          <span
                            className={clsx(
                              'flex items-center gap-1',
                              daysUntilExpiry < 30 ? 'text-orange-600' : ''
                            )}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Expires: {format(expiryDate, 'MMM d, yyyy')}
                            {daysUntilExpiry < 90 && daysUntilExpiry > 0 && (
                              <span className="text-xs">({daysUntilExpiry} days)</span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                          <Eye className="w-4 h-4 text-slate-500" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                          <Download className="w-4 h-4 text-slate-500" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {certifications.length === 0 && (
              <div className="p-12 text-center">
                <Award className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No certifications yet
                </h3>
                <p className="text-slate-500 mb-4">
                  Upload your certifications to get verified
                </p>
                <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors">
                  Add Certification
                </button>
              </div>
            )}
          </div>
        )}

        {/* Documents List */}
        {activeTab === 'documents' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {documents
                .filter((doc) =>
                  !searchQuery ||
                  doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  doc.type.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((doc) => {
                  const status = statusConfig[doc.status];
                  const StatusIcon = status.icon;

                  const typeConfig: Record<string, { color: string; icon: typeof Building2 }> = {
                    legal: { color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20', icon: Building2 },
                    insurance: { color: 'text-green-600 bg-green-100 dark:bg-green-900/20', icon: Shield },
                    financial: { color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20', icon: FileCheck },
                  };
                  const docType = typeConfig[doc.type] || typeConfig.legal;
                  const TypeIcon = docType.icon;

                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div
                        className={clsx(
                          'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                          docType.color
                        )}
                      >
                        <TypeIcon className="w-6 h-6" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                            {doc.name}
                          </h3>
                          <span
                            className={clsx(
                              'px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1',
                              status.color
                            )}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>{doc.fileName}</span>
                          <span>{doc.size}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Uploaded {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                          <Eye className="w-4 h-4 text-slate-500" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                          <Download className="w-4 h-4 text-slate-500" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {documents.length === 0 && (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No documents yet
                </h3>
                <p className="text-slate-500 mb-4">
                  Upload your company documents to complete your profile
                </p>
                <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors">
                  Upload Document
                </button>
              </div>
            )}
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                Why are certifications important?
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                Having verified certifications increases your chances of winning RFQs and builds trust
                with operators. Verified vendors receive a special badge on their profile.
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Higher visibility in vendor searches
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Priority placement in RFQ invitations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Verified badge on your company profile
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </VendorShell>
  );
}
