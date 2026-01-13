'use client';

import {
  Card,
  Input,
  Badge,
} from '@navo/ui';
import {
  Search,
  Book,
  Video,
  MessageCircle,
  Mail,
  Phone,
  ChevronRight,
  FileText,
  Ship,
  Anchor,
  Users,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

const categories = [
  {
    title: 'Getting Started',
    icon: Book,
    articles: [
      'Quick start guide',
      'Creating your first port call',
      'Understanding the dashboard',
    ],
  },
  {
    title: 'Port Calls',
    icon: Anchor,
    articles: [
      'Managing port call lifecycle',
      'Adding services to port calls',
      'Working with timelines',
    ],
  },
  {
    title: 'Vessels',
    icon: Ship,
    articles: [
      'Adding vessels to your fleet',
      'Vessel tracking and updates',
      'Managing vessel documents',
    ],
  },
  {
    title: 'RFQs & Quotes',
    icon: FileText,
    articles: [
      'Creating an RFQ',
      'Managing vendor responses',
      'Awarding quotes',
    ],
  },
  {
    title: 'Vendors',
    icon: Users,
    articles: [
      'Adding new vendors',
      'Vendor performance tracking',
      'Rating and reviews',
    ],
  },
  {
    title: 'Account & Billing',
    icon: HelpCircle,
    articles: [
      'Managing team members',
      'Subscription and billing',
      'Security settings',
    ],
  },
];

const popularArticles = [
  { title: 'How to create a port call', views: 1234 },
  { title: 'Understanding RFQ workflow', views: 987 },
  { title: 'Adding vessels to your fleet', views: 876 },
  { title: 'Managing vendor relationships', views: 765 },
  { title: 'Export data and reports', views: 654 },
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">How can we help?</h1>
        <p className="mt-2 text-muted-foreground">
          Search our knowledge base or browse categories below
        </p>
        <div className="mx-auto mt-6 max-w-xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for help articles..."
              className="h-12 pl-12 text-base"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.title} className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <category.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{category.title}</h3>
            </div>
            <ul className="space-y-2">
              {category.articles.map((article) => (
                <li key={article}>
                  <a
                    href="#"
                    className="flex items-center justify-between rounded-lg p-2 text-sm transition-colors hover:bg-muted"
                  >
                    <span>{article}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
            <a
              href="#"
              className="mt-4 flex items-center text-sm font-medium text-primary hover:underline"
            >
              View all articles
              <ChevronRight className="ml-1 h-4 w-4" />
            </a>
          </Card>
        ))}
      </div>

      {/* Popular Articles */}
      <Card className="p-5">
        <h3 className="mb-4 font-semibold">Popular Articles</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {popularArticles.map((article, i) => (
            <a
              key={article.title}
              href="#"
              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {i + 1}
                </span>
                <span className="text-sm font-medium">{article.title}</span>
              </div>
            </a>
          ))}
        </div>
      </Card>

      {/* Contact Support */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold">Live Chat</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Chat with our support team
          </p>
          <Badge className="mt-3 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
            Online now
          </Badge>
        </Card>

        <Card className="p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
            <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold">Email Support</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            support@navo.io
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Response within 24 hours
          </p>
        </Card>

        <Card className="p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Video className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-semibold">Video Tutorials</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Learn with step-by-step guides
          </p>
          <a
            href="#"
            className="mt-2 inline-flex items-center text-xs text-primary hover:underline"
          >
            Watch tutorials
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </Card>
      </div>
    </div>
  );
}
