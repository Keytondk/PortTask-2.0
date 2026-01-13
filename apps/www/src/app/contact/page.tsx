'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import {
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Clock,
  CheckCircle2,
  Loader2,
  Send,
} from 'lucide-react';

const offices = [
  {
    city: 'Singapore',
    address: '1 Raffles Place, #20-61',
    country: 'Singapore 048616',
    phone: '+65 6123 4567',
    email: 'singapore@navo.io',
    isPrimary: true,
  },
  {
    city: 'Rotterdam',
    address: 'Wilhelminakade 123',
    country: '3072 AP Rotterdam, Netherlands',
    phone: '+31 10 123 4567',
    email: 'rotterdam@navo.io',
    isPrimary: false,
  },
  {
    city: 'Houston',
    address: '1000 Louisiana Street, Suite 1500',
    country: 'Houston, TX 77002, USA',
    phone: '+1 713 123 4567',
    email: 'houston@navo.io',
    isPrimary: false,
  },
];

const contactReasons = [
  { value: 'sales', label: 'Sales Inquiry' },
  { value: 'support', label: 'Technical Support' },
  { value: 'partnership', label: 'Partnership Opportunity' },
  { value: 'press', label: 'Press & Media' },
  { value: 'careers', label: 'Careers' },
  { value: 'other', label: 'Other' },
];

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    reason: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
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

      {/* Hero */}
      <section className="pt-32 pb-16 bg-navy-50">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-navy-900 mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-navy-600">
              Have questions? We'd love to hear from you. Send us a message and
              we'll respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20">
        <div className="container-wide">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold text-navy-900 mb-6">
                Contact Information
              </h2>

              <div className="space-y-6 mb-12">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-900">Email</h3>
                    <a
                      href="mailto:hello@navo.io"
                      className="text-navy-600 hover:text-brand-600"
                    >
                      hello@navo.io
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-900">Live Chat</h3>
                    <p className="text-navy-600">Available on our platform</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-900">Response Time</h3>
                    <p className="text-navy-600">Within 24 hours</p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-navy-900 mb-4">
                Our Offices
              </h3>
              <div className="space-y-6">
                {offices.map((office) => (
                  <div
                    key={office.city}
                    className={`p-4 rounded-xl border ${
                      office.isPrimary
                        ? 'border-brand-200 bg-brand-50'
                        : 'border-navy-100 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-brand-500" />
                      <h4 className="font-semibold text-navy-900">
                        {office.city}
                        {office.isPrimary && (
                          <span className="ml-2 text-xs bg-brand-500 text-white px-2 py-0.5 rounded-full">
                            HQ
                          </span>
                        )}
                      </h4>
                    </div>
                    <p className="text-sm text-navy-600 mb-1">{office.address}</p>
                    <p className="text-sm text-navy-600 mb-2">{office.country}</p>
                    <p className="text-sm text-navy-500">{office.phone}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-navy-200 p-8">
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-navy-900 mb-4">
                      Message Sent!
                    </h2>
                    <p className="text-navy-600 mb-8">
                      Thank you for reaching out. We'll get back to you within 24
                      hours.
                    </p>
                    <button
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({
                          name: '',
                          email: '',
                          company: '',
                          reason: '',
                          message: '',
                        });
                      }}
                      className="btn-secondary"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-navy-900 mb-2">
                      Send us a Message
                    </h2>
                    <p className="text-navy-500 mb-8">
                      Fill out the form below and we'll get back to you shortly.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-navy-700 mb-2">
                            Your Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-navy-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-navy-700 mb-2">
                            Email Address *
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
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-navy-700 mb-2">
                            Company
                          </label>
                          <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-navy-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-navy-700 mb-2">
                            Reason for Contact *
                          </label>
                          <select
                            name="reason"
                            required
                            value={formData.reason}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-navy-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          >
                            <option value="">Select a reason</option>
                            {contactReasons.map((reason) => (
                              <option key={reason.value} value={reason.value}>
                                {reason.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-2">
                          Message *
                        </label>
                        <textarea
                          name="message"
                          required
                          rows={6}
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Tell us how we can help..."
                          className="w-full px-4 py-3 border border-navy-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary py-4 px-8 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            Send Message
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
