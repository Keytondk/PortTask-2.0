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
  Building2,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Send,
  Plus,
  Trash2,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import { api, RFQ } from '@/lib/api';

interface RFQData {
  id: string;
  reference: string;
  serviceType: string;
  description: string;
  specifications: string;
  port: string;
  terminal: string;
  vessel: string;
  vesselIMO: string;
  vesselType: string;
  deadline: string;
  serviceDate: string;
  estimatedValue: number;
  currency: string;
  status: string;
  client: { name: string; rating: number; totalOrders: number };
  quotesCount: number;
  hasQuoted: boolean;
  requirements: string[];
}

interface QuoteLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export default function RFQDetailPage() {
  const params = useParams<{ id: string }>();
  const [rfq, setRfq] = useState<RFQData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(true);
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([
    { id: '1', description: 'Service', quantity: 1, unit: 'Unit', unitPrice: 0 },
  ]);
  const [notes, setNotes] = useState('');
  const [validityDays, setValidityDays] = useState(7);

  useEffect(() => {
    async function fetchRFQ() {
      if (!params.id) return;

      try {
        setLoading(true);
        const response = await api.getRFQ(params.id);
        const data = response.data;

        setRfq({
          id: data.id,
          reference: data.reference,
          serviceType: data.service_type?.name || 'Service',
          description: data.description || '',
          specifications: JSON.stringify(data.specifications || {}),
          port: data.port_call?.port?.name || '',
          terminal: '',
          vessel: data.port_call?.vessel?.name || '',
          vesselIMO: '',
          vesselType: '',
          deadline: data.deadline,
          serviceDate: data.delivery_date || data.deadline,
          estimatedValue: 0,
          currency: 'USD',
          status: data.status,
          client: { name: 'Client', rating: 4.5, totalOrders: 0 },
          quotesCount: 0,
          hasQuoted: false,
          requirements: [],
        });

        if (data.quantity) {
          setLineItems([
            { id: '1', description: data.service_type?.name || 'Service', quantity: data.quantity, unit: data.unit || 'Unit', unitPrice: 0 },
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch RFQ:', err);
        setError('Failed to load RFQ details');
      } finally {
        setLoading(false);
      }
    }

    fetchRFQ();
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

  if (error || !rfq) {
    return (
      <VendorShell>
        <div className="flex h-96 flex-col items-center justify-center gap-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <p className="text-lg font-medium text-slate-900 dark:text-white">{error || 'RFQ not found'}</p>
          <Link
            href="/rfqs"
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to RFQs
          </Link>
        </div>
      </VendorShell>
    );
  }

  const isExpired = new Date(rfq.deadline) < new Date();
  const isUrgent = !isExpired && new Date(rfq.deadline).getTime() - Date.now() < 12 * 60 * 60 * 1000;

  const totalAmount = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: Date.now().toString(),
        description: '',
        quantity: 1,
        unit: 'Unit',
        unitPrice: 0,
      },
    ]);
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const handleLineItemChange = (
    id: string,
    field: keyof QuoteLineItem,
    value: string | number
  ) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmitQuote = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setQuoteSubmitted(true);
    setShowQuoteForm(false);
    setIsSubmitting(false);
  };

  return (
    <VendorShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/rfqs"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {rfq.serviceType}
                </h1>
                {isExpired ? (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-slate-100 text-slate-600">
                    Closed
                  </span>
                ) : isUrgent ? (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Urgent
                  </span>
                ) : (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700">
                    Open
                  </span>
                )}
                {quoteSubmitted && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Quote Submitted
                  </span>
                )}
              </div>
              <p className="text-slate-500 mt-1">{rfq.reference}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Deadline</p>
            <p
              className={clsx(
                'font-semibold',
                isExpired
                  ? 'text-slate-500'
                  : isUrgent
                    ? 'text-red-600'
                    : 'text-slate-900 dark:text-white'
              )}
            >
              {isExpired
                ? 'Expired'
                : formatDistanceToNow(new Date(rfq.deadline), { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* RFQ Details */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Request Details
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">
                    Description
                  </h3>
                  <p className="text-slate-900 dark:text-white">
                    {rfq.description}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">
                    Specifications
                  </h3>
                  <pre className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                    {rfq.specifications}
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
                        {rfq.vessel}
                      </p>
                      <p className="text-xs text-slate-400">
                        IMO: {rfq.vesselIMO} • {rfq.vesselType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Location</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {rfq.port}
                      </p>
                      <p className="text-xs text-slate-400">{rfq.terminal}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Service Date</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {format(new Date(rfq.serviceDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Estimated Value</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: rfq.currency,
                          minimumFractionDigits: 0,
                        }).format(rfq.estimatedValue)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Requirements
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {rfq.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300">
                        {req}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Quote Form */}
            {showQuoteForm && !isExpired && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Submit Your Quote
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  {/* Line Items */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Line Items
                      </label>
                      <button
                        onClick={handleAddLineItem}
                        className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700"
                      >
                        <Plus className="w-4 h-4" />
                        Add Item
                      </button>
                    </div>
                    <div className="space-y-3">
                      {lineItems.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-12 gap-2 items-center"
                        >
                          <div className="col-span-5">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) =>
                                handleLineItemChange(
                                  item.id,
                                  'description',
                                  e.target.value
                                )
                              }
                              placeholder="Description"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleLineItemChange(
                                  item.id,
                                  'quantity',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="Qty"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) =>
                                handleLineItemChange(item.id, 'unit', e.target.value)
                              }
                              placeholder="Unit"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleLineItemChange(
                                  item.id,
                                  'unitPrice',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="Price"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            />
                          </div>
                          <div className="col-span-1 text-center">
                            <button
                              onClick={() => handleRemoveLineItem(item.id)}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                              disabled={lineItems.length === 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Total Quote Amount</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: rfq.currency,
                            minimumFractionDigits: 0,
                          }).format(totalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Validity */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Quote Validity (Days)
                    </label>
                    <select
                      value={validityDays}
                      onChange={(e) => setValidityDays(parseInt(e.target.value))}
                      className="mt-1 w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <option value={3}>3 Days</option>
                      <option value={7}>7 Days</option>
                      <option value={14}>14 Days</option>
                      <option value={30}>30 Days</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Additional Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any terms, conditions, or notes for your quote..."
                      rows={3}
                      className="mt-1 w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowQuoteForm(false)}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitQuote}
                      disabled={isSubmitting || lineItems.length === 0}
                      className={clsx(
                        'flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors',
                        'bg-amber-500 text-white hover:bg-amber-600',
                        isSubmitting && 'opacity-75 cursor-not-allowed'
                      )}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {isSubmitting ? 'Submitting...' : 'Submit Quote'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quote Submitted */}
            {quoteSubmitted && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800 dark:text-green-300">
                      Quote Submitted Successfully
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                      Your quote of{' '}
                      <strong>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: rfq.currency,
                          minimumFractionDigits: 0,
                        }).format(totalAmount)}
                      </strong>{' '}
                      has been submitted. You'll be notified when the client makes a decision.
                    </p>
                    <button
                      onClick={() => setShowQuoteForm(true)}
                      className="mt-3 text-sm text-green-700 dark:text-green-400 hover:underline"
                    >
                      Edit Quote
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Requesting Client
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {rfq.client.name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        ★ {rfq.client.rating}
                      </span>
                      <span>•</span>
                      <span>{rfq.client.totalOrders} orders</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Competition */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Competition
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Quotes Received
                  </span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {rfq.quotesCount}
                  </span>
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Submit a competitive quote to increase your chances of winning this RFQ.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Dates */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Important Dates
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Clock className="w-4 h-4" />
                    Quote Deadline
                  </span>
                  <span
                    className={clsx(
                      'font-medium',
                      isExpired
                        ? 'text-slate-500'
                        : isUrgent
                          ? 'text-red-600'
                          : 'text-slate-900 dark:text-white'
                    )}
                  >
                    {format(new Date(rfq.deadline), 'MMM d, h:mm a')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                    Service Date
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {format(new Date(rfq.serviceDate), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </VendorShell>
  );
}
