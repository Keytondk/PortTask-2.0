'use client';

import { Button, Card, Input } from '@navo/ui';
import { ArrowLeft, Calendar, Ship, MapPin, User, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
];

export default function NewPortCallPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Mock submission - will be replaced with API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    router.push('/port-calls');
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link href="/port-calls" className="rounded-lg p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Port Call</h1>
          <p className="text-muted-foreground">
            Create a new port call for scheduling and service management
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Vessel Selection */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Ship className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Vessel</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Select Vessel *
                  </label>
                  <select
                    name="vesselId"
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
              </div>
            </Card>

            {/* Port Selection */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Port</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Select Port *
                  </label>
                  <select
                    name="portId"
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
                    Terminal / Berth
                  </label>
                  <Input
                    name="berthName"
                    placeholder="e.g., Berth 12, Terminal A"
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
                  <Input type="datetime-local" name="eta" required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Estimated Time of Departure (ETD) *
                  </label>
                  <Input type="datetime-local" name="etd" required />
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
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">No agent assigned</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-muted-foreground">
                  Port agents handle berthing, clearance, and local coordination
                </p>
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
                    'Creating...'
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Port Call
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

            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Tips</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  Port calls are created in draft status and can be edited later
                </li>
                <li>
                  Add services after creating the port call to manage bunker,
                  provisions, and other requirements
                </li>
                <li>
                  Assigning an agent is optional but recommended for smooth port
                  operations
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
