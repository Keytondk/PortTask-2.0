import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CTA } from '@/components/sections/cta';
import {
  Anchor,
  Globe,
  Users,
  Target,
  Heart,
  Zap,
  Shield,
  Linkedin,
  Twitter,
} from 'lucide-react';

const values = [
  {
    icon: Target,
    title: 'Customer Obsessed',
    description:
      'We build for our customers. Every feature, every decision starts with understanding their needs.',
  },
  {
    icon: Zap,
    title: 'Move Fast',
    description:
      'Maritime operations don\'t wait. We ship quickly, iterate constantly, and stay ahead of the industry.',
  },
  {
    icon: Shield,
    title: 'Trust & Reliability',
    description:
      'When operations depend on us, we deliver. 99.9% uptime isn\'t a goal—it\'s a commitment.',
  },
  {
    icon: Heart,
    title: 'Simplicity',
    description:
      'Complex problems deserve simple solutions. We make powerful software that\'s easy to use.',
  },
];

const team = [
  {
    name: 'Alexandra Chen',
    role: 'CEO & Co-Founder',
    bio: 'Former VP Operations at Maersk. 15 years in maritime logistics.',
    image: null,
  },
  {
    name: 'Marcus Thompson',
    role: 'CTO & Co-Founder',
    bio: 'Previously engineering lead at Flexport. Built systems handling $1B+ in cargo.',
    image: null,
  },
  {
    name: 'Sarah Andersen',
    role: 'VP Product',
    bio: 'Former product director at Vessel. Passionate about maritime digitization.',
    image: null,
  },
  {
    name: 'James Okonkwo',
    role: 'VP Engineering',
    bio: '10+ years building enterprise SaaS. Previously at Stripe and Twilio.',
    image: null,
  },
  {
    name: 'Elena Rodriguez',
    role: 'VP Customer Success',
    bio: '12 years in maritime operations. Expert in port agency workflows.',
    image: null,
  },
  {
    name: 'David Kim',
    role: 'VP Sales',
    bio: 'Built sales teams at 3 maritime tech startups. Deep industry relationships.',
    image: null,
  },
];

const milestones = [
  { year: '2021', event: 'Navo founded in Singapore' },
  { year: '2022', event: 'Launched first product, 50 customers' },
  { year: '2023', event: 'Series A funding, expanded to Europe' },
  { year: '2024', event: '500+ customers, 50K+ monthly port calls' },
  { year: '2025', event: 'Global expansion, enterprise features' },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-navy-900 to-navy-800">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-brand-400 text-sm font-medium rounded-full mb-6">
              <Anchor className="w-4 h-4" />
              About Navo
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              Building the operating system for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-500">
                maritime operations
              </span>
            </h1>
            <p className="text-xl text-navy-300 max-w-2xl mx-auto">
              We're on a mission to digitize the $14 trillion maritime industry,
              starting with the daily operations that keep global trade moving.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-navy-600 mb-6">
                90% of global trade moves by sea, yet maritime operations still
                rely on spreadsheets, emails, and phone calls. We're changing
                that.
              </p>
              <p className="text-lg text-navy-600 mb-6">
                Navo brings modern software to port call management, service
                ordering, and vessel tracking—helping maritime professionals
                work smarter, not harder.
              </p>
              <p className="text-lg text-navy-600">
                Our platform handles thousands of port calls daily, connecting
                operators, agents, and vendors in a seamless digital workflow.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-navy-50 rounded-xl p-8 text-center">
                <Globe className="w-10 h-10 text-brand-500 mx-auto mb-4" />
                <div className="text-4xl font-bold text-navy-900 mb-2">40+</div>
                <div className="text-navy-600">Countries</div>
              </div>
              <div className="bg-navy-50 rounded-xl p-8 text-center">
                <Users className="w-10 h-10 text-brand-500 mx-auto mb-4" />
                <div className="text-4xl font-bold text-navy-900 mb-2">500+</div>
                <div className="text-navy-600">Companies</div>
              </div>
              <div className="bg-navy-50 rounded-xl p-8 text-center">
                <Anchor className="w-10 h-10 text-brand-500 mx-auto mb-4" />
                <div className="text-4xl font-bold text-navy-900 mb-2">128</div>
                <div className="text-navy-600">Ports</div>
              </div>
              <div className="bg-navy-50 rounded-xl p-8 text-center">
                <Target className="w-10 h-10 text-brand-500 mx-auto mb-4" />
                <div className="text-4xl font-bold text-navy-900 mb-2">50K+</div>
                <div className="text-navy-600">Port Calls/Month</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-navy-50">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 mb-6">
              Our Values
            </h2>
            <p className="text-lg text-navy-600">
              The principles that guide everything we do at Navo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white rounded-xl p-6 border border-navy-100"
              >
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-navy-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 mb-6">
              Our Journey
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-px bg-navy-200" />
              {milestones.map((milestone, index) => (
                <div key={milestone.year} className="relative flex gap-8 pb-8">
                  <div className="w-16 h-16 bg-brand-500 rounded-full flex items-center justify-center text-white font-bold z-10">
                    {milestone.year}
                  </div>
                  <div className="flex-1 pt-4">
                    <p className="text-lg text-navy-700">{milestone.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-navy-50">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 mb-6">
              Leadership Team
            </h2>
            <p className="text-lg text-navy-600">
              Industry veterans and tech experts building the future of maritime
              operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-xl p-6 border border-navy-100"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
                  {member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <h3 className="text-lg font-bold text-navy-900">{member.name}</h3>
                <p className="text-brand-600 text-sm mb-3">{member.role}</p>
                <p className="text-navy-600 text-sm mb-4">{member.bio}</p>
                <div className="flex gap-3">
                  <a
                    href="#"
                    className="text-navy-400 hover:text-navy-600 transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="text-navy-400 hover:text-navy-600 transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Careers CTA */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Join Our Team
            </h2>
            <p className="text-navy-300 mb-8 max-w-xl mx-auto">
              We're always looking for talented people who are passionate about
              maritime and technology. See our open positions.
            </p>
            <a
              href="/careers"
              className="btn-primary inline-flex items-center gap-2"
            >
              View Open Positions
            </a>
          </div>
        </div>
      </section>

      <CTA />
      <Footer />
    </main>
  );
}
