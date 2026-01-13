'use client';

import { Building2, MapPin, Phone, Mail, Star, Clock, TrendingUp, MoreVertical } from 'lucide-react';
import { VendorBadgesDisplay } from './vendor-badges';
import { cn } from '@/lib/utils';

interface Vendor {
  id: string;
  name: string;
  registrationNumber?: string;
  address?: {
    city?: string;
    country?: string;
  };
  contacts?: Array<{
    name: string;
    email: string;
    phone?: string;
    isPrimary?: boolean;
  }>;
  serviceTypes: string[];
  ports: string[];
  rating: number;
  totalOrders: number;
  onTimeDelivery: number;
  responseTime: number;
  status: 'pending' | 'active' | 'suspended';
  isVerified: boolean;
  verifiedAt?: string | null;
  isCertified: boolean;
  certifiedAt?: string | null;
}

interface VendorCardProps {
  vendor: Vendor;
  onSelect?: (vendor: Vendor) => void;
  onAction?: (action: string, vendor: Vendor) => void;
  selected?: boolean;
  showActions?: boolean;
  className?: string;
}

export function VendorCard({
  vendor,
  onSelect,
  onAction,
  selected = false,
  showActions = true,
  className,
}: VendorCardProps) {
  const primaryContact = vendor.contacts?.find((c) => c.isPrimary) || vendor.contacts?.[0];
  const location = [vendor.address?.city, vendor.address?.country].filter(Boolean).join(', ');

  return (
    <div
      className={cn(
        'rounded-lg border bg-white p-4 transition-all hover:shadow-md',
        selected && 'border-blue-500 ring-1 ring-blue-500',
        onSelect && 'cursor-pointer',
        className
      )}
      onClick={() => onSelect?.(vendor)}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
            <Building2 className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{vendor.name}</h3>
            {location && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                {location}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <VendorBadgesDisplay
            badges={{
              isVerified: vendor.isVerified,
              verifiedAt: vendor.verifiedAt,
              isCertified: vendor.isCertified,
              certifiedAt: vendor.certifiedAt,
            }}
            size="sm"
            showLabels={false}
          />
          {showActions && onAction && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction('menu', vendor);
              }}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="mt-3">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            vendor.status === 'active' && 'bg-green-100 text-green-700',
            vendor.status === 'pending' && 'bg-yellow-100 text-yellow-700',
            vendor.status === 'suspended' && 'bg-red-100 text-red-700'
          )}
        >
          {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
        </span>
      </div>

      {/* Service Types */}
      {vendor.serviceTypes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {vendor.serviceTypes.slice(0, 3).map((type) => (
            <span
              key={type}
              className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
            >
              {type}
            </span>
          ))}
          {vendor.serviceTypes.length > 3 && (
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              +{vendor.serviceTypes.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Metrics */}
      <div className="mt-4 grid grid-cols-4 gap-2 border-t pt-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Star className="h-3 w-3 text-amber-500" />
            <span className="text-sm font-medium text-gray-900">
              {vendor.rating.toFixed(1)}
            </span>
          </div>
          <div className="text-xs text-gray-500">Rating</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900">{vendor.totalOrders}</div>
          <div className="text-xs text-gray-500">Orders</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-sm font-medium text-gray-900">
              {vendor.onTimeDelivery.toFixed(0)}%
            </span>
          </div>
          <div className="text-xs text-gray-500">On-time</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Clock className="h-3 w-3 text-blue-500" />
            <span className="text-sm font-medium text-gray-900">
              {vendor.responseTime.toFixed(0)}h
            </span>
          </div>
          <div className="text-xs text-gray-500">Response</div>
        </div>
      </div>

      {/* Contact */}
      {primaryContact && (
        <div className="mt-3 border-t pt-3">
          <div className="text-xs text-gray-500">Primary Contact</div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">
              {primaryContact.name}
            </span>
            <div className="flex gap-2">
              <a
                href={`mailto:${primaryContact.email}`}
                onClick={(e) => e.stopPropagation()}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Send email"
              >
                <Mail className="h-4 w-4" />
              </a>
              {primaryContact.phone && (
                <a
                  href={`tel:${primaryContact.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title="Call"
                >
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface VendorListProps {
  vendors: Vendor[];
  onSelectVendor?: (vendor: Vendor) => void;
  selectedVendorId?: string;
  onAction?: (action: string, vendor: Vendor) => void;
  layout?: 'grid' | 'list';
  className?: string;
}

export function VendorList({
  vendors,
  onSelectVendor,
  selectedVendorId,
  onAction,
  layout = 'grid',
  className,
}: VendorListProps) {
  if (vendors.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No vendors</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by inviting vendors to your network.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        layout === 'grid'
          ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
          : 'space-y-3',
        className
      )}
    >
      {vendors.map((vendor) => (
        <VendorCard
          key={vendor.id}
          vendor={vendor}
          onSelect={onSelectVendor}
          onAction={onAction}
          selected={vendor.id === selectedVendorId}
        />
      ))}
    </div>
  );
}
