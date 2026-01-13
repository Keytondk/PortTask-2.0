'use client';

import { useState } from 'react';
import { VendorShell } from '@/components/layout/vendor-shell';
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Save,
  Loader2,
  CheckCircle2,
  BadgeCheck,
  Shield,
  Clock,
  Upload,
  FileText,
  AlertCircle,
  Star,
  Package,
  TrendingUp,
} from 'lucide-react';
import { clsx } from 'clsx';

// Mock vendor data
const vendorProfile = {
  id: '1',
  companyName: 'Maritime Fuels Ltd',
  registrationNumber: 'SG2024001234',
  taxId: 'T12345678X',
  address: {
    street: '123 Marina Boulevard',
    city: 'Singapore',
    state: '',
    postalCode: '018940',
    country: 'Singapore',
  },
  contacts: [
    {
      id: '1',
      name: 'John Smith',
      role: 'Sales Manager',
      email: 'john.smith@maritimefuels.com',
      phone: '+65 9123 4567',
      isPrimary: true,
    },
    {
      id: '2',
      name: 'Sarah Wong',
      role: 'Operations Manager',
      email: 'sarah.wong@maritimefuels.com',
      phone: '+65 9234 5678',
      isPrimary: false,
    },
  ],
  serviceTypes: ['Bunkering', 'Lubricants', 'Fresh Water Supply'],
  ports: ['Singapore', 'Johor', 'Batam'],
  website: 'www.maritimefuels.com',
  description:
    'Leading maritime fuel supplier in Southeast Asia with over 20 years of experience.',
  isVerified: true,
  verifiedAt: '2024-01-10T00:00:00Z',
  isCertified: false,
  certifiedAt: null,
  rating: 4.8,
  totalOrders: 245,
  onTimeDelivery: 96.5,
  responseTime: 2.3,
};

const availableServices = [
  'Bunkering',
  'Lubricants',
  'Fresh Water Supply',
  'Provisions Supply',
  'Technical Supplies',
  'Waste Disposal',
  'Ship Chandlery',
  'Repairs & Maintenance',
];

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const [profile, setProfile] = useState(vendorProfile);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleServiceToggle = (service: string) => {
    setProfile((prev) => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(service)
        ? prev.serviceTypes.filter((s) => s !== service)
        : [...prev.serviceTypes, service],
    }));
  };

  return (
    <VendorShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Settings
            </h1>
            <p className="text-slate-500 mt-1">
              Manage your vendor profile and preferences
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
              saveSuccess
                ? 'bg-green-500 text-white'
                : 'bg-amber-500 text-white hover:bg-amber-600',
              isSaving && 'opacity-75 cursor-not-allowed'
            )}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex gap-6">
            {[
              { id: 'profile', label: 'Company Profile' },
              { id: 'badges', label: 'Trust & Badges' },
              { id: 'services', label: 'Services & Ports' },
              { id: 'performance', label: 'Performance' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'pb-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Company Information */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Company Information
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Company Name
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={profile.companyName}
                          onChange={(e) =>
                            setProfile({ ...profile, companyName: e.target.value })
                          }
                          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Registration Number
                      </label>
                      <input
                        type="text"
                        value={profile.registrationNumber}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            registrationNumber: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Tax ID
                      </label>
                      <input
                        type="text"
                        value={profile.taxId}
                        onChange={(e) =>
                          setProfile({ ...profile, taxId: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Website
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={profile.website}
                          onChange={(e) =>
                            setProfile({ ...profile, website: e.target.value })
                          }
                          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Company Description
                    </label>
                    <textarea
                      value={profile.description}
                      onChange={(e) =>
                        setProfile({ ...profile, description: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Business Address
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Street Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={profile.address.street}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            address: { ...profile.address, street: e.target.value },
                          })
                        }
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={profile.address.city}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            address: { ...profile.address, city: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={profile.address.postalCode}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            address: {
                              ...profile.address,
                              postalCode: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value={profile.address.country}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            address: { ...profile.address, country: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Contact Persons
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {profile.contacts.map((contact, index) => (
                    <div
                      key={contact.id}
                      className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-900 dark:text-white">
                            Contact {index + 1}
                          </span>
                          {contact.isPrimary && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            value={contact.name}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">
                            Role
                          </label>
                          <input
                            type="text"
                            value={contact.role}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">
                            Email
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                            <input
                              type="email"
                              value={contact.email}
                              className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">
                            Phone
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                            <input
                              type="tel"
                              value={contact.phone}
                              className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                  Account Status
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Status</span>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      Member Since
                    </span>
                    <span className="text-slate-900 dark:text-white">Jan 2024</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      Service Areas
                    </span>
                    <span className="text-slate-900 dark:text-white">
                      {profile.ports.length} Ports
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Verified Badge */}
            <div
              className={clsx(
                'rounded-xl border-2 p-6',
                profile.isVerified
                  ? 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                  : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={clsx(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    profile.isVerified
                      ? 'bg-blue-100 dark:bg-blue-900/50'
                      : 'bg-slate-200 dark:bg-slate-700'
                  )}
                >
                  <CheckCircle2
                    className={clsx(
                      'w-6 h-6',
                      profile.isVerified
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400'
                    )}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Verified Vendor
                    </h3>
                    {profile.isVerified && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Email confirmed and company details validated by Navo team.
                  </p>
                  {profile.isVerified && profile.verifiedAt && (
                    <p className="text-xs text-slate-500 mt-2">
                      Verified since{' '}
                      {new Date(profile.verifiedAt).toLocaleDateString()}
                    </p>
                  )}
                  {!profile.isVerified && (
                    <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">
                      Complete Verification
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Certified Badge */}
            <div
              className={clsx(
                'rounded-xl border-2 p-6',
                profile.isCertified
                  ? 'border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20'
                  : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={clsx(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    profile.isCertified
                      ? 'bg-amber-100 dark:bg-amber-900/50'
                      : 'bg-slate-200 dark:bg-slate-700'
                  )}
                >
                  <BadgeCheck
                    className={clsx(
                      'w-6 h-6',
                      profile.isCertified
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-400'
                    )}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Certified Vendor
                    </h3>
                    {profile.isCertified && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Documents uploaded and reviewed by Navo compliance team.
                  </p>
                  {!profile.isCertified && (
                    <div className="mt-4">
                      <p className="text-xs text-slate-500 mb-2">
                        Upload required documents to get certified:
                      </p>
                      <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 mb-4">
                        <li className="flex items-center gap-2">
                          <Clock className="w-3 h-3" /> Business License
                        </li>
                        <li className="flex items-center gap-2">
                          <Clock className="w-3 h-3" /> Insurance Certificate
                        </li>
                        <li className="flex items-center gap-2">
                          <Clock className="w-3 h-3" /> ISO Certification (if any)
                        </li>
                      </ul>
                      <button className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Documents
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Benefits Info */}
            <div className="lg:col-span-2 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-slate-600 dark:text-slate-400" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Why Get Verified & Certified?
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Verified and certified vendors are 3x more likely to win RFQs and
                    build lasting client relationships.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-start gap-2">
                      <Star className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          Priority Visibility
                        </p>
                        <p className="text-xs text-slate-500">
                          Appear first in vendor searches
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          Trust Badge
                        </p>
                        <p className="text-xs text-slate-500">
                          Show credibility to clients
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          More RFQ Invites
                        </p>
                        <p className="text-xs text-slate-500">
                          Receive more quote requests
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Service Types */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Service Types
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Select the services you provide
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  {availableServices.map((service) => {
                    const isSelected = profile.serviceTypes.includes(service);
                    return (
                      <button
                        key={service}
                        onClick={() => handleServiceToggle(service)}
                        className={clsx(
                          'p-3 rounded-lg border text-left text-sm font-medium transition-all',
                          isSelected
                            ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                          {service}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Ports */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Service Ports
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Ports where you can provide services
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  {profile.ports.map((port) => (
                    <div
                      key={port}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-900 dark:text-white">
                          {port}
                        </span>
                      </div>
                      <button className="text-sm text-red-500 hover:text-red-600">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 hover:border-amber-500 hover:text-amber-600">
                  <MapPin className="w-4 h-4" />
                  Add Port
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Star className="w-4 h-4" />
                  <span className="text-sm">Rating</span>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {profile.rating}
                </p>
                <p className="text-sm text-green-600 mt-1">Top 10% of vendors</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Package className="w-4 h-4" />
                  <span className="text-sm">Total Orders</span>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {profile.totalOrders}
                </p>
                <p className="text-sm text-slate-500 mt-1">Lifetime</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">On-Time Delivery</span>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {profile.onTimeDelivery}%
                </p>
                <p className="text-sm text-slate-500 mt-1">Last 90 days</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Avg Response Time</span>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {profile.responseTime}h
                </p>
                <p className="text-sm text-slate-500 mt-1">To RFQs</p>
              </div>
            </div>

            {/* Performance Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700 p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300">
                    Performance Tips
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-400">
                    <li>
                      • Respond to RFQs within 2 hours to improve your response time
                      metric
                    </li>
                    <li>
                      • Maintain 95%+ on-time delivery to unlock premium badges
                    </li>
                    <li>
                      • Complete your certification to appear higher in search results
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </VendorShell>
  );
}
