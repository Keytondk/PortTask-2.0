'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown, Anchor } from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
  {
    name: 'Product',
    href: '#features',
    children: [
      { name: 'Port Call Management', href: '#features' },
      { name: 'Service Ordering', href: '#features' },
      { name: 'Vessel Tracking', href: '#features' },
      { name: 'Integrations', href: '#integrations' },
    ],
  },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Customers', href: '#testimonials' },
  { name: 'Resources', href: '#faq' },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-navy-100'
          : 'bg-transparent'
      )}
    >
      <nav className="container-wide">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center">
              <Anchor className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-navy-900">Navo</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navigation.map((item) => (
              <div key={item.name} className="relative group">
                <Link
                  href={item.href}
                  className="flex items-center gap-1 text-navy-600 hover:text-navy-900 font-medium transition-colors"
                >
                  {item.name}
                  {item.children && (
                    <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                  )}
                </Link>
                {item.children && (
                  <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="bg-white rounded-xl shadow-xl border border-navy-100 py-2 min-w-[200px]">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="block px-4 py-2 text-navy-600 hover:text-navy-900 hover:bg-navy-50 transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/login" className="btn-ghost">
              Sign In
            </Link>
            <Link href="/demo" className="btn-primary">
              Request Demo
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-navy-600 hover:text-navy-900"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-navy-100">
            {navigation.map((item) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className="block py-3 text-navy-600 hover:text-navy-900 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              </div>
            ))}
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-navy-100">
              <Link href="/login" className="btn-secondary text-center">
                Sign In
              </Link>
              <Link href="/demo" className="btn-primary text-center">
                Request Demo
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
