'use client';

import { Check, Minus } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    description: 'For growing maritime operations',
    price: 'Custom',
    period: '',
    features: [
      { name: 'Up to 50 vessels', included: true },
      { name: 'Port call management', included: true },
      { name: 'Basic vessel tracking', included: true },
      { name: 'Email notifications', included: true },
      { name: 'Standard support', included: true },
      { name: 'RFQ management', included: false },
      { name: 'Custom integrations', included: false },
      { name: 'API access', included: false },
    ],
    cta: 'Contact Sales',
    popular: false,
  },
  {
    name: 'Professional',
    description: 'For established maritime companies',
    price: 'Custom',
    period: '',
    features: [
      { name: 'Up to 200 vessels', included: true },
      { name: 'Port call management', included: true },
      { name: 'Advanced vessel tracking', included: true },
      { name: 'All notification channels', included: true },
      { name: 'Priority support', included: true },
      { name: 'RFQ management', included: true },
      { name: 'Standard integrations', included: true },
      { name: 'API access', included: true },
    ],
    cta: 'Contact Sales',
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'For large-scale global operations',
    price: 'Custom',
    period: '',
    features: [
      { name: 'Unlimited vessels', included: true },
      { name: 'Port call management', included: true },
      { name: 'Real-time AIS integration', included: true },
      { name: 'All notification channels', included: true },
      { name: '24/7 dedicated support', included: true },
      { name: 'RFQ management', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'Full API access + webhooks', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="section-padding bg-white">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 text-sm font-medium rounded-full mb-4">
            Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy-900 mb-6">
            Plans that <span className="gradient-text">scale with you</span>
          </h2>
          <p className="text-lg text-navy-600">
            Choose the plan that fits your fleet size and operational needs.
            All plans include core platform features.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? 'bg-navy-900 text-white ring-4 ring-brand-500 scale-105'
                  : 'bg-white border border-navy-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-500 text-white text-sm font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={`text-xl font-bold mb-2 ${
                    plan.popular ? 'text-white' : 'text-navy-900'
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm ${
                    plan.popular ? 'text-navy-300' : 'text-navy-500'
                  }`}
                >
                  {plan.description}
                </p>
              </div>

              <div className="mb-8">
                <span
                  className={`text-4xl font-bold ${
                    plan.popular ? 'text-white' : 'text-navy-900'
                  }`}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span
                    className={`text-sm ${
                      plan.popular ? 'text-navy-300' : 'text-navy-500'
                    }`}
                  >
                    /{plan.period}
                  </span>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature.name} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check
                        className={`w-5 h-5 flex-shrink-0 ${
                          plan.popular ? 'text-brand-400' : 'text-green-500'
                        }`}
                      />
                    ) : (
                      <Minus
                        className={`w-5 h-5 flex-shrink-0 ${
                          plan.popular ? 'text-navy-500' : 'text-navy-300'
                        }`}
                      />
                    )}
                    <span
                      className={`text-sm ${
                        feature.included
                          ? plan.popular
                            ? 'text-white'
                            : 'text-navy-700'
                          : plan.popular
                            ? 'text-navy-500'
                            : 'text-navy-400'
                      }`}
                    >
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/demo"
                className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-brand-500 hover:bg-brand-600 text-white'
                    : 'bg-navy-100 hover:bg-navy-200 text-navy-900'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Enterprise Note */}
        <div className="mt-12 text-center">
          <p className="text-navy-500">
            Need a custom solution?{' '}
            <Link
              href="/contact"
              className="text-brand-600 font-semibold hover:text-brand-700"
            >
              Let&apos;s talk
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
