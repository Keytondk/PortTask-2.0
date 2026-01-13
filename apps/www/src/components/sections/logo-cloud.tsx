export function LogoCloud() {
  const companies = [
    'Maersk',
    'MSC',
    'CMA CGM',
    'Hapag-Lloyd',
    'Evergreen',
    'COSCO',
    'ONE',
    'Yang Ming',
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container-wide">
        <p className="text-center text-navy-500 text-sm font-medium mb-8">
          TRUSTED BY LEADING MARITIME COMPANIES
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
          {companies.map((company) => (
            <div
              key={company}
              className="text-2xl font-bold text-navy-300 hover:text-navy-400 transition-colors"
            >
              {company}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
