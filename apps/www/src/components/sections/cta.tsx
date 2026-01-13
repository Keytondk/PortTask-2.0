import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="section-padding bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="cta-grid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="30" cy="30" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-grid)" />
        </svg>
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

      <div className="container-wide relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to transform your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-500">
              maritime operations
            </span>
            ?
          </h2>
          <p className="text-xl text-navy-300 mb-10 max-w-2xl mx-auto">
            Join 500+ maritime companies already using Navo to streamline their
            port operations, reduce costs, and improve visibility.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo"
              className="btn-primary text-lg px-8 py-4 group"
            >
              Request a Demo
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/contact"
              className="btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20 text-lg px-8 py-4"
            >
              Talk to Sales
            </Link>
          </div>

          <p className="mt-8 text-navy-400 text-sm">
            No credit card required. Free pilot program available.
          </p>
        </div>
      </div>
    </section>
  );
}
