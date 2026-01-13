'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { VendorShell } from '@/components/layout/vendor-shell';
import {
  ArrowLeft,
  Ship,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  User,
  Building2,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  MessageSquare,
  Upload,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { api, ServiceOrder } from '@/lib/api';

interface OrderData {
  id: string;
  reference: string;
  serviceType: string;
  description: string;
  specifications: string;
  port: string;
  terminal: string;
  vessel: string;
  vesselIMO: string;
  scheduledDate: string;
  amount: number;
  currency: string;
  status: string;
  client: { name: string; contact: string; email: string; phone: string };
  timeline: { id: string; action: string; timestamp: string; actor: string; note: string }[];
  documents: { id: string; name: string; size: string; type: string }[];
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-blue-100 text-blue-700',
    icon: CheckCircle2,
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-purple-100 text-purple-700',
    icon: Loader2,
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-700',
    icon: AlertCircle,
  },
};

const statusFlow = ['pending', 'confirmed', 'in_progress', 'completed'];

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState('pending');
  const [updateNote, setUpdateNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      if (!params.id) return;

      try {
        setLoading(true);
        const response = await api.getOrder(params.id);
        const data = response.data;

        const orderData: OrderData = {
          id: data.id,
          reference: `ORD-${data.id.substring(0, 8)}`,
          serviceType: data.service_type?.name || 'Service',
          description: data.description || '',
          specifications: JSON.stringify(data.quantity ? { quantity: data.quantity, unit: data.unit } : {}),
          port: data.port_call?.port?.name || '',
          terminal: '',
          vessel: data.port_call?.vessel?.name || '',
          vesselIMO: '',
          scheduledDate: data.created_at,
          amount: data.final_price || data.quoted_price || 0,
          currency: data.currency,
          status: data.status,
          client: { name: 'Client', contact: '', email: '', phone: '' },
          timeline: [
            {
              id: '1',
              action: 'Order Created',
              timestamp: data.created_at,
              actor: 'System',
              note: 'Service order created',
            },
          ],
          documents: [],
        };

        setOrder(orderData);
        setCurrentStatus(data.status);
      } catch (err) {
        console.error('Failed to fetch order:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [params.id]);

  if (loading) {
    return (
      <VendorShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </VendorShell>
    );
  }

  if (error || !order) {
    return (
      <VendorShell>
        <div className="flex h-96 flex-col items-center justify-center gap-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <p className="text-lg font-medium text-slate-900 dark:text-white">{error || 'Order not found'}</p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
        </div>
      </VendorShell>
    );
  }

  const status = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;
  const currentIndex = statusFlow.indexOf(currentStatus);
  const canProgress = currentIndex < statusFlow.length - 1 && currentStatus !== 'cancelled';

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setCurrentStatus(newStatus);
    setUpdateNote('');
    setIsUpdating(false);
  };

  const getNextStatus = () => {
    if (currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1];
    }
    return null;
  };

  const nextStatus = getNextStatus();
  const nextStatusConfig = nextStatus
    ? statusConfig[nextStatus as keyof typeof statusConfig]
    : null;

  return (
    <VendorShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/orders"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {order.serviceType}
                </h1>
                <span
                  className={clsx(
                    'px-3 py-1 text-sm font-medium rounded-full flex items-center gap-1',
                    status.color
                  )}
                >
                  <StatusIcon className="w-4 h-4" />
                  {status.label}
                </span>
              </div>
              <p className="text-slate-500 mt-1">{order.reference}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Update Card */}
            {canProgress && (
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl border border-amber-200 dark:border-amber-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Update Order Status
                </h2>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        status.color
                      )}
                    >
                      {status.label}
                    </span>
                    <span className="text-slate-400">→</span>
                    {nextStatusConfig && (
                      <span
                        className={clsx(
                          'px-2 py-1 text-xs font-medium rounded-full',
                          nextStatusConfig.color
                        )}
                      >
                        {nextStatusConfig.label}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <textarea
                    value={updateNote}
                    onChange={(e) => setUpdateNote(e.target.value)}
                    placeholder="Add a note about this status update (optional)..."
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500"
                    rows={2}
                  />
                  <div className="flex gap-3">
                    {nextStatus && (
                      <button
                        onClick={() => handleStatusUpdate(nextStatus)}
                        disabled={isUpdating}
                        className={clsx(
                          'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                          'bg-amber-500 text-white hover:bg-amber-600',
                          isUpdating && 'opacity-75 cursor-not-allowed'
                        )}
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Mark as {nextStatusConfig?.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Order Details */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Order Details
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">
                    Description
                  </h3>
                  <p className="text-slate-900 dark:text-white">
                    {order.description}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">
                    Specifications
                  </h3>
                  <pre className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                    {order.specifications}
                  </pre>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Ship className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Vessel</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {order.vessel}
                      </p>
                      <p className="text-xs text-slate-400">IMO: {order.vesselIMO}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Location</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {order.port}
                      </p>
                      <p className="text-xs text-slate-400">{order.terminal}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Scheduled Date</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {format(new Date(order.scheduledDate), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-slate-400">
                        {format(new Date(order.scheduledDate), 'EEEE')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Order Value</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: order.currency,
                          minimumFractionDigits: 0,
                        }).format(order.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Order Timeline
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {order.timeline.map((event, index) => (
                    <div key={event.id} className="relative flex gap-4">
                      {index < order.timeline.length - 1 && (
                        <div className="absolute left-5 top-10 w-0.5 h-full bg-slate-200 dark:bg-slate-700" />
                      )}
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                        <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {event.action}
                        </p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {event.actor}
                        </p>
                        {event.note && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {event.note}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                          {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Client
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {order.client.name}
                    </p>
                    <p className="text-sm text-slate-500">{order.client.contact}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <a
                    href={`mailto:${order.client.email}`}
                    className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    <Mail className="w-4 h-4" />
                    {order.client.email}
                  </a>
                  <a
                    href={`tel:${order.client.phone}`}
                    className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    <Phone className="w-4 h-4" />
                    {order.client.phone}
                  </a>
                </div>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  Send Message
                </button>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Documents
                </h2>
              </div>
              <div className="p-6 space-y-3">
                {order.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-slate-500">{doc.size}</p>
                    </div>
                  </div>
                ))}
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 hover:border-amber-500 hover:text-amber-600 transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload Document
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Quick Actions
                </h2>
              </div>
              <div className="p-6 space-y-2">
                <button className="w-full flex items-center gap-2 px-4 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <FileText className="w-4 h-4" />
                  Generate Invoice
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <Package className="w-4 h-4" />
                  Create Delivery Note
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <AlertCircle className="w-4 h-4" />
                  Report Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </VendorShell>
  );
}
