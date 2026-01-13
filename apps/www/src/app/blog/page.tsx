import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Clock, ArrowRight, Tag } from 'lucide-react';

const categories = [
  { name: 'All', slug: 'all', count: 24 },
  { name: 'Product Updates', slug: 'product', count: 8 },
  { name: 'Industry Insights', slug: 'industry', count: 7 },
  { name: 'Best Practices', slug: 'best-practices', count: 5 },
  { name: 'Case Studies', slug: 'case-studies', count: 4 },
];

const featuredPost = {
  title: 'The Future of Port Call Management: 2025 Trends',
  excerpt:
    'Explore the key trends shaping port operations this year, from AI-powered predictions to automated vendor management.',
  category: 'Industry Insights',
  author: 'Alexandra Chen',
  date: 'Jan 8, 2025',
  readTime: '8 min read',
  slug: 'future-port-call-management-2025',
  image: null,
};

const posts = [
  {
    title: 'How Pacific Shipping Reduced Port Call Costs by 35%',
    excerpt:
      'A deep dive into how one of Asia\'s largest operators transformed their port operations with Navo.',
    category: 'Case Studies',
    author: 'Sarah Andersen',
    date: 'Jan 5, 2025',
    readTime: '6 min read',
    slug: 'pacific-shipping-case-study',
  },
  {
    title: 'Introducing Real-Time Vessel Tracking',
    excerpt:
      'We\'re excited to announce our new AIS integration, bringing live vessel positions to your dashboard.',
    category: 'Product Updates',
    author: 'Marcus Thompson',
    date: 'Jan 2, 2025',
    readTime: '4 min read',
    slug: 'real-time-vessel-tracking',
  },
  {
    title: '5 Common RFQ Mistakes (And How to Avoid Them)',
    excerpt:
      'Learn from the most common pitfalls in maritime procurement and how to streamline your RFQ process.',
    category: 'Best Practices',
    author: 'Elena Rodriguez',
    date: 'Dec 28, 2024',
    readTime: '5 min read',
    slug: 'rfq-mistakes-avoid',
  },
  {
    title: 'Navo SOC 2 Type II Certification Announced',
    excerpt:
      'We\'re proud to announce our SOC 2 Type II certification, reinforcing our commitment to security.',
    category: 'Product Updates',
    author: 'James Okonkwo',
    date: 'Dec 20, 2024',
    readTime: '3 min read',
    slug: 'soc2-certification',
  },
  {
    title: 'The Hidden Costs of Manual Port Operations',
    excerpt:
      'A detailed analysis of how spreadsheet-based operations impact your bottom line.',
    category: 'Industry Insights',
    author: 'David Kim',
    date: 'Dec 15, 2024',
    readTime: '7 min read',
    slug: 'hidden-costs-manual-operations',
  },
  {
    title: 'New: Automated Berth Confirmation Workflows',
    excerpt:
      'Streamline your berth confirmation process with our new automated workflow feature.',
    category: 'Product Updates',
    author: 'Sarah Andersen',
    date: 'Dec 10, 2024',
    readTime: '4 min read',
    slug: 'automated-berth-confirmation',
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-navy-50">
        <div className="container-wide">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-navy-900 mb-6">
              Navo Blog
            </h1>
            <p className="text-xl text-navy-600">
              Insights, updates, and best practices for maritime operations
              professionals.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b border-navy-100 bg-white sticky top-20 z-40">
        <div className="container-wide">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.slug}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  category.slug === 'all'
                    ? 'bg-navy-900 text-white'
                    : 'bg-navy-100 text-navy-600 hover:bg-navy-200'
                }`}
              >
                {category.name}
                <span className="ml-2 text-xs opacity-60">({category.count})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-12 bg-white">
        <div className="container-wide">
          <Link
            href={`/blog/${featuredPost.slug}`}
            className="block group"
          >
            <div className="grid lg:grid-cols-2 gap-8 items-center bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl overflow-hidden">
              <div className="aspect-video bg-navy-700 lg:order-2" />
              <div className="p-8 lg:p-12">
                <span className="inline-block px-3 py-1 bg-brand-500 text-white text-sm font-medium rounded-full mb-4">
                  {featuredPost.category}
                </span>
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4 group-hover:text-brand-400 transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-navy-300 mb-6">{featuredPost.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-navy-400">
                  <span>{featuredPost.author}</span>
                  <span>•</span>
                  <span>{featuredPost.date}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {featuredPost.readTime}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* All Posts */}
      <section className="py-12 bg-white">
        <div className="container-wide">
          <h2 className="text-2xl font-bold text-navy-900 mb-8">Latest Posts</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group"
              >
                <article className="bg-white rounded-xl border border-navy-100 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-navy-100" />
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-brand-500" />
                      <span className="text-sm text-brand-600 font-medium">
                        {post.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-navy-900 mb-2 group-hover:text-brand-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-navy-600 text-sm mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-navy-500">
                      <span>{post.date}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {post.readTime}
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* Load More */}
          <div className="mt-12 text-center">
            <button className="btn-secondary">
              Load More Posts
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-navy-50">
        <div className="container-narrow">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-navy-900 mb-4">
              Subscribe to our newsletter
            </h2>
            <p className="text-navy-600 mb-8">
              Get the latest insights and product updates delivered to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-navy-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
