'use client';

import { Button, Card, Input } from '@navo/ui';
import { ArrowLeft, Calendar, Ship, MapPin, User, Save, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

// Mock data for dropdowns - will be replaced with API calls
const vessels = [
  { id: 'v1', name: 'MV Pacific Star', imo: '9876543' },
  { id: 'v2', name: 'MV Atlantic Voyager', imo: '9876544' },
  { id: 'v3', name: 'MT Gulf Trader', imo: '9876545' },
];

const ports = [
  { id: 'p1', name: 'Singapore', unlocode: 'SGSIN' },
  { id: 'p2', name: 'Rotterdam', unlocode: 'NLRTM' },
  { id: 'p3', name: 'Shanghai', unlocode: 'CNSHA' },
  { id: 'p4', name: 'Houston', unlocode: 'USHOU' },
  { id: 'p5', name: 'Dubai (Jebel Ali)', unlocode: 'AEJEA' },
];

const agents = [
  { id: 'a1', name: 'Singapore Maritime Agency' },
  { id: 'a2', name: 'Rotterdam Port Services' },
];

const statuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'planned', label: 'Planned' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'alongside', label: 'Alongside' },
  { value: 'departed', label: 'Departed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Mock existing port call data - will be replaced with API call
const getPortCall = (id: string) => ({
  id,
  reference: 'PC-25-0001',
  vesselId: 'v1',
  portId: 'p1',
  status: 'confirmed',
  eta: '2025-01-13T10:00',
  etd: '2025-01-15T18:00',
  ata: '',
  atd: '',
  berthName: 'Berth 12',
  berthTerminal: 'PSA Terminal',
  agentId: 'a1',
  notes: 'Routine port call for bunkering and provisions.',
});

export default function EditPortCallPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    vesselId: '',
    portId: '',
    status: '',
    eta: '',
    etd: '',
    ata: '',
    atd: '',
    berthName: '',
    berthTerminal: '',
    agentId: '',
    notes: '',
  });

  useEffect(() => {
    // Load existing data - will be replaced with API call
    const portCall = getPortCall(params.id);
    setFormData({
      vesselId: portCall.vesselId,
      portId: portCall.portId,
      status: portCall.status,
      eta: portCall.eta,
      etd: portCall.etd,
      ata: portCall.ata,
      atd: portCall.atd,
      berthName: portCall.berthName,
      berthTerminal: portCall.berthTerminal,
      agentId: portCall.agentId,
      notes: portCall.notes,
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

    // Mock submission - will be replaced with API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    router.push(`/port-calls/${params.id}`);
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    // Mock deletion - will be replaced with API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push('/port-calls');
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/port-calls/${params.id}`}
            className="rounded-lg p-2 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Port Call</h1>
            <p className="text-muted-foreground">
              Update port call details and schedule
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Status */}
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Status</h2>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Port Call Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </Card>

            {/* Vessel Selection */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Ship className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Vessel</h2>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Select Vessel *
                </label>
                <select
                  name="vesselId"
                  value={formData.vesselId}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Choose a vessel...</option>
                  {vessels.map((vessel) => (
                    <option key={vessel.id} value={vessel.id}>
                      {vessel.name} (IMO {vessel.imo})
                    </option>
                  ))}
                </select>
              </div>
            </Card>

            {/* Port Selection */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Port & Berth</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Select Port *
                  </label>
                  <select
                    name="portId"
                    value={formData.portId}
                    onChange={handleChange}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Choose a port...</option>
                    {ports.map((port) => (
                      <option key={port.id} value={port.id}>
                        {port.name} ({port.unlocode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Terminal
                  </label>
                  <Input
                    name="berthTerminal"
                    value={formData.berthTerminal}
                    onChange={handleChange}
                    placeholder="e.g., PSA Terminal"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">
                    Berth Name
                  </label>
                  <Input
                    name="berthName"
                    value={formData.berthName}
                    onChange={handleChange}
                    placeholder="e.g., Berth 12"
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
                    Estimated Time of Arrival (ETA) *
                  </label>
                  <Input
                    type="datetime-local"
                    name="eta"
                    value={formData.eta}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Actual Time of Arrival (ATA)
                  </label>
                  <Input
                    type="datetime-local"
                    name="ata"
                    value={formData.ata}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Estimated Time of Departure (ETD) *
                  </label>
                  <Input
                    type="datetime-local"
                    name="etd"
                    value={formData.etd}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Actual Time of Departure (ATD)
                  </label>
                  <Input
                    type="datetime-local"
                    name="atd"
                    value={formData.atd}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </Card>

            {/* Agent */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Port Agent</h2>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Select Agent (Optional)
                </label>
                <select
                  name="agentId"
                  value={formData.agentId}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">No agent assigned</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            </Card>

            {/* Notes */}
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Notes</h2>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Add any additional notes or special instructions..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
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
                  Delete Port Call
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Are you sure? This action cannot be undone. All associated
                    services will also be deleted.
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
