'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import {
  Anchor,
  CheckCircle2,
  Ship,
  Users,
  Calendar,
  ArrowRight,
  Loader2,
} from 'lucide-react';

const benefits = [
  'Personalized walkthrough of the platform',
  'See how Navo fits your specific operations',
  'Get answers to all your questions',
  'No commitment required',
];

const companies = [
  { name: 'Maersk', logo: null },
  { name: 'MSC', logo: null },
  { name: 'CMA CGM', logo: null },
  { name: 'Hapag-Lloyd', logo: null },
];

export default function DemoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    fleetSize: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="pt-32 pb-20">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left Content */}
            <div className="lg:sticky lg:top-32">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 text-sm font-medium rounded-full mb-6">
                <Calendar className="w-4 h-4" />
                Book a Demo
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-navy-900 mb-6">
                See Navo in action
              </h1>

              <p className="text-xl text-navy-600 mb-8">
                Get a personalized demo of how Navo can transform your maritime
                operations. Our team will show you exactly how the platform
                works for your specific needs.
              </p>

              <ul className="space-y-4 mb-12">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-navy-700">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 p-6 bg-navy-50 rounded-xl">
                <div className="text-center">
                  <Ship className="w-6 h-6 text-brand-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-navy-900">500+</div>
                  <div className="text-sm text-navy-500">Companies</div>
                </div>
                <div className="text-center">
                  <Users className="w-6 h-6 text-brand-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-navy-900">2,500+</div>
                  <div className="text-sm text-navy-500">Users</div>
                </div>
                <div className="text-center">
                  <Anchor className="w-6 h-6 text-brand-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-navy-900">128</div>
                  <div className="text-sm text-navy-500">Ports</div>
                </div>
              </div>

              {/* Trusted By */}
              <div className="mt-12">
                <p className="text-sm text-navy-500 mb-4">
                  Trusted by industry leaders
                </p>
                <div className="flex items-center gap-8">
                  {companies.map((company) => (
                    <span
                      key={company.name}
                      className="text-xl font-bold text-navy-300"
                    >
                      {company.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Content - Form */}
            <div className="bg-white rounded-2xl border border-navy-200 p-8 shadow-xl">
              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-navy-900 mb-4">
                    Thank you!
                  </h2>
                  <p className="text-navy-600 mb-8">
                    We've received your request. A member of our team will reach
                    out within 24 hours to schedule your personalized demo.
                  </p>
                  <Link href="/" className="btn-primary">
                    Back to Home
                  </Link>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-navy-900 mb-2">
                    Request a Demo
                  </h2>
                  <p className="text-navy-500 mb-8">
                    Fill out the form and we'll be in touch shortly.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          required
                          value={formData.firstName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-navy-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          required
                          value={formData.lastName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-navy-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-navy-700 mb-2">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-navy-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-navy-700 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        name="company"
                        required
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-navy-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-navy-700 mb-2">
                        Job Title *
                      </label>
                      <input
                        type="text"
                        name="jobTitle"
                        required
                        value={formData.jobTitle}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-navy-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-navy-700 mb-2">
                        Fleet Size
                      </label>
                      <select
                        name="fleetSize"
                        value={formData.fleetSize}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-navy-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      >
                        <option value="">Select fleet size</option>
                        <option value="1-10">1-10 vessels</option>
                        <option value="11-50">11-50 vessels</option>
                        <option value="51-100">51-100 vessels</option>
                        <option value="101-500">101-500 vessels</option>
                        <option value="500+">500+ vessels</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-navy-700 mb-2">
                        How can we help? (Optional)
                      </label>
                      <textarea
                        name="message"
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us about your operations and what you're looking for..."
                        className="w-full px-4 py-3 border border-navy-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-primary py-4 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Request Demo
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </button>

                    <p className="text-xs text-navy-500 text-center">
                      By submitting this form, you agree to our{' '}
                      <Link href="/privacy" className="text-brand-600 hover:underline">
                        Privacy Policy
                      </Link>{' '}
                      and{' '}
                      <Link href="/terms" className="text-brand-600 hover:underline">
                        Terms of Service
                      </Link>
                      .
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
