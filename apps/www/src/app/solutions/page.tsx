import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CTA } from '@/components/sections/cta';
import { ArrowRight, Users, Ship, Wrench } from 'lucide-react';

const solutions = [
  {
    icon: Users,
    title: 'For Port Agents',
    description:
      'Streamline husbandry operations, coordinate with principals, and manage multiple port calls efficiently.',
    href: '/solutions/agents',
    features: [
      'Multi-principal management',
      'Real-time status updates',
      'Document handling',
      'Vendor coordination',
    ],
    color: 'brand',
  },
  {
    icon: Ship,
    title: 'For Ship Operators',
    description:
      'Gain complete visibility over your fleet operations, from port calls to service procurement.',
    href: '/solutions/operators',
    features: [
      'Fleet-wide visibility',
      'Cost tracking & analytics',
      'Vendor performance insights',
      'Approval workflows',
    ],
    color: 'blue',
  },
  {
    icon: Wrench,
    title: 'For Service Vendors',
    description:
      'Win more business, respond to RFQs faster, and build lasting relationships with operators.',
    href: '/solutions/vendors',
    features: [
      'RFQ notifications',
      'Quick quote submission',
      'Order management',
      'Performance tracking',
    ],
    color: 'green',
  },
];

const colorClasses = {
  brand: {
    bg: 'bg-brand-50',
    icon: 'bg-brand-100 text-brand-600',
    border: 'border-brand-200',
    button: 'bg-brand-500 hover:bg-brand-600',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    border: 'border-blue-200',
    button: 'bg-blue-500 hover:bg-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-600',
    border: 'border-green-200',
    button: 'bg-green-500 hover:bg-green-600',
  },
};

export default function SolutionsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-navy-900 to-navy-800">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              Solutions for every role in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-500">
                maritime operations
              </span>
            </h1>
            <p className="text-xl text-navy-300 max-w-2xl mx-auto">
              Whether you're an agent, operator, or vendor, Navo has the tools
              you need to streamline your work and grow your business.
            </p>
          </div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="grid lg:grid-cols-3 gap-8">
            {solutions.map((solution) => {
              const colors = colorClasses[solution.color as keyof typeof colorClasses];
              return (
                <div
                  key={solution.title}
                  className={`rounded-2xl border ${colors.border} ${colors.bg} p-8 hover:shadow-xl transition-shadow`}
                >
                  <div
                    className={`w-14 h-14 rounded-xl ${colors.icon} flex items-center justify-center mb-6`}
                  >
                    <solution.icon className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-bold text-navy-900 mb-4">
                    {solution.title}
                  </h2>
                  <p className="text-navy-600 mb-6">{solution.description}</p>
                  <ul className="space-y-3 mb-8">
                    {solution.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-navy-700"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-navy-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={solution.href}
                    className={`inline-flex items-center gap-2 px-6 py-3 ${colors.button} text-white font-semibold rounded-lg transition-colors`}
                  >
                    Learn More
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-navy-50">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 mb-6">
              One platform, infinite possibilities
            </h2>
            <p className="text-lg text-navy-600">
              See how different teams use Navo to transform their operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Port Call Coordination',
                description:
                  'Coordinate arrivals, berths, and departures across your entire fleet.',
              },
              {
                title: 'Vendor Procurement',
                description:
                  'Find the best vendors, compare quotes, and manage orders seamlessly.',
              },
              {
                title: 'Fleet Tracking',
                description:
                  'Real-time AIS tracking and historical route analysis for your vessels.',
              },
              {
                title: 'Cost Management',
                description:
                  'Track port call costs, analyze trends, and optimize spending.',
              },
              {
                title: 'Compliance & Documentation',
                description:
                  'Manage certificates, port clearances, and regulatory documents.',
              },
              {
                title: 'Performance Analytics',
                description:
                  'Measure KPIs, benchmark vendors, and identify improvement opportunities.',
              },
            ].map((useCase) => (
              <div
                key={useCase.title}
                className="bg-white rounded-xl p-6 border border-navy-100"
              >
                <h3 className="font-bold text-navy-900 mb-2">{useCase.title}</h3>
                <p className="text-navy-600 text-sm">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTA />
      <Footer />
    </main>
  );
}
