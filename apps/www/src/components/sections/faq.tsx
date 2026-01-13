'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

const faqs = [
  {
    question: 'How long does implementation take?',
    answer:
      'Most customers are fully operational within 2-4 weeks. Our implementation team handles data migration, integration setup, and user training. For larger enterprise deployments, we create a custom timeline based on your specific requirements.',
  },
  {
    question: 'What AIS providers do you integrate with?',
    answer:
      'We integrate with all major AIS providers including MarineTraffic, VesselFinder, Spire, and Pole Star. We can also work with your existing AIS data feeds through our flexible API.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Absolutely. Navo is SOC 2 Type II compliant with end-to-end encryption for all data in transit and at rest. We use enterprise-grade security measures including role-based access control, audit logging, and regular security assessments.',
  },
  {
    question: 'Can I integrate Navo with my existing systems?',
    answer:
      'Yes. Navo provides a comprehensive REST API and webhooks for real-time integration with your existing ERP, TMS, or custom systems. We also offer pre-built integrations with popular maritime software.',
  },
  {
    question: 'Do you offer a free trial?',
    answer:
      'We offer personalized demos and pilot programs for qualified customers. During the pilot, you can test Navo with your actual operations to ensure it meets your needs before committing.',
  },
  {
    question: 'What support do you provide?',
    answer:
      'All plans include email and chat support during business hours. Professional plans include priority support with faster response times. Enterprise customers receive 24/7 dedicated support with a named account manager.',
  },
  {
    question: 'Can Navo handle multiple workspaces or business units?',
    answer:
      'Yes. Navo is built with multi-tenancy at its core. You can create separate workspaces for different business units, regions, or client operations while maintaining centralized oversight.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer:
      'You own your data. Upon cancellation, we provide a complete data export in standard formats. We retain your data for 30 days after cancellation to allow for any final exports, then it is permanently deleted.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="section-padding bg-navy-50">
      <div className="container-narrow">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 text-sm font-medium rounded-full mb-4">
            FAQ
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-6">
            Frequently asked questions
          </h2>
          <p className="text-lg text-navy-600">
            Everything you need to know about Navo. Can&apos;t find what you&apos;re
            looking for? Contact our team.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-navy-100 overflow-hidden"
            >
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold text-navy-900">{faq.question}</span>
                <ChevronDown
                  className={clsx(
                    'w-5 h-5 text-navy-500 transition-transform',
                    openIndex === index && 'rotate-180'
                  )}
                />
              </button>
              <div
                className={clsx(
                  'overflow-hidden transition-all duration-300',
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                )}
              >
                <p className="px-6 pb-5 text-navy-600">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
