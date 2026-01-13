'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from '@navo/ui';
import {
  ArrowLeft,
  FileText,
  Ship,
  Calendar,
  Building2,
  Plus,
  X,
  Send,
} from 'lucide-react';

const portCalls = [
  { id: '1', reference: 'PC-25-0001', vessel: 'MV Pacific Star', port: 'Singapore', eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
  { id: '2', reference: 'PC-25-0002', vessel: 'MV Atlantic Voyager', port: 'Rotterdam', eta: new Date() },
  { id: '3', reference: 'PC-25-0003', vessel: 'MT Gulf Trader', port: 'Dubai', eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
];

const serviceTypes = [
  { id: 'bunker', name: 'Bunker Supply' },
  { id: 'water', name: 'Fresh Water' },
  { id: 'waste', name: 'Waste Disposal' },
  { id: 'repairs', name: 'Repairs' },
  { id: 'provisions', name: 'Provisions' },
  { id: 'crew', name: 'Crew Services' },
];

const vendors = [
  { id: '1', name: 'Marine Fuel Solutions', services: ['bunker'], rating: 4.8 },
  { id: '2', name: 'Singapore Bunker Co.', services: ['bunker'], rating: 4.5 },
  { id: '3', name: 'Asia Pacific Fuels', services: ['bunker', 'water'], rating: 4.2 },
  { id: '4', name: 'Port Services International', services: ['provisions', 'crew', 'waste'], rating: 4.6 },
  { id: '5', name: 'Gulf Marine Services', services: ['repairs', 'water'], rating: 4.4 },
  { id: '6', name: 'Global Marine Supplies', services: ['bunker', 'water', 'provisions'], rating: 4.1 },
];

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CreateRFQPage() {
  const router = useRouter();
  const [selectedPortCall, setSelectedPortCall] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

  const filteredVendors = vendors.filter((v) =>
    selectedServiceType ? v.services.includes(selectedServiceType) : true
  );

  const toggleVendor = (vendorId: string) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, submit to API
    router.push('/rfqs');
  };

  const selectedPortCallData = portCalls.find((pc) => pc.id === selectedPortCall);

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/rfqs"
          className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to RFQs
        </Link>

        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create RFQ</h1>
            <p className="text-muted-foreground">
              Request quotes from vendors for port services
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Port Call Selection */}
            <Card className="p-5">
              <h2 className="mb-4 font-semibold">Port Call</h2>
              <Select value={selectedPortCall} onValueChange={setSelectedPortCall}>
                <SelectTrigger>
                  <SelectValue placeholder="Select port call" />
                </SelectTrigger>
                <SelectContent>
                  {portCalls.map((pc) => (
                    <SelectItem key={pc.id} value={pc.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{pc.vessel}</span>
                        <span className="text-muted-foreground">
                          · {pc.port} · {pc.reference}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPortCallData && (
                <div className="mt-4 flex items-center gap-4 rounded-lg border p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Ship className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{selectedPortCallData.vessel}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPortCallData.port} · ETA: {formatDate(selectedPortCallData.eta)}
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* Service Details */}
            <Card className="p-5">
              <h2 className="mb-4 font-semibold">Service Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Service Type</label>
                  <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((st) => (
                        <SelectItem key={st.id} value={st.id}>
                          {st.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Quantity</label>
                  <Input
                    placeholder="e.g., 500 MT VLSFO"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Specifications</label>
                  <Input
                    placeholder="e.g., ISO 8217:2017, 0.5% Sulfur"
                    value={specifications}
                    onChange={(e) => setSpecifications(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Response Deadline</label>
                  <Input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Additional Notes</label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    rows={4}
                    placeholder="Any additional requirements or instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Vendor Selection */}
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Select Vendors</h2>
                <span className="text-sm text-muted-foreground">
                  {selectedVendors.length} selected
                </span>
              </div>
              <div className="space-y-2">
                {filteredVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    onClick={() => toggleVendor(vendor.id)}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                      selectedVendors.includes(vendor.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          selectedVendors.includes(vendor.id) ? 'bg-primary/10' : 'bg-muted'
                        }`}
                      >
                        <Building2
                          className={`h-5 w-5 ${
                            selectedVendors.includes(vendor.id) ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        <p className="text-sm text-muted-foreground">Rating: {vendor.rating}</p>
                      </div>
                    </div>
                    {selectedVendors.includes(vendor.id) && (
                      <Badge className="bg-primary text-primary-foreground">Selected</Badge>
                    )}
                  </div>
                ))}
              </div>
              {filteredVendors.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Select a service type to see available vendors
                </p>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card className="p-5">
              <h3 className="mb-4 font-semibold">Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Port Call</span>
                  <span>{selectedPortCallData?.reference || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span>
                    {serviceTypes.find((st) => st.id === selectedServiceType)?.name || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span>{quantity || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendors</span>
                  <span>{selectedVendors.length} selected</span>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={!selectedPortCall || !selectedServiceType || selectedVendors.length === 0}>
                <Send className="mr-2 h-4 w-4" />
                Send RFQ
              </Button>
              <Button type="button" variant="outline" className="w-full">
                Save as Draft
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
