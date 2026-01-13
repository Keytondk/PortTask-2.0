import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CTA } from '@/components/sections/cta';
import {
  Users,
  CheckCircle2,
  Clock,
  FileText,
  Bell,
  Globe,
  Smartphone,
  BarChart3,
  ArrowRight,
  Ship,
  MapPin,
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Multi-Principal Management',
    description:
      'Handle multiple principals from a single dashboard. Keep operations separate while maintaining a unified workflow.',
  },
  {
    icon: Clock,
    title: 'Real-Time Updates',
    description:
      'Keep principals informed with automatic status updates. No more endless email chains or phone calls.',
  },
  {
    icon: FileText,
    title: 'Document Management',
    description:
      'Store and share port documents, clearances, and certificates securely. Access everything in one place.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description:
      'Get alerted when vessels approach, services are confirmed, or action is needed. Never miss a deadline.',
  },
  {
    icon: Globe,
    title: 'Vendor Network',
    description:
      'Access your trusted vendor network. Request quotes, compare offers, and place orders instantly.',
  },
  {
    icon: Smartphone,
    title: 'Mobile Ready',
    description:
      'Manage operations on the go. Full functionality on any device, anywhere in the world.',
  },
];

const benefits = [
  { metric: '60%', label: 'Less time on coordination' },
  { metric: '3x', label: 'Faster response to principals' },
  { metric: '40%', label: 'Reduction in errors' },
  { metric: '24/7', label: 'Visibility for principals' },
];

const workflow = [
  {
    step: '01',
    title: 'Receive Port Call',
    description: 'Get notified when a principal nominates a port call. All details in one place.',
  },
  {
    step: '02',
    title: 'Coordinate Services',
    description: 'Request quotes from vendors, book services, and manage the timeline.',
  },
  {
    step: '03',
    title: 'Execute & Update',
    description: 'Track services in real-time. Principals see updates automatically.',
  },
  {
    step: '04',
    title: 'Close & Report',
    description: 'Complete the port call with full documentation and cost breakdown.',
  },
];

export default function AgentsSolutionPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-brand-600 to-brand-700">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 text-white text-sm font-medium rounded-full mb-6">
                <Users className="w-4 h-4" />
                For Port Agents
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Streamline your husbandry operations
              </h1>
              <p className="text-xl text-brand-100 mb-8">
                Manage multiple principals, coordinate vendors, and deliver
                exceptional service—all from one platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/demo"
                  className="btn-primary bg-white text-brand-600 hover:bg-brand-50"
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
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Ship className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-navy-900">MV Pacific Star</div>
                      <div className="text-sm text-navy-500">Arriving Singapore • 2h 15m</div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                      On Track
                    </span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl">
                    <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">
                      <Ship className="w-6 h-6 text-brand-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-navy-900">MV Atlantic Voyager</div>
                      <div className="text-sm text-navy-500">Alongside Berth 12 • Day 2</div>
                    </div>
                    <span className="px-3 py-1 bg-brand-100 text-brand-700 text-sm font-medium rounded-full">
                      3 Services
                    </span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Ship className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-navy-900">MV Nordic Wind</div>
                      <div className="text-sm text-navy-500">Departed Rotterdam • 4h ago</div>
                    </div>
                    <span className="px-3 py-1 bg-navy-100 text-navy-700 text-sm font-medium rounded-full">
                      Complete
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
                <div className="text-4xl font-bold text-brand-400 mb-2">
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
              Everything you need to run a modern agency
            </h2>
            <p className="text-lg text-navy-600">
              Purpose-built tools for port agents who want to deliver exceptional
              service while scaling their operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-navy-100 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-brand-600" />
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

      {/* Workflow */}
      <section className="py-20 bg-navy-50">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 mb-6">
              How it works
            </h2>
            <p className="text-lg text-navy-600">
              From nomination to completion, Navo guides you through every step.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workflow.map((step, index) => (
              <div key={step.step} className="relative">
                {index < workflow.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-navy-200 -translate-x-1/2" />
                )}
                <div className="text-5xl font-bold text-brand-200 mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-navy-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-white">
        <div className="container-narrow">
          <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-3xl p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <p className="text-xl lg:text-2xl text-white mb-8 leading-relaxed">
                "Navo has transformed how we operate. We now handle twice the
                port calls with the same team, and our principals love the
                real-time visibility."
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center text-white font-bold">
                  JL
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white">Johan Lindqvist</div>
                  <div className="text-navy-400 text-sm">
                    Managing Director, Nordic Maritime Agency
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
