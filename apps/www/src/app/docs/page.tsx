import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import {
  Book,
  Code,
  Rocket,
  Settings,
  Users,
  Ship,
  FileText,
  Webhook,
  Key,
  ArrowRight,
  Search,
  ExternalLink,
} from 'lucide-react';

const sections = [
  {
    icon: Rocket,
    title: 'Getting Started',
    description: 'Quick start guides to get you up and running with Navo.',
    links: [
      { title: 'Introduction', href: '/docs/introduction' },
      { title: 'Quick Start Guide', href: '/docs/quickstart' },
      { title: 'Core Concepts', href: '/docs/concepts' },
      { title: 'First Port Call', href: '/docs/first-port-call' },
    ],
  },
  {
    icon: Ship,
    title: 'Port Call Management',
    description: 'Learn how to create, manage, and track port calls.',
    links: [
      { title: 'Creating Port Calls', href: '/docs/port-calls/create' },
      { title: 'Status Workflow', href: '/docs/port-calls/workflow' },
      { title: 'Timeline Management', href: '/docs/port-calls/timeline' },
      { title: 'Agent Coordination', href: '/docs/port-calls/agents' },
    ],
  },
  {
    icon: FileText,
    title: 'Service Orders & RFQs',
    description: 'Manage vendor relationships and procurement workflows.',
    links: [
      { title: 'Creating RFQs', href: '/docs/rfqs/create' },
      { title: 'Vendor Management', href: '/docs/rfqs/vendors' },
      { title: 'Quote Comparison', href: '/docs/rfqs/quotes' },
      { title: 'Service Orders', href: '/docs/rfqs/orders' },
    ],
  },
  {
    icon: Users,
    title: 'User Management',
    description: 'Manage users, roles, and permissions across your organization.',
    links: [
      { title: 'Roles & Permissions', href: '/docs/users/roles' },
      { title: 'Workspaces', href: '/docs/users/workspaces' },
      { title: 'SSO Configuration', href: '/docs/users/sso' },
      { title: 'Audit Logs', href: '/docs/users/audit' },
    ],
  },
  {
    icon: Settings,
    title: 'Configuration',
    description: 'Customize Navo to fit your organization\'s needs.',
    links: [
      { title: 'Organization Settings', href: '/docs/config/organization' },
      { title: 'Notifications', href: '/docs/config/notifications' },
      { title: 'Custom Fields', href: '/docs/config/custom-fields' },
      { title: 'Integrations', href: '/docs/config/integrations' },
    ],
  },
  {
    icon: Code,
    title: 'API Reference',
    description: 'Complete API documentation for developers.',
    links: [
      { title: 'Authentication', href: '/docs/api/auth' },
      { title: 'Port Calls API', href: '/docs/api/port-calls' },
      { title: 'Vessels API', href: '/docs/api/vessels' },
      { title: 'Webhooks', href: '/docs/api/webhooks' },
    ],
  },
];

const popularArticles = [
  { title: 'Quick Start Guide', href: '/docs/quickstart', views: '2.4k' },
  { title: 'API Authentication', href: '/docs/api/auth', views: '1.8k' },
  { title: 'Port Call Workflow', href: '/docs/port-calls/workflow', views: '1.5k' },
  { title: 'Webhook Events', href: '/docs/api/webhooks', views: '1.2k' },
  { title: 'SSO Setup', href: '/docs/users/sso', views: '980' },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-navy-900 to-navy-800">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-brand-400 text-sm font-medium rounded-full mb-6">
              <Book className="w-4 h-4" />
              Documentation
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Learn how to use Navo
            </h1>
            <p className="text-xl text-navy-300 mb-8">
              Comprehensive guides and API documentation to help you get the
              most out of Navo.
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
              <input
                type="text"
                placeholder="Search documentation..."
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-navy-400 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 bg-navy-50 border-b border-navy-100">
        <div className="container-wide">
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <Link
              href="/docs/quickstart"
              className="flex items-center gap-2 text-navy-600 hover:text-brand-600 font-medium"
            >
              <Rocket className="w-5 h-5" />
              Quick Start
            </Link>
            <Link
              href="/docs/api"
              className="flex items-center gap-2 text-navy-600 hover:text-brand-600 font-medium"
            >
              <Code className="w-5 h-5" />
              API Reference
            </Link>
            <Link
              href="/docs/api/webhooks"
              className="flex items-center gap-2 text-navy-600 hover:text-brand-600 font-medium"
            >
              <Webhook className="w-5 h-5" />
              Webhooks
            </Link>
            <Link
              href="/docs/users/sso"
              className="flex items-center gap-2 text-navy-600 hover:text-brand-600 font-medium"
            >
              <Key className="w-5 h-5" />
              SSO Setup
            </Link>
            <a
              href="https://status.navo.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-navy-600 hover:text-brand-600 font-medium"
            >
              <ExternalLink className="w-5 h-5" />
              Status Page
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container-wide">
          <div className="grid lg:grid-cols-4 gap-12">
            {/* Documentation Sections */}
            <div className="lg:col-span-3">
              <div className="grid md:grid-cols-2 gap-8">
                {sections.map((section) => (
                  <div
                    key={section.title}
                    className="bg-white rounded-xl border border-navy-100 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                      <section.icon className="w-6 h-6 text-brand-600" />
                    </div>
                    <h2 className="text-xl font-bold text-navy-900 mb-2">
                      {section.title}
                    </h2>
                    <p className="text-navy-600 text-sm mb-4">
                      {section.description}
                    </p>
                    <ul className="space-y-2">
                      {section.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className="flex items-center gap-2 text-sm text-navy-600 hover:text-brand-600"
                          >
                            <ArrowRight className="w-4 h-4" />
                            {link.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Popular Articles */}
              <div className="bg-navy-50 rounded-xl p-6 mb-8">
                <h3 className="font-bold text-navy-900 mb-4">Popular Articles</h3>
                <ul className="space-y-3">
                  {popularArticles.map((article) => (
                    <li key={article.href}>
                      <Link
                        href={article.href}
                        className="flex items-center justify-between text-sm hover:text-brand-600"
                      >
                        <span className="text-navy-700">{article.title}</span>
                        <span className="text-navy-400">{article.views}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* API Box */}
              <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-xl p-6 text-white">
                <Code className="w-8 h-8 text-brand-400 mb-4" />
                <h3 className="font-bold mb-2">API Reference</h3>
                <p className="text-navy-300 text-sm mb-4">
                  Full REST API documentation with examples in multiple languages.
                </p>
                <Link
                  href="/docs/api"
                  className="inline-flex items-center gap-2 text-brand-400 font-medium text-sm hover:text-brand-300"
                >
                  View API Docs
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Help */}
              <div className="mt-8 p-6 border border-navy-100 rounded-xl">
                <h3 className="font-bold text-navy-900 mb-2">Need Help?</h3>
                <p className="text-navy-600 text-sm mb-4">
                  Can't find what you're looking for? Our support team is here to
                  help.
                </p>
                <Link
                  href="/contact"
                  className="text-brand-600 font-medium text-sm hover:text-brand-700"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
