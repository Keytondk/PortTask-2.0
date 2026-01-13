'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  DollarSign,
  Calendar,
  FileText,
  Loader2,
  Send,
  Paperclip,
} from 'lucide-react';

const quoteSchema = z.object({
  unit_price: z.number().positive('Unit price must be positive'),
  total_price: z.number().positive('Total price must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  payment_terms: z.string().optional(),
  delivery_date: z.string().optional(),
  valid_until: z.string().optional(),
  notes: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface QuoteFormProps {
  rfqId: string;
  quantity?: number;
  unit?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function QuoteForm({
  rfqId,
  quantity = 1,
  unit = 'unit',
  onSuccess,
  onCancel,
}: QuoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      currency: 'USD',
      payment_terms: 'Net 30',
    },
  });

  const unitPrice = watch('unit_price');

  // Auto-calculate total price
  const handleUnitPriceChange = (value: number) => {
    setValue('unit_price', value);
    if (quantity) {
      setValue('total_price', value * quantity);
    }
  };

  const onSubmit = async (data: QuoteFormData) => {
    setIsSubmitting(true);
    try {
      // In production, this would call the API
      console.log('Submitting quote:', { rfqId, ...data, attachments });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onSuccess?.();
    } catch (error) {
      console.error('Failed to submit quote:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
          Pricing
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <DollarSign className="w-4 h-4 inline-block mr-1" />
              Unit Price
            </label>
            <div className="relative">
              <Controller
                name="unit_price"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) =>
                      handleUnitPriceChange(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    placeholder="0.00"
                  />
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                per {unit}
              </span>
            </div>
            {errors.unit_price && (
              <p className="mt-1 text-sm text-red-500">
                {errors.unit_price.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <DollarSign className="w-4 h-4 inline-block mr-1" />
              Total Price
            </label>
            <Controller
              name="total_price"
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  step="0.01"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  placeholder="0.00"
                />
              )}
            />
            {errors.total_price && (
              <p className="mt-1 text-sm text-red-500">
                {errors.total_price.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Currency
            </label>
            <select
              {...register('currency')}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="SGD">SGD - Singapore Dollar</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Payment Terms
            </label>
            <select
              {...register('payment_terms')}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="Net 7">Net 7 days</option>
              <option value="Net 15">Net 15 days</option>
              <option value="Net 30">Net 30 days</option>
              <option value="Net 45">Net 45 days</option>
              <option value="Net 60">Net 60 days</option>
              <option value="COD">Cash on Delivery</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
          Delivery & Validity
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Calendar className="w-4 h-4 inline-block mr-1" />
              Delivery Date
            </label>
            <input
              {...register('delivery_date')}
              type="datetime-local"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Calendar className="w-4 h-4 inline-block mr-1" />
              Quote Valid Until
            </label>
            <input
              {...register('valid_until')}
              type="datetime-local"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          <FileText className="w-4 h-4 inline-block mr-1" />
          Notes & Conditions
        </label>
        <textarea
          {...register('notes')}
          rows={4}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          placeholder="Add any additional notes, conditions, or clarifications..."
        />
      </div>

      {/* Attachments */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          <Paperclip className="w-4 h-4 inline-block mr-1" />
          Attachments
        </label>
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <Paperclip className="w-5 h-5" />
            Click to attach files
          </label>
        </div>
        {attachments.length > 0 && (
          <ul className="mt-2 space-y-1">
            {attachments.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded"
              >
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Quote
            </>
          )}
        </button>
      </div>
    </form>
  );
}
