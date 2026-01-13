const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002/api/v1';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

class VendorApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options;

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.error?.message || 'An error occurred',
        response.status,
        error.error?.code
      );
    }

    return response.json();
  }

  // RFQs
  async getRFQs(params?: {
    page?: number;
    per_page?: number;
    status?: string;
  }) {
    return this.request<{
      data: RFQ[];
      meta: { total: number; page: number; per_page: number };
    }>('/rfqs', {
      params: params as Record<string, string>,
    });
  }

  async getRFQ(id: string) {
    return this.request<{ data: RFQ }>(`/rfqs/${id}`);
  }

  async submitQuote(rfqId: string, input: SubmitQuoteInput) {
    return this.request<{ data: Quote }>(`/rfqs/${rfqId}/quotes`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // Orders (Service Orders assigned to this vendor)
  async getOrders(params?: {
    page?: number;
    per_page?: number;
    status?: string;
  }) {
    return this.request<{
      data: ServiceOrder[];
      total: number;
      page: number;
      per_page: number;
    }>('/service-orders', {
      params: params as Record<string, string>,
    });
  }

  async getOrder(id: string) {
    return this.request<{ data: ServiceOrder }>(`/service-orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request<{ data: ServiceOrder }>(`/service-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }
}

// Types
export interface RFQ {
  id: string;
  reference: string;
  service_type_id: string;
  port_call_id: string;
  status: string;
  description?: string;
  quantity?: number;
  unit?: string;
  specifications?: Record<string, unknown>;
  delivery_date?: string;
  deadline: string;
  invited_vendors: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  service_type?: {
    id: string;
    name: string;
    category: string;
  };
  port_call?: {
    id: string;
    reference: string;
    vessel?: { name: string; imo: string };
    port?: { name: string };
  };
}

export interface Quote {
  id: string;
  rfq_id: string;
  vendor_id: string;
  status: string;
  unit_price: number;
  total_price: number;
  currency: string;
  payment_terms?: string;
  delivery_date?: string;
  valid_until?: string;
  notes?: string;
  submitted_at: string;
}

export interface ServiceOrder {
  id: string;
  port_call_id: string;
  service_type_id: string;
  status: string;
  description?: string;
  quantity?: number;
  unit?: string;
  vendor_id?: string;
  quoted_price?: number;
  final_price?: number;
  currency: string;
  created_at: string;
  updated_at: string;
  service_type?: {
    id: string;
    name: string;
    category: string;
  };
  port_call?: {
    id: string;
    reference: string;
    vessel?: { name: string };
    port?: { name: string };
  };
}

export interface SubmitQuoteInput {
  unit_price: number;
  total_price: number;
  currency: string;
  payment_terms?: string;
  delivery_date?: string;
  valid_until?: string;
  notes?: string;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const api = new VendorApiClient(API_BASE_URL);
