'use client';

import { CheckCircle2, BadgeCheck, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VendorBadges {
  isVerified: boolean;
  verifiedAt?: string | null;
  isCertified: boolean;
  certifiedAt?: string | null;
}

interface VendorBadgesDisplayProps {
  badges: VendorBadges;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: {
    icon: 'h-4 w-4',
    badge: 'px-2 py-0.5 text-xs',
    container: 'gap-1',
  },
  md: {
    icon: 'h-5 w-5',
    badge: 'px-2.5 py-1 text-sm',
    container: 'gap-2',
  },
  lg: {
    icon: 'h-6 w-6',
    badge: 'px-3 py-1.5 text-base',
    container: 'gap-3',
  },
};

export function VendorBadgesDisplay({
  badges,
  size = 'md',
  showLabels = true,
  className,
}: VendorBadgesDisplayProps) {
  const sizes = sizeClasses[size];

  return (
    <div className={cn('flex items-center', sizes.container, className)}>
      {badges.isVerified && (
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full font-medium',
            'bg-blue-50 text-blue-700 border border-blue-200',
            sizes.badge
          )}
          title={
            badges.verifiedAt
              ? `Verified on ${new Date(badges.verifiedAt).toLocaleDateString()}`
              : 'Verified vendor'
          }
        >
          <CheckCircle2 className={sizes.icon} />
          {showLabels && 'Verified'}
        </span>
      )}
      {badges.isCertified && (
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full font-medium',
            'bg-amber-50 text-amber-700 border border-amber-200',
            sizes.badge
          )}
          title={
            badges.certifiedAt
              ? `Certified on ${new Date(badges.certifiedAt).toLocaleDateString()}`
              : 'Certified vendor'
          }
        >
          <BadgeCheck className={sizes.icon} />
          {showLabels && 'Certified'}
        </span>
      )}
      {!badges.isVerified && !badges.isCertified && (
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full font-medium',
            'bg-gray-50 text-gray-500 border border-gray-200',
            sizes.badge
          )}
        >
          <Clock className={sizes.icon} />
          {showLabels && 'Pending'}
        </span>
      )}
    </div>
  );
}

interface VendorBadgeCardProps {
  type: 'verified' | 'certified';
  isActive: boolean;
  date?: string | null;
  className?: string;
}

export function VendorBadgeCard({
  type,
  isActive,
  date,
  className,
}: VendorBadgeCardProps) {
  const config = {
    verified: {
      icon: CheckCircle2,
      title: 'Verified',
      description: 'Email confirmed, company details validated',
      activeColor: 'border-blue-200 bg-blue-50',
      iconColor: 'text-blue-600 bg-blue-100',
    },
    certified: {
      icon: BadgeCheck,
      title: 'Certified',
      description: 'Documents uploaded & reviewed by Navo',
      activeColor: 'border-amber-200 bg-amber-50',
      iconColor: 'text-amber-600 bg-amber-100',
    },
  };

  const { icon: Icon, title, description, activeColor, iconColor } = config[type];

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-6 transition-all',
        isActive ? activeColor : 'border-gray-200 bg-gray-50 opacity-60',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full',
            isActive ? iconColor : 'bg-gray-200 text-gray-400'
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {isActive && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Active
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
          {isActive && date && (
            <p className="mt-2 text-xs text-gray-500">
              Since {new Date(date).toLocaleDateString()}
            </p>
          )}
          {!isActive && (
            <p className="mt-2 text-xs text-gray-500">Not yet achieved</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface VendorBadgesSectionProps {
  badges: VendorBadges;
  className?: string;
}

export function VendorBadgesSection({ badges, className }: VendorBadgesSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-gray-700" />
        <h2 className="text-lg font-semibold text-gray-900">Trust & Verification</h2>
      </div>
      <p className="text-sm text-gray-600">
        Badges help operators identify trustworthy vendors. Verified vendors are 3x more likely to win RFQs.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <VendorBadgeCard
          type="verified"
          isActive={badges.isVerified}
          date={badges.verifiedAt}
        />
        <VendorBadgeCard
          type="certified"
          isActive={badges.isCertified}
          date={badges.certifiedAt}
        />
      </div>
    </div>
  );
}
