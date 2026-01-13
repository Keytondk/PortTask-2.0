'use client';

import { useState } from 'react';
import {
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  Trash2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

interface VendorInvitation {
  id: string;
  invitedEmail: string;
  status: InvitationStatus;
  invitedBy: string;
  message?: string;
  expiresAt: string;
  acceptedAt?: string;
  serviceTypes: string[];
  createdAt: string;
  existingVendor?: {
    id: string;
    name: string;
  };
}

interface InvitationsListProps {
  invitations: VendorInvitation[];
  onCancel?: (id: string) => Promise<void>;
  onResend?: (invitation: VendorInvitation) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    iconColor: 'text-amber-500',
  },
  accepted: {
    icon: CheckCircle2,
    label: 'Accepted',
    color: 'text-green-600 bg-green-50 border-green-200',
    iconColor: 'text-green-500',
  },
  expired: {
    icon: AlertCircle,
    label: 'Expired',
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    iconColor: 'text-gray-500',
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    color: 'text-red-600 bg-red-50 border-red-200',
    iconColor: 'text-red-500',
  },
};

interface InvitationRowProps {
  invitation: VendorInvitation;
  onCancel?: (id: string) => Promise<void>;
  onResend?: (invitation: VendorInvitation) => Promise<void>;
}

function InvitationRow({ invitation, onCancel, onResend }: InvitationRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const config = statusConfig[invitation.status];
  const StatusIcon = config.icon;

  const isExpired = new Date(invitation.expiresAt) < new Date();
  const effectiveStatus = invitation.status === 'pending' && isExpired ? 'expired' : invitation.status;
  const effectiveConfig = statusConfig[effectiveStatus];

  const handleCancel = async () => {
    if (!onCancel) return;
    setIsProcessing(true);
    try {
      await onCancel(invitation.id);
    } finally {
      setIsProcessing(false);
      setIsMenuOpen(false);
    }
  };

  const handleResend = async () => {
    if (!onResend) return;
    setIsProcessing(true);
    try {
      await onResend(invitation);
    } finally {
      setIsProcessing(false);
      setIsMenuOpen(false);
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <Mail className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{invitation.invitedEmail}</div>
            {invitation.existingVendor && (
              <div className="text-xs text-gray-500">
                {invitation.existingVendor.name}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-4">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
            effectiveConfig.color
          )}
        >
          <StatusIcon className={cn('h-3 w-3', effectiveConfig.iconColor)} />
          {effectiveConfig.label}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {invitation.serviceTypes.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {invitation.serviceTypes.slice(0, 2).map((type) => (
              <span key={type} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                {type}
              </span>
            ))}
            {invitation.serviceTypes.length > 2 && (
              <span className="text-xs text-gray-400">
                +{invitation.serviceTypes.length - 2}
              </span>
            )}
          </div>
        ) : (
          <span className="text-gray-400">All services</span>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {new Date(invitation.createdAt).toLocaleDateString()}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {invitation.status === 'accepted' && invitation.acceptedAt
          ? new Date(invitation.acceptedAt).toLocaleDateString()
          : effectiveStatus === 'expired'
          ? 'Expired'
          : new Date(invitation.expiresAt).toLocaleDateString()}
      </td>
      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right sm:pr-6">
        <div className="relative inline-block text-left">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            disabled={isProcessing}
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-1 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  {invitation.status === 'pending' && (
                    <>
                      <button
                        onClick={handleResend}
                        disabled={isProcessing}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Resend Invitation
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isProcessing}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        Cancel Invitation
                      </button>
                    </>
                  )}
                  {(effectiveStatus === 'expired' || invitation.status === 'cancelled') && (
                    <button
                      onClick={handleResend}
                      disabled={isProcessing}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Send New Invitation
                    </button>
                  )}
                  {invitation.status === 'accepted' && invitation.existingVendor && (
                    <a
                      href={`/vendors/${invitation.existingVendor.id}`}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Vendor
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export function InvitationsList({
  invitations,
  onCancel,
  onResend,
  isLoading = false,
  className,
}: InvitationsListProps) {
  if (isLoading) {
    return (
      <div className={cn('rounded-lg border bg-white', className)}>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className={cn('rounded-lg border border-dashed border-gray-300 p-12 text-center', className)}>
        <Mail className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No invitations</h3>
        <p className="mt-1 text-sm text-gray-500">
          Start by inviting vendors to join your network.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-lg border bg-white', className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-6"
            >
              Email
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              Services
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              Sent
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              Expires
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {invitations.map((invitation) => (
            <InvitationRow
              key={invitation.id}
              invitation={invitation}
              onCancel={onCancel}
              onResend={onResend}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
