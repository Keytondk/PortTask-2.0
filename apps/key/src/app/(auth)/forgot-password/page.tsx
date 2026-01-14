'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Anchor, ArrowLeft, Loader2, Mail, CheckCircle, Send } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmittedEmail(data.email);
    setIsSubmitted(true);
    setIsLoading(false);
  };

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
            {isSubmitted ? (
              // Success state
              <div className="text-center animate-fade-in">
                <div className="w-16 h-16 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-300" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Check your email
                </h2>
                <p className="text-blue-200/80 mb-2">
                  We&apos;ve sent password reset instructions to
                </p>
                <p className="font-semibold text-white text-lg mb-6">
                  {submittedEmail}
                </p>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-6">
                  <p className="text-sm text-blue-200/70">
                    Didn&apos;t receive the email? Check your spam folder, or{' '}
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="text-blue-300 hover:text-blue-200 font-semibold transition-colors"
                    >
                      try another email address
                    </button>
                  </p>
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 font-semibold transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Link>
              </div>
            ) : (
              // Form state
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-blue-300" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Forgot your password?
                  </h2>
                  <p className="text-blue-200/80">
                    No worries, we&apos;ll send you reset instructions
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-blue-100">
                      Email address
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      id="email"
                      autoComplete="email"
                      className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/40 
                               focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/10
                               transition-all duration-300"
                      placeholder="you@company.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-300 font-medium mt-1.5">{errors.email.message}</p>
                    )}
                  </div>

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
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <span>Send reset instructions</span>
                          <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </>
                      )}
                    </div>
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 text-sm text-blue-200/70 hover:text-blue-100 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to sign in
                  </Link>
                </div>
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
