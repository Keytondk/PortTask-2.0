import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CTA } from '@/components/sections/cta';
import {
  Ship,
  CheckCircle2,
  BarChart3,
  Eye,
  DollarSign,
  Users,
  Shield,
  MapPin,
  ArrowRight,
  TrendingDown,
  Clock,
} from 'lucide-react';

const features = [
  {
    icon: Eye,
    title: 'Fleet-Wide Visibility',
    description:
      'See all your vessels, port calls, and services in one dashboard. Real-time status updates across your entire fleet.',
  },
  {
    icon: DollarSign,
    title: 'Cost Tracking',
    description:
      'Track port call costs by vessel, port, and service type. Identify savings opportunities and budget variances.',
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description:
      'Benchmark vendors, measure agent performance, and track KPIs that matter to your operations.',
  },
  {
    icon: Shield,
    title: 'Approval Workflows',
    description:
      'Set spending thresholds and approval chains. Control costs while empowering your team to move fast.',
  },
  {
    icon: Users,
    title: 'Vendor Management',
    description:
      'Build your approved vendor list. Compare quotes, track performance, and make data-driven decisions.',
  },
  {
    icon: MapPin,
    title: 'AIS Integration',
    description:
      'Live vessel positions and ETA predictions. Know exactly where your fleet is at all times.',
  },
];

const benefits = [
  { metric: '25%', label: 'Average cost reduction' },
  { metric: '90%', label: 'Faster procurement' },
  { metric: '100%', label: 'Visibility into operations' },
  { metric: '50%', label: 'Less admin work' },
];

const useCases = [
  {
    title: 'Container Shipping',
    description:
      'High-frequency port calls demand efficiency. Automate routine operations and focus on exceptions.',
  },
  {
    title: 'Bulk Carriers',
    description:
      'Long port stays and complex services. Manage every detail from arrival to departure.',
  },
  {
    title: 'Tanker Operations',
    description:
      'Strict compliance requirements. Document everything, automate reporting, stay compliant.',
  },
  {
    title: 'Offshore & OSV',
    description:
      'Specialized services and tight schedules. Coordinate with precision.',
  },
];

export default function OperatorsSolutionPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 text-white text-sm font-medium rounded-full mb-6">
                <Ship className="w-4 h-4" />
                For Ship Operators
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Complete visibility over your fleet operations
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                From port calls to procurement, get the insights and control you
                need to optimize costs and improve service.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/demo"
                  className="btn-primary bg-white text-blue-600 hover:bg-blue-50"
                >
                  Request Demo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link
                  href="/contact"
                  className="btn-secondary border-white/30 text-white hover:bg-white/10"
                >
                  Talk to Sales
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                {/* Dashboard Preview */}
                <div className="bg-white rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-navy-900">Fleet Overview</h3>
                    <span className="text-sm text-navy-500">Live</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">47</div>
                      <div className="text-xs text-navy-500">Active Calls</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">12</div>
                      <div className="text-xs text-navy-500">Alongside</div>
                    </div>
                    <div className="bg-brand-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-brand-600">8</div>
                      <div className="text-xs text-navy-500">Arriving Today</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <TrendingDown className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-700">
                      Port costs down 18% vs last quarter
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-navy-900">
        <div className="container-wide">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.label} className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">
                  {benefit.metric}
                </div>
                <div className="text-navy-300">{benefit.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 mb-6">
              Built for operational excellence
            </h2>
            <p className="text-lg text-navy-600">
              Every feature designed to give you more control, better insights,
              and lower costs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-navy-100 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-navy-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-navy-50">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 mb-6">
              Solutions for every fleet type
            </h2>
            <p className="text-lg text-navy-600">
              Whether you operate containers, bulk, tankers, or offshore vessels,
              Navo adapts to your needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {useCases.map((useCase) => (
              <div
                key={useCase.title}
                className="bg-white rounded-xl p-8 border border-navy-100"
              >
                <h3 className="text-xl font-bold text-navy-900 mb-3">
                  {useCase.title}
                </h3>
                <p className="text-navy-600">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator Teaser */}
      <section className="py-20 bg-white">
        <div className="container-narrow">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Calculate your ROI
                </h2>
                <p className="text-blue-100 mb-6">
                  See how much you could save with Navo. Enter your fleet size
                  and port call volume to get a personalized estimate.
                </p>
                <Link
                  href="/demo"
                  className="btn-primary bg-white text-blue-600 hover:bg-blue-50"
                >
                  Get Your ROI Estimate
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </div>
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <div className="space-y-4">
                  <div className="flex justify-between text-white">
                    <span>Avg. savings per port call</span>
                    <span className="font-bold">$1,200</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>Time saved per port call</span>
                    <span className="font-bold">4.5 hours</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>Error reduction</span>
                    <span className="font-bold">85%</span>
                  </div>
                  <div className="pt-4 border-t border-white/20 flex justify-between text-white">
                    <span className="font-semibold">Annual savings (50 vessels)</span>
                    <span className="font-bold text-xl">$720,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTA />
      <Footer />
    </main>
  );
}
