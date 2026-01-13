const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002/api/v1';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

class PortalApiClient {
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

  // Port Calls
  async getPortCalls(params?: {
    page?: number;
    per_page?: number;
    status?: string;
  }) {
    return this.request<{
      data: PortCall[];
      total: number;
      page: number;
      per_page: number;
    }>('/port-calls', {
      params: params as Record<string, string>,
    });
  }

  async getPortCall(id: string) {
    return this.request<{ data: PortCall }>(`/port-calls/${id}`);
  }

  async getPortCallServices(portCallId: string) {
    return this.request<{ data: ServiceOrder[] }>(
      `/port-calls/${portCallId}/services`
    );
  }

  // Service Orders
  async getServiceOrders(params?: {
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

  async getServiceOrder(id: string) {
    return this.request<{ data: ServiceOrder }>(`/service-orders/${id}`);
  }
}

// Types
export interface PortCall {
  id: string;
  reference: string;
  vessel_id: string;
  port_id: string;
  workspace_id: string;
  status: string;
  eta?: string;
  etd?: string;
  ata?: string;
  atd?: string;
  berth_name?: string;
  berth_terminal?: string;
  agent_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  vessel?: {
    id: string;
    name: string;
    imo: string;
    flag: string;
    type: string;
  };
  port?: {
    id: string;
    name: string;
    unlocode: string;
    country: string;
  };
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
  vendor?: {
    id: string;
    name: string;
  };
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

export const api = new PortalApiClient(API_BASE_URL);
