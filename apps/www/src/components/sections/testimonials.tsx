'use client';

import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote:
      "Navo transformed our port operations. We've reduced coordination time by 60% and our vendors now respond within hours instead of days.",
    author: 'Sarah Chen',
    role: 'Head of Operations',
    company: 'Pacific Shipping Lines',
    image: null,
  },
  {
    quote:
      "The real-time vessel tracking combined with automated RFQ management has been a game-changer. Our team can now manage twice the port calls with the same headcount.",
    author: 'Marcus Thompson',
    role: 'Fleet Manager',
    company: 'Atlantic Maritime Corp',
    image: null,
  },
  {
    quote:
      "Implementation was incredibly smooth. The Navo team understood our requirements from day one and we were fully operational within two weeks.",
    author: 'Elena Rodriguez',
    role: 'Director of Procurement',
    company: 'Global Vessel Management',
    image: null,
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="section-padding bg-navy-50">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 text-sm font-medium rounded-full mb-4">
            Customer Stories
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy-900 mb-6">
            Trusted by{' '}
            <span className="gradient-text">maritime leaders</span>
          </h2>
          <p className="text-lg text-navy-600">
            See how leading maritime companies are transforming their operations
            with Navo.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 border border-navy-100 shadow-sm hover:shadow-lg transition-shadow relative"
            >
              <Quote className="w-10 h-10 text-brand-200 absolute top-6 right-6" />
              <div className="flex items-center gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="w-5 h-5 text-brand-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-navy-700 mb-6 leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-navy-900">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-navy-500">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Case Study CTA */}
        <div className="mt-12 text-center">
          <a
            href="/case-studies"
            className="inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700"
          >
            Read our case studies
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
