import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const integrations = [
  {
    category: 'AIS Providers',
    items: ['MarineTraffic', 'VesselFinder', 'Spire', 'Pole Star'],
  },
  {
    category: 'Communication',
    items: ['Email (SMTP)', 'Slack', 'Microsoft Teams', 'Webhooks'],
  },
  {
    category: 'Storage',
    items: ['AWS S3', 'Google Cloud', 'Azure Blob', 'MinIO'],
  },
  {
    category: 'Enterprise',
    items: ['SSO/SAML', 'Active Directory', 'Okta', 'Custom API'],
  },
];

export function Integrations() {
  return (
    <section id="integrations" className="section-padding bg-white">
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 text-sm font-medium rounded-full mb-4">
              Integrations
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-6">
              Connects with your{' '}
              <span className="gradient-text">existing tools</span>
            </h2>
            <p className="text-lg text-navy-600 mb-8">
              Navo integrates seamlessly with the systems you already use. From
              AIS providers to enterprise SSO, we&apos;ve got you covered.
            </p>
            <Link
              href="/integrations"
              className="inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700"
            >
              View all integrations
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Right Content - Integration Grid */}
          <div className="grid sm:grid-cols-2 gap-6">
            {integrations.map((category) => (
              <div
                key={category.category}
                className="bg-navy-50 rounded-xl p-6 border border-navy-100"
              >
                <h3 className="font-semibold text-navy-900 mb-4">
                  {category.category}
                </h3>
                <ul className="space-y-2">
                  {category.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-navy-600"
                    >
                      <div className="w-2 h-2 rounded-full bg-brand-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
