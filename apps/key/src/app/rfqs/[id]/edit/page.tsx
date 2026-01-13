'use client';

import { Button, Card, Input } from '@navo/ui';
import {
  ArrowLeft,
  FileText,
  Ship,
  Save,
  Trash2,
  AlertTriangle,
  Building2,
  Calendar,
  Users,
  Plus,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const serviceTypes = [
  { value: 'bunker', label: 'Bunker Supply' },
  { value: 'provisions', label: 'Provisions' },
  { value: 'repairs', label: 'Repairs & Maintenance' },
  { value: 'crew_change', label: 'Crew Change' },
  { value: 'waste_disposal', label: 'Waste Disposal' },
  { value: 'fresh_water', label: 'Fresh Water' },
  { value: 'lube_oil', label: 'Lube Oil' },
  { value: 'spare_parts', label: 'Spare Parts' },
  { value: 'survey', label: 'Survey & Inspection' },
  { value: 'other', label: 'Other Services' },
];

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'quotes_received', label: 'Quotes Received' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'closed', label: 'Closed' },
];

// Mock vendors for selection
const availableVendors = [
  { id: '1', name: 'Marine Fuel Solutions' },
  { id: '2', name: 'Singapore Bunker Co.' },
  { id: '3', name: 'Asia Pacific Fuels' },
  { id: '4', name: 'Global Marine Supplies' },
  { id: '5', name: 'Eastern Bunker Services' },
  { id: '6', name: 'Pacific Ship Services' },
  { id: '7', name: 'Maritime Logistics Ltd' },
];

// Mock port calls for selection
const portCalls = [
  { id: '1', reference: 'PC-25-0001', vessel: 'MV Pacific Star', port: 'Singapore' },
  { id: '2', reference: 'PC-25-0002', vessel: 'MV Atlantic Voyager', port: 'Rotterdam' },
  { id: '3', reference: 'PC-25-0003', vessel: 'MV Global Pioneer', port: 'Houston' },
];

// Mock existing RFQ data
const getRFQ = (id: string) => ({
  id,
  reference: 'RFQ-25-0001',
  title: 'Bunker Supply - Singapore',
  description: 'Request for bunker fuel supply at Singapore anchorage',
  serviceType: 'bunker',
  portCallId: '1',
  status: 'quotes_received',
  quantity: '500',
  unit: 'MT',
  specifications: 'VLSFO 0.5% Sulfur, ISO 8217:2017',
  deadline: '2025-01-14T17:00',
  deliveryDate: '2025-01-15',
  deliveryLocation: 'Western Anchorage',
  notes: 'Delivery via barge preferred. Vessel will provide 24hr notice before arrival.',
  invitedVendorIds: ['1', '2', '3', '4', '5'],
});

export default function EditRFQPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    serviceType: '',
    portCallId: '',
    status: '',
    quantity: '',
    unit: '',
    specifications: '',
    deadline: '',
    deliveryDate: '',
    deliveryLocation: '',
    notes: '',
  });
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

  useEffect(() => {
    const rfq = getRFQ(params.id);
    setFormData({
      title: rfq.title,
      description: rfq.description,
      serviceType: rfq.serviceType,
      portCallId: rfq.portCallId,
      status: rfq.status,
      quantity: rfq.quantity,
      unit: rfq.unit,
      specifications: rfq.specifications,
      deadline: rfq.deadline,
      deliveryDate: rfq.deliveryDate,
      deliveryLocation: rfq.deliveryLocation,
      notes: rfq.notes,
    });
    setSelectedVendors(rfq.invitedVendorIds);
  }, [params.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddVendor = (vendorId: string) => {
    if (!selectedVendors.includes(vendorId)) {
      setSelectedVendors((prev) => [...prev, vendorId]);
    }
  };

  const handleRemoveVendor = (vendorId: string) => {
    setSelectedVendors((prev) => prev.filter((id) => id !== vendorId));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push(`/rfqs/${params.id}`);
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push('/rfqs');
  };

  const selectedPortCall = portCalls.find((pc) => pc.id === formData.portCallId);
  const unselectedVendors = availableVendors.filter(
    (v) => !selectedVendors.includes(v.id)
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/rfqs/${params.id}`}
          className="rounded-lg p-2 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit RFQ</h1>
          <p className="text-muted-foreground">Update request for quotation details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Information */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Basic Information</h2>
              </div>
              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Title *
                  </label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Bunker Supply - Singapore"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Brief description of the RFQ..."
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Service Type *
                    </label>
                    <select
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={handleChange}
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select type...</option>
                      {serviceTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Status *
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {statusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Port Call *
                  </label>
                  <select
                    name="portCallId"
                    value={formData.portCallId}
                    onChange={handleChange}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select port call...</option>
                    {portCalls.map((pc) => (
                      <option key={pc.id} value={pc.id}>
                        {pc.reference} - {pc.vessel} @ {pc.port}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Requirements */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Ship className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Requirements</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Quantity *
                  </label>
                  <Input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Unit *
                  </label>
                  <Input
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                    placeholder="e.g., MT, CBM, Units"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Delivery Location
                  </label>
                  <Input
                    name="deliveryLocation"
                    value={formData.deliveryLocation}
                    onChange={handleChange}
                    placeholder="e.g., Western Anchorage"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="mb-2 block text-sm font-medium">
                    Specifications
                  </label>
                  <textarea
                    name="specifications"
                    value={formData.specifications}
                    onChange={handleChange}
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Enter detailed specifications..."
                  />
                </div>
              </div>
            </Card>

            {/* Schedule */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Schedule</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Quote Deadline *
                  </label>
                  <Input
                    type="datetime-local"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Vendors must submit quotes by this date
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Required Delivery Date
                  </label>
                  <Input
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </Card>

            {/* Invited Vendors */}
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Invited Vendors</h2>
                </div>
                <span className="text-sm text-muted-foreground">
                  {selectedVendors.length} vendors selected
                </span>
              </div>

              {/* Selected vendors */}
              <div className="mb-4 space-y-2">
                {selectedVendors.map((vendorId) => {
                  const vendor = availableVendors.find((v) => v.id === vendorId);
                  if (!vendor) return null;
                  return (
                    <div
                      key={vendor.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{vendor.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveVendor(vendor.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Add vendor dropdown */}
              {unselectedVendors.length > 0 && (
                <div className="flex gap-2">
                  <select
                    id="addVendor"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddVendor(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Select vendor to add...</option>
                    {unselectedVendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const select = document.getElementById('addVendor') as HTMLSelectElement;
                      if (select.value) {
                        handleAddVendor(select.value);
                        select.value = '';
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {selectedVendors.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No vendors selected. Add vendors to receive quotes.
                </p>
              )}
            </Card>

            {/* Notes */}
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Additional Notes</h2>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Enter any additional notes or special requirements for vendors..."
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Port Call Info */}
            {selectedPortCall && (
              <Card className="p-6">
                <h2 className="mb-4 text-lg font-semibold">Port Call Details</h2>
                <div className="space-y-3">
                  <div className="text-sm">
                    <p className="font-medium">{selectedPortCall.vessel}</p>
                    <p className="text-muted-foreground">{selectedPortCall.reference}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Ship className="h-4 w-4" />
                    <span>{selectedPortCall.port}</span>
                  </div>
                  <Link
                    href={`/port-calls/${selectedPortCall.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View port call details →
                  </Link>
                </div>
              </Card>
            )}

            {/* Actions */}
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
                  Close RFQ
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Are you sure? This will close the RFQ and notify all invited
                    vendors. Any received quotes will be preserved.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Keep Open
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Closing...' : 'Confirm Close'}
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
