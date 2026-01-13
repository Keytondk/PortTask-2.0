'use client';

import { Button, Card, Input } from '@navo/ui';
import {
  ArrowLeft,
  Fuel,
  Ship,
  Save,
  Trash2,
  AlertTriangle,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const serviceTypes = [
  { value: 'bunker', label: 'Bunker Supply', icon: Fuel },
  { value: 'provisions', label: 'Provisions', icon: Ship },
  { value: 'repairs', label: 'Repairs & Maintenance', icon: Ship },
  { value: 'crew_change', label: 'Crew Change', icon: Ship },
  { value: 'waste_disposal', label: 'Waste Disposal', icon: Ship },
  { value: 'fresh_water', label: 'Fresh Water', icon: Ship },
  { value: 'lube_oil', label: 'Lube Oil', icon: Ship },
  { value: 'spare_parts', label: 'Spare Parts', icon: Ship },
  { value: 'survey', label: 'Survey & Inspection', icon: Ship },
  { value: 'other', label: 'Other Services', icon: Ship },
];

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'requested', label: 'Requested' },
  { value: 'rfq_sent', label: 'RFQ Sent' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const currencies = ['USD', 'EUR', 'GBP', 'SGD', 'AED', 'JPY'];

// Mock vendors
const vendors = [
  { id: '1', name: 'Marine Fuel Solutions' },
  { id: '2', name: 'Singapore Bunker Co.' },
  { id: '3', name: 'Asia Pacific Fuels' },
  { id: '4', name: 'Global Marine Supplies' },
  { id: '5', name: 'Eastern Bunker Services' },
];

// Mock port calls for selection
const portCalls = [
  { id: '1', reference: 'PC-25-0001', vessel: 'MV Pacific Star', port: 'Singapore' },
  { id: '2', reference: 'PC-25-0002', vessel: 'MV Atlantic Voyager', port: 'Rotterdam' },
  { id: '3', reference: 'PC-25-0003', vessel: 'MV Global Pioneer', port: 'Houston' },
];

// Mock existing service data
const getService = (id: string) => ({
  id,
  type: 'bunker',
  reference: 'SVC-25-0001',
  portCallId: '1',
  status: 'confirmed',
  vendorId: '1',
  quantity: '500',
  unit: 'MT',
  specifications: 'VLSFO 0.5% Sulfur, ISO 8217:2017',
  scheduledDate: '2025-01-15',
  scheduledTime: '14:00',
  deliveryLocation: 'Western Anchorage',
  price: '325000',
  currency: 'USD',
  pricePerUnit: '650',
  notes: 'Delivery via barge. Vessel to provide 24hr notice before arrival.',
});

export default function EditServicePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    portCallId: '',
    status: '',
    vendorId: '',
    quantity: '',
    unit: '',
    specifications: '',
    scheduledDate: '',
    scheduledTime: '',
    deliveryLocation: '',
    price: '',
    currency: 'USD',
    pricePerUnit: '',
    notes: '',
  });

  useEffect(() => {
    const service = getService(params.id);
    setFormData({
      type: service.type,
      portCallId: service.portCallId,
      status: service.status,
      vendorId: service.vendorId,
      quantity: service.quantity,
      unit: service.unit,
      specifications: service.specifications,
      scheduledDate: service.scheduledDate,
      scheduledTime: service.scheduledTime,
      deliveryLocation: service.deliveryLocation,
      price: service.price,
      currency: service.currency,
      pricePerUnit: service.pricePerUnit,
      notes: service.notes,
    });
  }, [params.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push(`/services/${params.id}`);
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push('/services');
  };

  const selectedPortCall = portCalls.find((pc) => pc.id === formData.portCallId);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/services/${params.id}`}
          className="rounded-lg p-2 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Service Order</h1>
          <p className="text-muted-foreground">Update service order details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Service Type & Status */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Fuel className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Service Information</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Service Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
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
                <div className="md:col-span-2">
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

            {/* Service Details */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Ship className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Service Details</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="e.g., 500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Unit
                  </label>
                  <Input
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
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
                    Scheduled Date
                  </label>
                  <Input
                    type="date"
                    name="scheduledDate"
                    value={formData.scheduledDate}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Scheduled Time
                  </label>
                  <Input
                    type="time"
                    name="scheduledTime"
                    value={formData.scheduledTime}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </Card>

            {/* Vendor & Pricing */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Vendor & Pricing</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">
                    Vendor
                  </label>
                  <select
                    name="vendorId"
                    value={formData.vendorId}
                    onChange={handleChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select vendor...</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Total Price
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="w-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {currencies.map((curr) => (
                        <option key={curr} value={curr}>
                          {curr}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="Total price"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Price per Unit
                  </label>
                  <Input
                    type="number"
                    name="pricePerUnit"
                    value={formData.pricePerUnit}
                    onChange={handleChange}
                    placeholder="e.g., 650"
                  />
                </div>
              </div>
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
                placeholder="Enter any additional notes or special instructions..."
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
                  <div className="flex items-center gap-2 text-sm">
                    <Ship className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedPortCall.vessel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
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
                  Cancel Service Order
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Are you sure? This will cancel the service order and notify the
                    vendor if one is assigned.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Keep Order
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Cancelling...' : 'Confirm Cancel'}
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
