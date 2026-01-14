'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Anchor, Eye, EyeOff, Loader2, Lock, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';

const resetPasswordSchema = z
  .object({
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

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('password', '');

  // Password strength indicators
  const hasMinLength = password.length >= 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSuccess(true);
    setIsLoading(false);
  };

  // Invalid or missing token
  if (!token) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
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
                Invalid or expired link
              </h2>
              <p className="text-blue-200/80 text-center mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link
                href="/forgot-password"
                className="relative w-full block group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl transition-all duration-300 
                              group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]" />
                <div className="relative py-3.5 px-4 text-center text-white font-semibold">
                  Request new link
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
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.2),rgba(255,255,255,0))]" />
      </div>

      {/* Floating shapes */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Main content */}
      <div className="relative w-full max-w-md z-10">
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

          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
            {isSuccess ? (
              // Success state
              <div className="text-center animate-fade-in">
                <div className="w-16 h-16 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-300" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Password reset successful
                </h2>
                <p className="text-blue-200/80 mb-6">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
                <Link
                  href="/login"
                  className="relative block group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl transition-all duration-300 
                                group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl opacity-0 
                                group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative py-3.5 px-4 text-center text-white font-semibold">
                    Sign in
                  </div>
                </Link>
              </div>
            ) : (
              // Form state
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-blue-300" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Set new password
                  </h2>
                  <p className="text-blue-200/80">
                    Your new password must be different from previously used passwords
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Password field */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-blue-100">
                      New password
                    </label>
                    <div className="relative">
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        className="w-full px-4 py-3.5 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/40 
                                 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/10
                                 transition-all duration-300"
                        placeholder="Enter new password"
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

                    {/* Password requirements */}
                    <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-xs font-semibold text-blue-200 mb-2">Password requirements:</p>
                      <div className="space-y-1 text-xs">
                        <div className={`flex items-center gap-2 ${hasMinLength ? 'text-green-300' : 'text-blue-300/40'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-green-400' : 'bg-blue-300/30'}`} />
                          At least 12 characters
                        </div>
                        <div className={`flex items-center gap-2 ${hasUppercase ? 'text-green-300' : 'text-blue-300/40'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${hasUppercase ? 'bg-green-400' : 'bg-blue-300/30'}`} />
                          One uppercase letter
                        </div>
                        <div className={`flex items-center gap-2 ${hasLowercase ? 'text-green-300' : 'text-blue-300/40'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${hasLowercase ? 'bg-green-400' : 'bg-blue-300/30'}`} />
                          One lowercase letter
                        </div>
                        <div className={`flex items-center gap-2 ${hasNumber ? 'text-green-300' : 'text-blue-300/40'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-green-400' : 'bg-blue-300/30'}`} />
                          One number
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-blue-100">
                      Confirm new password
                    </label>
                    <div className="relative">
                      <input
                        {...register('confirmPassword')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        className="w-full px-4 py-3.5 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/40 
                                 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/10
                                 transition-all duration-300"
                        placeholder="Confirm new password"
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
                          <span>Resetting password...</span>
                        </>
                      ) : (
                        <>
                          <span>Reset password</span>
                          <KeyRound className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </>
                      )}
                    </div>
                  </button>
                </form>
              </>
            )}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-900"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
