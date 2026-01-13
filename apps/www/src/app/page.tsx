import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/sections/hero';
import { LogoCloud } from '@/components/sections/logo-cloud';
import { Features } from '@/components/sections/features';
import { HowItWorks } from '@/components/sections/how-it-works';
import { Integrations } from '@/components/sections/integrations';
import { Testimonials } from '@/components/sections/testimonials';
import { Stats } from '@/components/sections/stats';
import { Pricing } from '@/components/sections/pricing';
import { CTA } from '@/components/sections/cta';
import { FAQ } from '@/components/sections/faq';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <LogoCloud />
      <Features />
      <HowItWorks />
      <Stats />
      <Integrations />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
