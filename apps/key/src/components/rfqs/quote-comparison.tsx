'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, Quote, QuoteComparison as QuoteComparisonType } from '@/lib/api';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Award,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  Check,
  X,
  Clock,
  DollarSign,
  Building2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';

interface QuoteComparisonProps {
  rfqId: string;
  onAward?: (quoteId: string) => void;
}

export function QuoteComparison({ rfqId, onAward }: QuoteComparisonProps) {
  const queryClient = useQueryClient();
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [showConfirmAward, setShowConfirmAward] = useState(false);

  // Fetch quote comparison
  const { data: comparison, isLoading, error } = useQuery({
    queryKey: ['rfq-comparison', rfqId],
    queryFn: () => api.compareRFQQuotes(rfqId),
  });

  // Award mutation
  const awardMutation = useMutation({
    mutationFn: (quoteId: string) => api.awardQuote(rfqId, quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] });
      queryClient.invalidateQueries({ queryKey: ['rfq-comparison', rfqId] });
      setShowConfirmAward(false);
      onAward?.(selectedQuoteId!);
    },
  });

  const handleAwardClick = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    setShowConfirmAward(true);
  };

  const confirmAward = () => {
    if (selectedQuoteId) {
      awardMutation.mutate(selectedQuoteId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-600 dark:text-red-400">
            Failed to load quote comparison
          </p>
        </div>
      </div>
    );
  }

  const data = comparison?.data;
  if (!data || data.quotes.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
          No Quotes Yet
        </h3>
        <p className="text-slate-500">
          Waiting for vendors to submit their quotes.
        </p>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Sort quotes by total price
  const sortedQuotes = [...data.quotes].sort((a, b) => a.total_price - b.total_price);
  const lowestQuote = sortedQuotes[0];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Building2 className="w-4 h-4" />
            <span className="text-sm">Quotes Received</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {data.quote_count}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
            <TrendingDown className="w-4 h-4" />
            <span className="text-sm">Lowest Price</span>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {formatCurrency(data.lowest_price, lowestQuote.currency)}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Highest Price</span>
          </div>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">
            {formatCurrency(data.highest_price, lowestQuote.currency)}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Average Price</span>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {formatCurrency(data.average_price, lowestQuote.currency)}
          </p>
        </div>
      </div>

      {/* Recommendation */}
      {data.recommendation && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200">
                Recommendation
              </h4>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                {data.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quote Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
          All Quotes
        </h3>
        {sortedQuotes.map((quote, index) => {
          const isLowest = quote.id === lowestQuote.id;
          const priceDiff = quote.total_price - data.lowest_price;
          const priceDiffPercent =
            data.lowest_price > 0
              ? ((priceDiff / data.lowest_price) * 100).toFixed(1)
              : '0';

          return (
            <div
              key={quote.id}
              className={clsx(
                'border rounded-lg overflow-hidden transition-all',
                isLowest
                  ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      isLowest
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200'
                    )}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      {quote.vendor?.name || 'Unknown Vendor'}
                    </h4>
                    <p className="text-sm text-slate-500">
                      Submitted{' '}
                      {formatDistanceToNow(new Date(quote.submitted_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {isLowest && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full">
                      Lowest Price
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(quote.total_price, quote.currency)}
                  </p>
                  {!isLowest && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      +{formatCurrency(priceDiff, quote.currency)} ({priceDiffPercent}%
                      higher)
                    </p>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="p-4 grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Unit Price</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {formatCurrency(quote.unit_price, quote.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Payment Terms</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {quote.payment_terms || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Delivery Date</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {quote.delivery_date
                      ? format(new Date(quote.delivery_date), 'MMM d, yyyy')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Valid Until</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {quote.valid_until
                      ? format(new Date(quote.valid_until), 'MMM d, yyyy')
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {quote.notes && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-slate-500 mb-1">Notes</p>
                  <p className="text-slate-700 dark:text-slate-300">{quote.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => handleAwardClick(quote.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Award className="w-4 h-4" />
                  Award Quote
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Award Confirmation Modal */}
      {showConfirmAward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Confirm Award
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Are you sure you want to award this quote? This action will notify the
              vendor and close the RFQ.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmAward(false)}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAward}
                disabled={awardMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {awardMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Awarding...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirm Award
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
