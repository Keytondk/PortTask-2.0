import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CTA } from '@/components/sections/cta';
import {
  Wrench,
  CheckCircle2,
  Bell,
  Zap,
  FileText,
  BarChart3,
  Star,
  Shield,
  ArrowRight,
  BadgeCheck,
  Clock,
} from 'lucide-react';

const features = [
  {
    icon: Bell,
    title: 'RFQ Notifications',
    description:
      'Get notified instantly when operators invite you to quote. Never miss an opportunity.',
  },
  {
    icon: Zap,
    title: 'Quick Quote Submission',
    description:
      'Submit quotes in minutes, not hours. Pre-filled templates and saved pricing make it easy.',
  },
  {
    icon: FileText,
    title: 'Order Management',
    description:
      'Track all your orders in one place. Know what\'s confirmed, in progress, and completed.',
  },
  {
    icon: BarChart3,
    title: 'Performance Dashboard',
    description:
      'See your win rates, response times, and customer ratings. Improve and grow your business.',
  },
  {
    icon: Star,
    title: 'Build Your Reputation',
    description:
      'Earn badges for fast responses and quality service. Stand out from the competition.',
  },
  {
    icon: Shield,
    title: 'Get Verified',
    description:
      'Upload your certifications and get verified. Operators trust verified vendors more.',
  },
];

const benefits = [
  { metric: '5x', label: 'More quote opportunities' },
  { metric: '< 2h', label: 'Average response time' },
  { metric: '40%', label: 'Higher win rate' },
  { metric: '0', label: 'Platform fees' },
];

const badges = [
  {
    icon: CheckCircle2,
    name: 'Verified',
    description: 'Email confirmed, company details validated',
    color: 'blue',
  },
  {
    icon: BadgeCheck,
    name: 'Certified',
    description: 'Documents uploaded & reviewed by Navo',
    color: 'brand',
  },
];

export default function VendorsSolutionPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-green-600 to-green-700">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 text-white text-sm font-medium rounded-full mb-6">
                <Wrench className="w-4 h-4" />
                For Service Vendors
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Win more business, grow your reputation
              </h1>
              <p className="text-xl text-green-100 mb-8">
                Connect with top maritime operators. Respond to RFQs faster,
                deliver great service, and build lasting relationships.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/demo"
                  className="btn-primary bg-white text-green-600 hover:bg-green-50"
                >
                  Join as a Vendor
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link
                  href="/contact"
                  className="btn-secondary border-white/30 text-white hover:bg-white/10"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                {/* RFQ Card Preview */}
                <div className="bg-white rounded-xl overflow-hidden">
                  <div className="bg-green-50 p-4 border-b border-green-100">
                    <div className="flex items-center gap-2 text-green-700 font-medium">
                      <Bell className="w-5 h-5" />
                      New RFQ Received
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-navy-900 text-lg mb-2">
                      Bunkering Service Required
                    </h3>
                    <p className="text-navy-600 mb-4">
                      500 MT VLSFO for MV Pacific Star at Singapore
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <div className="text-xs text-navy-500">Deadline</div>
                        <div className="font-medium text-navy-900">In 8 hours</div>
                      </div>
                      <div>
                        <div className="text-xs text-navy-500">Est. Value</div>
                        <div className="font-medium text-navy-900">$125,000</div>
                      </div>
                    </div>
                    <button className="w-full py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors">
                      Submit Quote
                    </button>
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
                <div className="text-4xl font-bold text-green-400 mb-2">
                  {benefit.metric}
                </div>
                <div className="text-navy-300">{benefit.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 mb-6">
              How vendors join Navo
            </h2>
            <p className="text-lg text-navy-600">
              Getting started is simple. Operators invite you, you sign up, and
              start receiving RFQs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="font-bold text-navy-900 mb-2">Get Invited</h3>
              <p className="text-navy-600 text-sm">
                An operator you work with invites you to their vendor network on
                Navo.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-bold text-navy-900 mb-2">Create Profile</h3>
              <p className="text-navy-600 text-sm">
                Set up your company profile, services, and ports. Get verified
                for more trust.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="font-bold text-navy-900 mb-2">Start Quoting</h3>
              <p className="text-navy-600 text-sm">
                Receive RFQ invitations, submit quotes, win orders, and grow your
                business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="py-20 bg-navy-50">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 mb-6">
              Build trust with verification badges
            </h2>
            <p className="text-lg text-navy-600">
              Verified vendors stand out to operators and win more business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {badges.map((badge) => (
              <div
                key={badge.name}
                className={`bg-white rounded-xl p-8 border-2 ${
                  badge.color === 'brand'
                    ? 'border-brand-200'
                    : 'border-blue-200'
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      badge.color === 'brand'
                        ? 'bg-brand-100 text-brand-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    <badge.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-navy-900">
                      {badge.name}
                    </h3>
                    <p className="text-navy-600 text-sm">{badge.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-navy-600 mb-4">
              Certified vendors are 3x more likely to win RFQs
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 mb-6">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-navy-600">
              Tools designed to help you respond faster, deliver better, and grow
              your maritime services business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-navy-100 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-green-600" />
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

      {/* Testimonial */}
      <section className="py-20 bg-navy-50">
        <div className="container-narrow">
          <div className="bg-white rounded-3xl p-12 border border-navy-100 text-center">
            <div className="flex justify-center mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-6 h-6 text-brand-400 fill-current"
                />
              ))}
            </div>
            <p className="text-xl lg:text-2xl text-navy-700 mb-8 leading-relaxed max-w-2xl mx-auto">
              "Since joining Navo, our RFQ response time dropped from hours to
              minutes. We've won 40% more contracts and built great relationships
              with new operators."
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                PM
              </div>
              <div className="text-left">
                <div className="font-semibold text-navy-900">Peter Martinez</div>
                <div className="text-navy-500 text-sm">
                  CEO, Pacific Marine Services
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* No Fees */}
      <section className="py-20 bg-green-600">
        <div className="container-wide">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Free for vendors. Always.
            </h2>
            <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">
              Navo is free for service vendors. No subscription fees, no
              commissions, no hidden costs. Just more business.
            </p>
            <Link
              href="/demo"
              className="btn-primary bg-white text-green-600 hover:bg-green-50"
            >
              Join the Vendor Network
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      <CTA />
      <Footer />
    </main>
  );
}
