'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, CreateRFQInput, RFQ, Vendor, ServiceType } from '@/lib/api';
import { format } from 'date-fns';
import {
  FileText,
  Calendar,
  Users,
  Package,
  Loader2,
  X,
  Plus,
  Check,
} from 'lucide-react';

const rfqSchema = z.object({
  service_type_id: z.string().min(1, 'Service type is required'),
  port_call_id: z.string().min(1, 'Port call is required'),
  description: z.string().optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  deadline: z.string().min(1, 'Deadline is required'),
  delivery_date: z.string().optional(),
  invited_vendors: z.array(z.string()).optional(),
});

type RFQFormData = z.infer<typeof rfqSchema>;

interface RFQFormProps {
  portCallId?: string;
  rfq?: RFQ;
  onSuccess?: (rfq: RFQ) => void;
  onCancel?: () => void;
}

export function RFQForm({ portCallId, rfq, onSuccess, onCancel }: RFQFormProps) {
  const queryClient = useQueryClient();
  const [selectedVendors, setSelectedVendors] = useState<string[]>(
    rfq?.invited_vendors || []
  );

  // Fetch service types
  const { data: serviceTypesData } = useQuery({
    queryKey: ['service-types'],
    queryFn: async () => {
      // This would be a real API call
      return {
        data: [
          { id: '1', name: 'Bunkering', category: 'Fuel', description: '' },
          { id: '2', name: 'Pilotage', category: 'Navigation', description: '' },
          { id: '3', name: 'Towage', category: 'Navigation', description: '' },
          { id: '4', name: 'Provisions', category: 'Supply', description: '' },
          { id: '5', name: 'Waste Disposal', category: 'Environmental', description: '' },
        ] as ServiceType[],
      };
    },
  });

  // Fetch vendors
  const { data: vendorsData } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => api.getVendors({ per_page: 100 }),
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RFQFormData>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      service_type_id: rfq?.service_type_id || '',
      port_call_id: rfq?.port_call_id || portCallId || '',
      description: rfq?.description || '',
      quantity: rfq?.quantity,
      unit: rfq?.unit || '',
      deadline: rfq?.deadline
        ? format(new Date(rfq.deadline), "yyyy-MM-dd'T'HH:mm")
        : '',
      delivery_date: rfq?.delivery_date
        ? format(new Date(rfq.delivery_date), "yyyy-MM-dd'T'HH:mm")
        : '',
      invited_vendors: rfq?.invited_vendors || [],
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateRFQInput) => api.createRFQ(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      onSuccess?.(response.data);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateRFQInput) =>
      api.updateRFQ(rfq!.id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['rfq', rfq!.id] });
      onSuccess?.(response.data);
    },
  });

  const onSubmit = async (data: RFQFormData) => {
    const input: CreateRFQInput = {
      ...data,
      invited_vendors: selectedVendors,
      deadline: new Date(data.deadline).toISOString(),
      delivery_date: data.delivery_date
        ? new Date(data.delivery_date).toISOString()
        : undefined,
    };

    if (rfq) {
      await updateMutation.mutateAsync(input);
    } else {
      await createMutation.mutateAsync(input);
    }
  };

  const toggleVendor = (vendorId: string) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId)
        ? prev.filter((id) => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
        </div>
      )}

      {/* Service Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          <Package className="w-4 h-4 inline-block mr-1" />
          Service Type
        </label>
        <select
          {...register('service_type_id')}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select service type</option>
          {serviceTypesData?.data.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name} ({type.category})
            </option>
          ))}
        </select>
        {errors.service_type_id && (
          <p className="mt-1 text-sm text-red-500">{errors.service_type_id.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          <FileText className="w-4 h-4 inline-block mr-1" />
          Description
        </label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          placeholder="Describe the service requirements..."
        />
      </div>

      {/* Quantity & Unit */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Quantity
          </label>
          <Controller
            name="quantity"
            control={control}
            render={({ field }) => (
              <input
                type="number"
                step="0.01"
                {...field}
                onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Unit
          </label>
          <input
            {...register('unit')}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., MT, CBM, Units"
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            <Calendar className="w-4 h-4 inline-block mr-1" />
            Response Deadline
          </label>
          <input
            {...register('deadline')}
            type="datetime-local"
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
          {errors.deadline && (
            <p className="mt-1 text-sm text-red-500">{errors.deadline.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            <Calendar className="w-4 h-4 inline-block mr-1" />
            Delivery Date (Optional)
          </label>
          <input
            {...register('delivery_date')}
            type="datetime-local"
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Vendors */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          <Users className="w-4 h-4 inline-block mr-1" />
          Invite Vendors
        </label>
        <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-4 max-h-48 overflow-y-auto">
          {vendorsData?.data && vendorsData.data.length > 0 ? (
            <div className="space-y-2">
              {vendorsData.data.map((vendor) => (
                <label
                  key={vendor.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedVendors.includes(vendor.id)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-slate-300 dark:border-slate-500'
                    }`}
                    onClick={() => toggleVendor(vendor.id)}
                  >
                    {selectedVendors.includes(vendor.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-slate-900 dark:text-white">{vendor.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No vendors available</p>
          )}
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {selectedVendors.length} vendor(s) selected
        </p>
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
          disabled={isLoading || isSubmitting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {rfq ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              {rfq ? 'Update RFQ' : 'Create RFQ'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
