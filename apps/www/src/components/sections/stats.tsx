const stats = [
  {
    value: '500+',
    label: 'Maritime Companies',
    description: 'Trust Navo for their operations',
  },
  {
    value: '50K+',
    label: 'Port Calls',
    description: 'Managed every month',
  },
  {
    value: '99.9%',
    label: 'Uptime SLA',
    description: 'Enterprise-grade reliability',
  },
  {
    value: '< 2h',
    label: 'Response Time',
    description: 'Average vendor response',
  },
];

export function Stats() {
  return (
    <section className="py-20 bg-navy-900">
      <div className="container-wide">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-brand-400 mb-2">
                {stat.value}
              </div>
              <div className="text-lg font-semibold text-white mb-1">
                {stat.label}
              </div>
              <div className="text-navy-400 text-sm">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
