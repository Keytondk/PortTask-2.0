'use client';

import { CheckCircle2 } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Connect Your Fleet',
    description:
      'Import your vessels and connect to AIS providers for real-time tracking. Set up your ports and service requirements.',
    points: [
      'Bulk vessel import via CSV or API',
      'Automatic AIS position updates',
      'Custom port and berth configuration',
    ],
  },
  {
    number: '02',
    title: 'Plan Port Calls',
    description:
      'Create port calls with full timeline management. Coordinate with agents, terminals, and service providers seamlessly.',
    points: [
      'Visual timeline planning',
      'Agent and terminal coordination',
      'Automated status updates',
    ],
  },
  {
    number: '03',
    title: 'Order Services',
    description:
      'Request quotes from vendors, compare offers, and create service orders - all from one unified interface.',
    points: [
      'Multi-vendor RFQ management',
      'Side-by-side quote comparison',
      'One-click order creation',
    ],
  },
  {
    number: '04',
    title: 'Track & Optimize',
    description:
      'Monitor operations in real-time, receive intelligent alerts, and gain insights to continuously improve performance.',
    points: [
      'Real-time dashboards',
      'Smart notifications',
      'Performance analytics',
    ],
  },
];

export function HowItWorks() {
  return (
    <section className="section-padding bg-navy-50">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 text-sm font-medium rounded-full mb-4">
            How It Works
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy-900 mb-6">
            Get started in <span className="gradient-text">four simple steps</span>
          </h2>
          <p className="text-lg text-navy-600">
            From setup to full operations in days, not months. Our team guides you
            through every step.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-navy-200" />

          <div className="space-y-12 lg:space-y-0">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`relative lg:grid lg:grid-cols-2 lg:gap-16 ${
                  index % 2 === 1 ? 'lg:direction-rtl' : ''
                }`}
              >
                {/* Content */}
                <div
                  className={`lg:py-12 ${
                    index % 2 === 1 ? 'lg:col-start-2 lg:text-left' : 'lg:text-right'
                  }`}
                >
                  <div
                    className={`inline-block ${
                      index % 2 === 1 ? '' : 'lg:text-right'
                    }`}
                  >
                    <span className="text-5xl font-bold text-brand-500/20">
                      {step.number}
                    </span>
                    <h3 className="text-2xl font-bold text-navy-900 mt-2 mb-4">
                      {step.title}
                    </h3>
                    <p className="text-navy-600 mb-6 max-w-md">
                      {step.description}
                    </p>
                    <ul className="space-y-2">
                      {step.points.map((point) => (
                        <li
                          key={point}
                          className={`flex items-center gap-2 text-navy-700 ${
                            index % 2 === 1 ? '' : 'lg:justify-end'
                          }`}
                        >
                          {index % 2 === 1 ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                              {point}
                            </>
                          ) : (
                            <>
                              <span className="lg:order-2">{point}</span>
                              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 lg:order-1" />
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Center Dot */}
                <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-brand-500 rounded-full items-center justify-center text-white font-bold shadow-lg shadow-brand-500/30">
                  {step.number}
                </div>

                {/* Empty column for alternating layout */}
                <div className={index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
