'use client';

import Link from 'next/link';
import { ArrowRight, Play, Ship, MapPin, Clock } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />

      <div className="container-wide relative z-10 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-brand-400 text-sm font-medium mb-8 border border-white/10">
              <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
              Trusted by 500+ maritime companies worldwide
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Maritime Operations,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-500">
                Simplified
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-navy-300 mb-8 max-w-xl mx-auto lg:mx-0">
              The enterprise-grade platform for port call management, service ordering,
              and real-time vessel tracking. Built for operations that run at scale.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link href="/demo" className="btn-primary group">
                Request a Demo
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30">
                <Play className="w-5 h-5 mr-2" />
                Watch Video
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-6 justify-center lg:justify-start text-navy-400 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-400 to-navy-600 border-2 border-navy-900"
                    />
                  ))}
                </div>
                <span>2,500+ users</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg
                    key={i}
                    className="w-4 h-4 text-brand-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span>4.9/5 rating</span>
              </div>
            </div>
          </div>

          {/* Right Content - Dashboard Preview */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-navy-800 to-navy-900 rounded-2xl border border-white/10 p-1 shadow-2xl">
              {/* Dashboard Header */}
              <div className="bg-navy-800/80 rounded-t-xl px-4 py-3 flex items-center gap-2 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 text-center text-sm text-navy-400">
                  app.navo.io
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 space-y-4">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Active Port Calls', value: '47', icon: Ship },
                    { label: 'Ports Covered', value: '128', icon: MapPin },
                    { label: 'Avg Response', value: '< 2h', icon: Clock },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-navy-700/50 rounded-lg p-4 border border-white/5"
                    >
                      <stat.icon className="w-5 h-5 text-brand-400 mb-2" />
                      <div className="text-2xl font-bold text-white">
                        {stat.value}
                      </div>
                      <div className="text-xs text-navy-400">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Map Preview */}
                <div className="bg-navy-700/30 rounded-lg aspect-video border border-white/5 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-brand-500/10" />
                  <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-brand-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                  <span className="text-navy-500 text-sm">Live Fleet Map</span>
                </div>

                {/* Activity Row */}
                <div className="flex gap-4">
                  <div className="flex-1 bg-navy-700/50 rounded-lg p-3 border border-white/5">
                    <div className="text-xs text-navy-400 mb-1">
                      Latest Activity
                    </div>
                    <div className="text-sm text-white">
                      MV Pacific Star arrived at Singapore
                    </div>
                  </div>
                  <div className="bg-brand-500/20 rounded-lg p-3 border border-brand-500/30 flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <div className="text-xs text-brand-300">
                      Pending
                      <br />
                      Approvals
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="absolute -left-8 top-1/4 bg-white rounded-xl shadow-xl p-4 border border-navy-100 animate-float" style={{ animationDelay: '-2s' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-navy-900">Berth Confirmed</div>
                  <div className="text-xs text-navy-500">Terminal 4, Berth 12</div>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 bottom-1/4 bg-white rounded-xl shadow-xl p-4 border border-navy-100 animate-float" style={{ animationDelay: '-4s' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-navy-900">Quote Received</div>
                  <div className="text-xs text-navy-500">$12,500 - Bunkering</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
