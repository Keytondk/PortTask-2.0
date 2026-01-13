'use client';

import { Button, Card, Input } from '@navo/ui';
import {
  ArrowLeft,
  Ship,
  Anchor,
  Ruler,
  Box,
  Save,
  Trash2,
  AlertTriangle,
  Building2,
  Flag,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const vesselTypes = [
  'Container',
  'Bulk Carrier',
  'Tanker',
  'LNG Carrier',
  'LPG Carrier',
  'General Cargo',
  'Ro-Ro',
  'Passenger',
  'Offshore',
  'Other',
];

const flags = [
  { code: 'SG', name: 'Singapore' },
  { code: 'PA', name: 'Panama' },
  { code: 'LR', name: 'Liberia' },
  { code: 'MH', name: 'Marshall Islands' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'MT', name: 'Malta' },
  { code: 'BS', name: 'Bahamas' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'NO', name: 'Norway' },
];

const classificationSocieties = [
  'DNV GL',
  'Lloyd\'s Register',
  'Bureau Veritas',
  'American Bureau of Shipping',
  'ClassNK',
  'Korean Register',
  'China Classification Society',
  'RINA',
];

// Mock existing vessel data - will be replaced with API call
const getVessel = (id: string) => ({
  id,
  name: 'MV Pacific Star',
  imo: '9876543',
  mmsi: '565123456',
  callSign: 'V7PS9',
  type: 'Container',
  flag: 'SG',
  class: 'DNV GL',
  dwt: 65000,
  grt: 52000,
  nrt: 24000,
  loa: 294.1,
  beam: 32.2,
  draft: 12.5,
  yearBuilt: 2018,
  builder: 'Samsung Heavy Industries',
  owner: 'Pacific Shipping Co.',
  operator: 'Pacific Shipping Co.',
  manager: 'Pacific Shipping Management',
  crew: 25,
});

export default function EditVesselPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    imo: '',
    mmsi: '',
    callSign: '',
    type: '',
    flag: '',
    class: '',
    dwt: '',
    grt: '',
    nrt: '',
    loa: '',
    beam: '',
    draft: '',
    yearBuilt: '',
    builder: '',
    owner: '',
    operator: '',
    manager: '',
    crew: '',
  });

  useEffect(() => {
    const vessel = getVessel(params.id);
    setFormData({
      name: vessel.name,
      imo: vessel.imo,
      mmsi: vessel.mmsi,
      callSign: vessel.callSign,
      type: vessel.type,
      flag: vessel.flag,
      class: vessel.class,
      dwt: vessel.dwt.toString(),
      grt: vessel.grt.toString(),
      nrt: vessel.nrt.toString(),
      loa: vessel.loa.toString(),
      beam: vessel.beam.toString(),
      draft: vessel.draft.toString(),
      yearBuilt: vessel.yearBuilt.toString(),
      builder: vessel.builder,
      owner: vessel.owner,
      operator: vessel.operator,
      manager: vessel.manager,
      crew: vessel.crew.toString(),
    });
  }, [params.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push(`/vessels/${params.id}`);
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push('/vessels');
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/vessels/${params.id}`}
          className="rounded-lg p-2 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Vessel</h1>
          <p className="text-muted-foreground">Update vessel information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Information */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Ship className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Basic Information</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">
                    Vessel Name *
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., MV Pacific Star"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    IMO Number *
                  </label>
                  <Input
                    name="imo"
                    value={formData.imo}
                    onChange={handleChange}
                    required
                    placeholder="7 digits"
                    maxLength={7}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    MMSI Number
                  </label>
                  <Input
                    name="mmsi"
                    value={formData.mmsi}
                    onChange={handleChange}
                    placeholder="9 digits"
                    maxLength={9}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Call Sign
                  </label>
                  <Input
                    name="callSign"
                    value={formData.callSign}
                    onChange={handleChange}
                    placeholder="e.g., V7PS9"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Vessel Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select type...</option>
                    {vesselTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Registration */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Flag className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Registration</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Flag State *
                  </label>
                  <select
                    name="flag"
                    value={formData.flag}
                    onChange={handleChange}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select flag...</option>
                    {flags.map((flag) => (
                      <option key={flag.code} value={flag.code}>
                        {flag.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Classification Society
                  </label>
                  <select
                    name="class"
                    value={formData.class}
                    onChange={handleChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select class...</option>
                    {classificationSocieties.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Year Built
                  </label>
                  <Input
                    type="number"
                    name="yearBuilt"
                    value={formData.yearBuilt}
                    onChange={handleChange}
                    placeholder="e.g., 2018"
                    min={1900}
                    max={new Date().getFullYear()}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Builder
                  </label>
                  <Input
                    name="builder"
                    value={formData.builder}
                    onChange={handleChange}
                    placeholder="Shipyard name"
                  />
                </div>
              </div>
            </Card>

            {/* Dimensions */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Ruler className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Dimensions & Tonnage</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    DWT (tonnes)
                  </label>
                  <Input
                    type="number"
                    name="dwt"
                    value={formData.dwt}
                    onChange={handleChange}
                    placeholder="Deadweight tonnage"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    GRT (tonnes)
                  </label>
                  <Input
                    type="number"
                    name="grt"
                    value={formData.grt}
                    onChange={handleChange}
                    placeholder="Gross tonnage"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    NRT (tonnes)
                  </label>
                  <Input
                    type="number"
                    name="nrt"
                    value={formData.nrt}
                    onChange={handleChange}
                    placeholder="Net tonnage"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    LOA (meters)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    name="loa"
                    value={formData.loa}
                    onChange={handleChange}
                    placeholder="Length overall"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Beam (meters)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    name="beam"
                    value={formData.beam}
                    onChange={handleChange}
                    placeholder="Width"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Draft (meters)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    name="draft"
                    value={formData.draft}
                    onChange={handleChange}
                    placeholder="Maximum draft"
                  />
                </div>
              </div>
            </Card>

            {/* Ownership */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Ownership & Management</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Owner
                  </label>
                  <Input
                    name="owner"
                    value={formData.owner}
                    onChange={handleChange}
                    placeholder="Registered owner"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Operator
                  </label>
                  <Input
                    name="operator"
                    value={formData.operator}
                    onChange={handleChange}
                    placeholder="Ship operator"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Technical Manager
                  </label>
                  <Input
                    name="manager"
                    value={formData.manager}
                    onChange={handleChange}
                    placeholder="Ship manager"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    <Users className="mr-1 inline h-4 w-4" />
                    Crew Capacity
                  </label>
                  <Input
                    type="number"
                    name="crew"
                    value={formData.crew}
                    onChange={handleChange}
                    placeholder="Number of crew"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Actions</h2>
              <div className="space-y-3">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/20">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </h2>
              {!showDeleteConfirm ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Vessel
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Are you sure? This will remove the vessel from your fleet. Port
                    call history will be preserved.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
