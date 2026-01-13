'use client';

import { useState } from 'react';
import { PortalShell } from '@/components/layout/portal-shell';
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Ship,
  MapPin,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

// Mock data
const pendingApprovals = [
  {
    id: '1',
    type: 'service_order',
    title: 'Bunkering Service',
    description: '500 MT VLSFO for MV Pacific Star at Singapore',
    vessel: 'MV Pacific Star',
    port: 'Singapore',
    cost: 125000,
    currency: 'USD',
    vendor: 'Marine Fuel Co.',
    requestedBy: 'John Smith',
    requestedAt: '2024-01-14T10:30:00Z',
    urgency: 'high',
  },
  {
    id: '2',
    type: 'service_order',
    title: 'Provisions Supply',
    description: 'Fresh provisions for 25 crew members',
    vessel: 'MV Atlantic Voyager',
    port: 'Rotterdam',
    cost: 3500,
    currency: 'EUR',
    vendor: 'Ship Supplies Ltd.',
    requestedBy: 'Sarah Johnson',
    requestedAt: '2024-01-14T14:20:00Z',
    urgency: 'medium',
  },
  {
    id: '3',
    type: 'quote_acceptance',
    title: 'Repair Service Quote',
    description: 'Hull cleaning and inspection at dry dock',
    vessel: 'MV Nordic Wind',
    port: 'Hamburg',
    cost: 45000,
    currency: 'EUR',
    vendor: 'Maritime Repairs GmbH',
    requestedBy: 'Mike Chen',
    requestedAt: '2024-01-13T09:15:00Z',
    urgency: 'low',
  },
];

const recentDecisions = [
  {
    id: '4',
    title: 'Crew Change Service',
    status: 'approved',
    cost: 2800,
    currency: 'USD',
    decidedAt: '2024-01-14T08:00:00Z',
    decidedBy: 'You',
  },
  {
    id: '5',
    title: 'Emergency Repairs',
    status: 'approved',
    cost: 15000,
    currency: 'USD',
    decidedAt: '2024-01-13T16:30:00Z',
    decidedBy: 'You',
  },
  {
    id: '6',
    title: 'Agency Fees Override',
    status: 'rejected',
    cost: 5000,
    currency: 'USD',
    decidedAt: '2024-01-12T11:45:00Z',
    decidedBy: 'You',
  },
];

const urgencyColors = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
};

export default function ApprovalsPage() {
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const handleApprove = (id: string) => {
    console.log('Approving:', id);
    // Would send to API
  };

  const handleReject = (id: string) => {
    console.log('Rejecting:', id);
    // Would send to API
  };

  return (
    <PortalShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Approvals</h1>
        <p className="text-slate-600 mt-1">Review and approve pending requests</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Pending</div>
              <div className="text-3xl font-bold text-slate-900 mt-1">
                {pendingApprovals.length}
              </div>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Total Value</div>
              <div className="text-3xl font-bold text-slate-900 mt-1">
                ${(pendingApprovals.reduce((sum, a) => sum + a.cost, 0) / 1000).toFixed(0)}K
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">High Priority</div>
              <div className="text-3xl font-bold text-slate-900 mt-1">
                {pendingApprovals.filter((a) => a.urgency === 'high').length}
              </div>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">Pending Approvals</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                    selectedApproval === approval.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedApproval(approval.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900">{approval.title}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            urgencyColors[approval.urgency as keyof typeof urgencyColors]
                          }`}
                        >
                          {approval.urgency}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{approval.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Ship className="w-3 h-3" />
                          {approval.vessel}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {approval.port}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-semibold text-slate-900">
                        {formatCurrency(approval.cost, approval.currency)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {formatDate(approval.requestedAt)}
                      </div>
                    </div>
                  </div>

                  {selectedApproval === approval.id && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="grid sm:grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-slate-500">Vendor:</span>{' '}
                          <span className="text-slate-900">{approval.vendor}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Requested by:</span>{' '}
                          <span className="text-slate-900">{approval.requestedBy}</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(approval.id);
                          }}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(approval.id);
                          }}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {pendingApprovals.length === 0 && (
                <div className="p-8 text-center">
                  <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-slate-500 mt-2">No pending approvals</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Decisions */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">Recent Decisions</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {recentDecisions.map((decision) => (
                <div key={decision.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          decision.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                        }`}
                      >
                        {decision.status === 'approved' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 text-sm">
                          {decision.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatCurrency(decision.cost, decision.currency)}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
