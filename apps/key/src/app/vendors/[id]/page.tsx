'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Card,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@navo/ui';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Star,
  Phone,
  Mail,
  Globe,
  Edit,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { api, Vendor } from '@/lib/api';

interface VendorData {
  id: string;
  name: string;
  type: string;
  description: string;
  location: string;
  country: string;
  address: string;
  rating: number;
  reviewCount: number;
  services: string[];
  status: string;
  contact: {
    primary: { name: string; title: string; email: string; phone: string };
    secondary: { name: string; title: string; email: string; phone: string };
  };
  website: string;
  certifications: string[];
  bankDetails: { bank: string; accountName: string; accountNumber: string };
  stats: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    avgResponseTime: string;
    onTimeDelivery: string;
    avgRating: number;
    totalSpend: number;
  };
  createdAt: Date;
}

interface OrderData {
  id: string;
  reference: string;
  service: string;
  vessel: string;
  date: Date;
  amount: number;
  currency: string;
  status: string;
}

interface ReviewData {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: Date;
}

const statusConfig: Record<string, { color: string }> = {
  completed: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  },
  pending: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  },
  cancelled: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  },
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function VendorDetailPage() {
  const params = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [recentOrders] = useState<OrderData[]>([]);
  const [reviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVendor() {
      if (!params.id) return;

      try {
        setLoading(true);
        const response = await api.getVendor(params.id);
        const data = response.data;

        setVendor({
          id: data.id,
          name: data.name,
          type: 'Service Provider',
          description: '',
          location: '',
          country: '',
          address: '',
          rating: 4.5,
          reviewCount: 0,
          services: [],
          status: 'active',
          contact: {
            primary: { name: '', title: '', email: '', phone: '' },
            secondary: { name: '', title: '', email: '', phone: '' },
          },
          website: '',
          certifications: [],
          bankDetails: { bank: '', accountName: '', accountNumber: '' },
          stats: {
            totalOrders: 0,
            completedOrders: 0,
            cancelledOrders: 0,
            avgResponseTime: '-',
            onTimeDelivery: '-',
            avgRating: 4.5,
            totalSpend: 0,
          },
          createdAt: new Date(),
        });
      } catch (err) {
        console.error('Failed to fetch vendor:', err);
        setError('Failed to load vendor details');
      } finally {
        setLoading(false);
      }
    }

    fetchVendor();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">{error || 'Vendor not found'}</p>
        <Link href="/vendors">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/vendors"
          className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Vendors
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{vendor.name}</h1>
                <Badge
                  className={
                    vendor.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800'
                  }
                >
                  {vendor.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-muted-foreground">{vendor.type}</p>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{vendor.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{vendor.rating}</span>
                  <span className="text-muted-foreground">({vendor.reviewCount} reviews)</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" />
              Message
            </Button>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{vendor.stats.totalOrders}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">On-Time Delivery</p>
              <p className="text-2xl font-bold">{vendor.stats.onTimeDelivery}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Response</p>
              <p className="text-2xl font-bold">{vendor.stats.avgResponseTime}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spend</p>
              <p className="text-2xl font-bold">${(vendor.stats.totalSpend / 1000000).toFixed(1)}M</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* About */}
            <Card className="p-5">
              <h3 className="mb-4 font-semibold">About</h3>
              <p className="text-sm text-muted-foreground">{vendor.description}</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{vendor.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a href={vendor.website} className="text-primary hover:underline">
                    {vendor.website}
                  </a>
                </div>
              </div>
            </Card>

            {/* Services */}
            <Card className="p-5">
              <h3 className="mb-4 font-semibold">Services</h3>
              <div className="flex flex-wrap gap-2">
                {vendor.services.map((service) => (
                  <Badge key={service} variant="outline" className="text-sm">
                    {service}
                  </Badge>
                ))}
              </div>
              <h4 className="mb-2 mt-6 text-sm font-medium">Certifications</h4>
              <div className="flex flex-wrap gap-2">
                {vendor.certifications.map((cert) => (
                  <Badge key={cert} className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                    {cert}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-4 font-semibold">Recent Orders</h3>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{order.service}</p>
                        <Badge variant="outline" className="font-normal">
                          {order.reference}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.vessel} · {formatDate(order.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">
                      {formatPrice(order.amount, order.currency)}
                    </span>
                    <Badge className={statusConfig[order.status]?.color}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Customer Reviews</h3>
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="text-lg font-bold">{vendor.rating}</span>
                <span className="text-muted-foreground">({vendor.reviewCount} reviews)</span>
              </div>
            </div>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{review.author}</p>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(review.date)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-4 font-semibold">Primary Contact</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">{vendor.contact.primary.name}</p>
                  <p className="text-sm text-muted-foreground">{vendor.contact.primary.title}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${vendor.contact.primary.email}`} className="text-primary hover:underline">
                    {vendor.contact.primary.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{vendor.contact.primary.phone}</span>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="mb-4 font-semibold">Secondary Contact</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">{vendor.contact.secondary.name}</p>
                  <p className="text-sm text-muted-foreground">{vendor.contact.secondary.title}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${vendor.contact.secondary.email}`} className="text-primary hover:underline">
                    {vendor.contact.secondary.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{vendor.contact.secondary.phone}</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
