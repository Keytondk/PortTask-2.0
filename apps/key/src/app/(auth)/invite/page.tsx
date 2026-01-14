'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Anchor,
  Eye,
  EyeOff,
  Loader2,
  Users,
  AlertCircle,
  Building2,
  Mail,
  UserCheck,
  Shield,
} from 'lucide-react';

const inviteSignupSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    password: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type InviteSignupFormData = z.infer<typeof inviteSignupSchema>;

// Mock invite data - would come from API based on token
const getInviteData = (token: string | null) => {
  if (!token) return null;
  return {
    email: 'john.smith@shipping.com',
    organization: 'Pacific Shipping Co.',
    role: 'Operations Manager',
    invitedBy: 'Sarah Admin',
  };
};

function InviteSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const inviteData = getInviteData(token);

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<InviteSignupFormData>({
    resolver: zodResolver(inviteSignupSchema),
  });

  const password = watch('password', '');

  // Password strength indicators
  const hasMinLength = password.length >= 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const onSubmit = async (data: InviteSignupFormData) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    router.push('/');
  };

  // Invalid or missing token
  if (!inviteData) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.2),rgba(255,255,255,0))]" />
        </div>

        <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-pulse" />

        <div className="relative w-full max-w-md z-10">
          <div className="flex flex-col items-center mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl blur-xl opacity-60" />
                <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Anchor className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Navo
                </h1>
                <p className="text-xs text-blue-300/80 font-medium tracking-wide">Maritime Operations Platform</p>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur opacity-30" />

            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
              <div className="w-16 h-16 bg-red-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-300" />
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                Invalid invitation link
              </h2>
              <p className="text-blue-200/80 text-center mb-6">
                This invitation link is invalid or has expired. Please contact your
                organization administrator to request a new invitation.
              </p>
              <Link
                href="/login"
                className="relative w-full block group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl transition-all duration-300 
                              group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl opacity-0 
                              group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative py-3.5 px-4 text-center text-white font-semibold">
                  Go to sign in
                </div>
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-blue-300/50 mt-8">
            &copy; {new Date().getFullYear()} Navo. All rights reserved.
          </p>
        </div>

        <style jsx global>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.2),rgba(255,255,255,0))]" />
      </div>

      {/* Floating shapes */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Main content */}
      <div className="relative w-full max-w-2xl z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl blur-xl opacity-60" />
              <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <Anchor className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Navo
              </h1>
              <p className="text-xs text-blue-300/80 font-medium tracking-wide">Maritime Operations Platform</p>
            </div>
          </div>
        </div>

        {/* Glassmorphic card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />

          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 transition-all duration-300">
            {/* Header with icon */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-300" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                You&apos;ve been invited
              </h2>
              <p className="text-blue-200/80">
                Complete your profile to join your team
              </p>
            </div>

            {/* Invite details */}
            <div className="mb-8 p-5 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-300" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-blue-300/70 font-medium uppercase tracking-wide">
                    Organization
                  </p>
                  <p className="font-semibold text-white text-lg">
                    {inviteData.organization}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-cyan-300" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-blue-300/70 font-medium uppercase tracking-wide">Email</p>
                  <p className="font-semibold text-white">
                    {inviteData.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-300" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-blue-300/70 font-medium uppercase tracking-wide">Role</p>
                  <p className="font-semibold text-white">
                    {inviteData.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="block text-sm font-semibold text-blue-100">
                    First name
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    id="firstName"
                    autoComplete="given-name"
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/40 
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/10
                             transition-all duration-300"
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-300 font-medium mt-1.5">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="block text-sm font-semibold text-blue-100">
                    Last name
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    id="lastName"
                    autoComplete="family-name"
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/40 
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/10
                             transition-all duration-300"
                    placeholder="Smith"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-300 font-medium mt-1.5">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-blue-100">
                  Create password
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="w-full px-4 py-3.5 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/40 
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/10
                             transition-all duration-300"
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-blue-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-300 font-medium mt-1.5">{errors.password.message}</p>
                )}

                {/* Password strength */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center gap-2 ${hasMinLength ? 'text-green-300' : 'text-blue-300/40'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-green-400' : 'bg-blue-300/30'}`} />
                    12+ characters
                  </div>
                  <div className={`flex items-center gap-2 ${hasUppercase ? 'text-green-300' : 'text-blue-300/40'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${hasUppercase ? 'bg-green-400' : 'bg-blue-300/30'}`} />
                    Uppercase
                  </div>
                  <div className={`flex items-center gap-2 ${hasLowercase ? 'text-green-300' : 'text-blue-300/40'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${hasLowercase ? 'bg-green-400' : 'bg-blue-300/30'}`} />
                    Lowercase
                  </div>
                  <div className={`flex items-center gap-2 ${hasNumber ? 'text-green-300' : 'text-blue-300/40'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-green-400' : 'bg-blue-300/30'}`} />
                    Number
                  </div>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-blue-100">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className="w-full px-4 py-3.5 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/40 
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/10
                             transition-all duration-300"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-blue-200 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-300 font-medium mt-1.5">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 
                           focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
                <label htmlFor="terms" className="text-sm text-blue-200/80">
                  I agree to the{' '}
                  <Link href="/terms" className="text-blue-300 hover:text-blue-200 font-semibold transition-colors">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-300 hover:text-blue-200 font-semibold transition-colors">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full mt-6 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl transition-all duration-300 
                              group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] group-disabled:opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl opacity-0 
                              group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative py-3.5 px-4 flex items-center justify-center gap-2 text-white font-semibold">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create account & join team</span>
                      <UserCheck className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-center text-sm text-blue-200/70">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-blue-300 hover:text-blue-200 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-center text-sm text-blue-300/50 mt-8">
          &copy; {new Date().getFullYear()} Navo. All rights reserved.
        </p>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}

export default function InviteSignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-900"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <InviteSignupContent />
    </Suspense>
  );
}
