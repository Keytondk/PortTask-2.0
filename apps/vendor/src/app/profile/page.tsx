'use client';

import { useState } from 'react';
import { VendorShell } from '@/components/layout/vendor-shell';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Edit2,
  Save,
  X,
  Star,
  Award,
  Shield,
  CheckCircle2,
  Clock,
  TrendingUp,
  Package,
  Users,
  Anchor,
  Briefcase,
} from 'lucide-react';
import { clsx } from 'clsx';

// Mock data
const companyProfile = {
  id: 'vendor-1',
  name: 'Singapore Bunkers Pte Ltd',
  registrationNumber: 'SG-201512345K',
  status: 'active',
  isVerified: true,
  isCertified: true,
  address: {
    street: '1 Maritime Square',
    city: 'Singapore',
    state: '',
    postalCode: '099253',
    country: 'Singapore',
  },
  contacts: [
    { name: 'John Tan', role: 'Operations Manager', email: 'john.tan@sgbunkers.com', phone: '+65 6123 4567', isPrimary: true },
    { name: 'Sarah Lee', role: 'Sales Director', email: 'sarah.lee@sgbunkers.com', phone: '+65 6123 4568', isPrimary: false },
  ],
  bankDetails: {
    bankName: 'DBS Bank',
    accountName: 'Singapore Bunkers Pte Ltd',
    accountNumber: '****4567',
    swiftCode: 'DBSSSGSG',
  },
  serviceTypes: ['Bunkering', 'Lubricants', 'Fresh Water'],
  ports: ['Singapore', 'Johor', 'Batam'],
  metrics: {
    rating: 4.8,
    totalOrders: 234,
    onTimeDelivery: 96,
    responseTime: 2.4,
    repeatClients: 85,
  },
  description: 'Leading bunker supplier in Southeast Asia with over 15 years of experience. We provide high-quality marine fuels, lubricants, and fresh water supply services across major ports in the region.',
};

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: companyProfile.name,
    description: companyProfile.description,
    street: companyProfile.address.street,
    city: companyProfile.address.city,
    postalCode: companyProfile.address.postalCode,
    country: companyProfile.address.country,
  });

  const handleSave = () => {
    // In real implementation, this would save to API
    setIsEditing(false);
  };

  return (
    <VendorShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-amber-500 to-orange-500" />

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
              <div className="w-24 h-24 rounded-xl bg-white dark:bg-slate-700 border-4 border-white dark:border-slate-800 shadow-lg flex items-center justify-center">
                <Building2 className="w-12 h-12 text-amber-600" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {companyProfile.name}
                  </h1>
                  {companyProfile.isVerified && (
                    <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                  {companyProfile.isCertified && (
                    <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
                      <Award className="w-3 h-3" />
                      Certified
                    </span>
                  )}
                </div>
                <p className="text-slate-500 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {companyProfile.address.city}, {companyProfile.address.country}
                </p>
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
              >
                {isEditing ? (
                  <>
                    <X className="w-4 h-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {companyProfile.metrics.rating}
            </p>
            <p className="text-sm text-slate-500">Rating</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {companyProfile.metrics.totalOrders}
            </p>
            <p className="text-sm text-slate-500">Total Orders</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {companyProfile.metrics.onTimeDelivery}%
            </p>
            <p className="text-sm text-slate-500">On-Time Delivery</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {companyProfile.metrics.responseTime}h
            </p>
            <p className="text-sm text-slate-500">Avg Response</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-cyan-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {companyProfile.metrics.repeatClients}%
            </p>
            <p className="text-sm text-slate-500">Repeat Clients</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Company Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4">
                About
              </h2>
              {isEditing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              ) : (
                <p className="text-slate-600 dark:text-slate-400">
                  {companyProfile.description}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4">
                Business Address
              </h2>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-700 dark:text-slate-300">
                      {companyProfile.address.street}
                    </p>
                    <p className="text-slate-500">
                      {companyProfile.address.city}, {companyProfile.address.postalCode}
                    </p>
                    <p className="text-slate-500">{companyProfile.address.country}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Contacts */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4">
                Contact Persons
              </h2>
              <div className="space-y-4">
                {companyProfile.contacts.map((contact, index) => (
                  <div
                    key={index}
                    className={clsx(
                      'p-4 rounded-lg',
                      contact.isPrimary
                        ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800'
                        : 'bg-slate-50 dark:bg-slate-700/50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {contact.name}
                        </span>
                        {contact.isPrimary && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                            Primary
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-slate-500">{contact.role}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {contact.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {contact.phone}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Services */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-slate-400" />
                Services Offered
              </h2>
              <div className="flex flex-wrap gap-2">
                {companyProfile.serviceTypes.map((service) => (
                  <span
                    key={service}
                    className="px-3 py-1.5 text-sm font-medium bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>

            {/* Ports */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Anchor className="w-5 h-5 text-slate-400" />
                Ports Covered
              </h2>
              <div className="flex flex-wrap gap-2">
                {companyProfile.ports.map((port) => (
                  <span
                    key={port}
                    className="px-3 py-1.5 text-sm font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full"
                  >
                    {port}
                  </span>
                ))}
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-slate-400" />
                Bank Details
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank Name</span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {companyProfile.bankDetails.bankName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Name</span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {companyProfile.bankDetails.accountName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Number</span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {companyProfile.bankDetails.accountNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SWIFT Code</span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {companyProfile.bankDetails.swiftCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Registration */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-slate-400" />
                Registration
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Registration No.</span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {companyProfile.registrationNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {isEditing && (
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        )}
      </div>
    </VendorShell>
  );
}
