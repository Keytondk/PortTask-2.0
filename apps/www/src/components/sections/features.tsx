'use client';

import {
  Ship,
  MapPin,
  FileText,
  Clock,
  Users,
  BarChart3,
  Bell,
  Shield,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: Ship,
    title: 'Port Call Management',
    description:
      'Plan, track, and manage port calls with complete visibility. From ETA to departure, every stage is orchestrated seamlessly.',
    highlights: ['Real-time status tracking', 'Automated notifications', 'Timeline management'],
    color: 'brand',
  },
  {
    icon: FileText,
    title: 'Service Ordering',
    description:
      'Streamline procurement with RFQ management, vendor comparison, and automated service order creation.',
    highlights: ['RFQ automation', 'Vendor management', 'Quote comparison'],
    color: 'blue',
  },
  {
    icon: MapPin,
    title: 'Vessel Tracking',
    description:
      'Live AIS integration provides real-time vessel positions, historical tracks, and arrival predictions.',
    highlights: ['AIS integration', 'Fleet overview', 'ETA predictions'],
    color: 'green',
  },
];

const additionalFeatures = [
  {
    icon: Clock,
    title: 'Real-time Updates',
    description: 'Instant notifications and live data sync across all users and devices.',
  },
  {
    icon: Users,
    title: 'Multi-tenant',
    description: 'Secure workspace isolation with role-based access control.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Comprehensive reporting and performance insights.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Customizable alerts via email, push, and in-app.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'SOC 2 compliant with end-to-end encryption.',
  },
  {
    icon: Zap,
    title: 'API First',
    description: 'Full REST API for seamless integration.',
  },
];

const colorClasses = {
  brand: {
    bg: 'bg-brand-50',
    icon: 'text-brand-600',
    border: 'border-brand-200',
    highlight: 'bg-brand-100 text-brand-700',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-200',
    highlight: 'bg-blue-100 text-blue-700',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-200',
    highlight: 'bg-green-100 text-green-700',
  },
};

export function Features() {
  return (
    <section id="features" className="section-padding bg-white">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 text-sm font-medium rounded-full mb-4">
            Platform Features
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy-900 mb-6">
            Everything you need to run{' '}
            <span className="gradient-text">world-class operations</span>
          </h2>
          <p className="text-lg text-navy-600">
            A unified platform that brings together all your maritime operations -
            from port calls to vessel tracking to vendor management.
          </p>
        </div>

        {/* Main Features */}
        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature) => {
            const colors = colorClasses[feature.color as keyof typeof colorClasses];
            return (
              <div
                key={feature.title}
                className={`relative p-8 rounded-2xl border ${colors.border} ${colors.bg} hover:shadow-lg transition-shadow`}
              >
                <div
                  className={`w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center mb-6 border ${colors.border}`}
                >
                  <feature.icon className={`w-7 h-7 ${colors.icon}`} />
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-navy-600 mb-6">{feature.description}</p>
                <div className="flex flex-wrap gap-2">
                  {feature.highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${colors.highlight}`}
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Features Grid */}
        <div className="bg-navy-50 rounded-3xl p-8 lg:p-12">
          <h3 className="text-2xl font-bold text-navy-900 text-center mb-10">
            Plus everything else you need
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 p-4 bg-white rounded-xl border border-navy-100"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-navy-900 mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-navy-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
