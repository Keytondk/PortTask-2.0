'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Send, Loader2, CheckCircle2, UserPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  message: z.string().max(500, 'Message too long').optional(),
  serviceTypes: z.array(z.string()).optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteResult {
  invitation?: {
    id: string;
    invitedEmail: string;
    existingVendor?: {
      id: string;
      name: string;
    };
  };
  isExistingVendor: boolean;
  autoAdded: boolean;
  message: string;
}

interface VendorInviteFormProps {
  serviceTypes?: Array<{ id: string; name: string }>;
  onInvite: (data: InviteFormData) => Promise<InviteResult>;
  onCancel?: () => void;
  className?: string;
}

export function VendorInviteForm({
  serviceTypes = [],
  onInvite,
  onCancel,
  className,
}: VendorInviteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<InviteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      message: '',
      serviceTypes: [],
    },
  });

  const selectedServiceTypes = watch('serviceTypes') || [];

  const onSubmit = async (data: InviteFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const inviteResult = await onInvite(data);
      setResult(inviteResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    reset();
  };

  // Success state
  if (result) {
    return (
      <div className={cn('rounded-lg border bg-white p-6', className)}>
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {result.autoAdded ? 'Vendor Added!' : 'Invitation Sent!'}
          </h3>
          <p className="mt-2 text-sm text-gray-600">{result.message}</p>

          {result.isExistingVendor && result.invitation?.existingVendor && (
            <div className="mt-4 rounded-lg bg-blue-50 p-3">
              <p className="text-sm text-blue-800">
                <strong>{result.invitation.existingVendor.name}</strong> was already
                registered on Navo and has been automatically added to your vendor network.
              </p>
            </div>
          )}

          {!result.autoAdded && (
            <div className="mt-4 rounded-lg bg-amber-50 p-3">
              <p className="text-sm text-amber-800">
                An invitation email has been sent to{' '}
                <strong>{result.invitation?.invitedEmail}</strong>. They will need to
                register and accept the invitation to join your vendor network.
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Invite Another
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('rounded-lg border bg-white p-6', className)}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
          <UserPlus className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">Invite Vendor</h3>
          <p className="text-sm text-gray-500">
            Add a new vendor to your network
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="ml-auto rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Vendor Email <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('email')}
              type="email"
              id="email"
              placeholder="vendor@company.com"
              className={cn(
                'block w-full rounded-md border pl-10 pr-3 py-2 text-sm',
                'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
                errors.email ? 'border-red-300' : 'border-gray-300'
              )}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            If this vendor is already registered, they'll be automatically added
            to your network.
          </p>
        </div>

        {/* Service Types */}
        {serviceTypes.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Approved Service Types
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Select which services you want this vendor to provide
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {serviceTypes.map((type) => {
                const isSelected = selectedServiceTypes.includes(type.id);
                return (
                  <label
                    key={type.id}
                    className={cn(
                      'cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors',
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    )}
                  >
                    <input
                      type="checkbox"
                      value={type.id}
                      {...register('serviceTypes')}
                      className="sr-only"
                    />
                    {type.name}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Message */}
        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-gray-700"
          >
            Personal Message (Optional)
          </label>
          <textarea
            {...register('message')}
            id="message"
            rows={3}
            placeholder="Add a personal message to your invitation..."
            className={cn(
              'mt-1 block w-full rounded-md border px-3 py-2 text-sm',
              'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
              errors.message ? 'border-red-300' : 'border-gray-300'
            )}
          />
          {errors.message && (
            <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white',
            'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            isSubmitting && 'cursor-not-allowed opacity-75'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send Invitation
            </>
          )}
        </button>
      </div>
    </form>
  );
}
