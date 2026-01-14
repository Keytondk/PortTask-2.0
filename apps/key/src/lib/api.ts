import { getAuthHeaders } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002/api/v1';
const VESSEL_API_URL = process.env.NEXT_PUBLIC_VESSEL_API_URL || 'http://localhost:4003/api/v1';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  protected async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const { params, skipAuth, ...fetchOptions } = options;

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const authHeaders = skipAuth ? {} : getAuthHeaders();

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
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
    workspace_id?: string;
    vessel_id?: string;
    port_id?: string;
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

  async createPortCall(input: CreatePortCallInput) {
    return this.request<{ data: PortCall }>('/port-calls', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updatePortCall(id: string, input: UpdatePortCallInput) {
    return this.request<{ data: PortCall }>(`/port-calls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deletePortCall(id: string) {
    return this.request<{ message: string }>(`/port-calls/${id}`, {
      method: 'DELETE',
    });
  }

  async getPortCallServices(portCallId: string) {
    return this.request<{ data: ServiceOrder[] }>(
      `/port-calls/${portCallId}/services`
    );
  }

  async getPortCallTimeline(portCallId: string) {
    return this.request<{ data: TimelineEvent[] }>(
      `/port-calls/${portCallId}/timeline`
    );
  }

  // Service Orders
  async getServiceOrders(params?: {
    page?: number;
    per_page?: number;
    port_call_id?: string;
    vendor_id?: string;
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

  async createServiceOrder(portCallId: string, input: CreateServiceOrderInput) {
    return this.request<{ data: ServiceOrder }>(
      `/port-calls/${portCallId}/services`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
  }

  async updateServiceOrder(id: string, input: UpdateServiceOrderInput) {
    return this.request<{ data: ServiceOrder }>(`/service-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteServiceOrder(id: string) {
    return this.request<{ message: string }>(`/service-orders/${id}`, {
      method: 'DELETE',
    });
  }

  async confirmServiceOrder(
    id: string,
    vendorId: string,
    quotedPrice: number
  ) {
    return this.request<{ data: ServiceOrder }>(
      `/service-orders/${id}/confirm`,
      {
        method: 'POST',
        body: JSON.stringify({ vendor_id: vendorId, quoted_price: quotedPrice }),
      }
    );
  }

  async completeServiceOrder(id: string, finalPrice?: number) {
    return this.request<{ data: ServiceOrder }>(
      `/service-orders/${id}/complete`,
      {
        method: 'POST',
        body: JSON.stringify({ final_price: finalPrice }),
      }
    );
  }

  // RFQs
  async getRFQs(params?: {
    page?: number;
    per_page?: number;
    port_call_id?: string;
    service_type_id?: string;
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

  async createRFQ(input: CreateRFQInput) {
    return this.request<{ data: RFQ }>('/rfqs', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateRFQ(id: string, input: UpdateRFQInput) {
    return this.request<{ data: RFQ }>(`/rfqs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async publishRFQ(id: string) {
    return this.request<{ data: RFQ }>(`/rfqs/${id}/publish`, {
      method: 'POST',
    });
  }

  async closeRFQ(id: string) {
    return this.request<{ data: RFQ }>(`/rfqs/${id}/close`, {
      method: 'POST',
    });
  }

  async cancelRFQ(id: string, reason?: string) {
    return this.request<{ data: RFQ }>(`/rfqs/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getRFQQuotes(rfqId: string) {
    return this.request<{ data: Quote[] }>(`/rfqs/${rfqId}/quotes`);
  }

  async compareRFQQuotes(rfqId: string) {
    return this.request<{ data: QuoteComparison }>(`/rfqs/${rfqId}/compare`);
  }

  async awardQuote(rfqId: string, quoteId: string) {
    return this.request<{ data: RFQ }>(`/rfqs/${rfqId}/award`, {
      method: 'POST',
      body: JSON.stringify({ quote_id: quoteId }),
    });
  }

  async submitQuote(rfqId: string, input: SubmitQuoteInput) {
    return this.request<{ data: Quote }>(`/rfqs/${rfqId}/quotes`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // Vendors
  async getVendors(params?: {
    page?: number;
    per_page?: number;
    service_type_id?: string;
  }) {
    return this.request<{
      data: Vendor[];
      meta: { total: number; page: number; per_page: number };
    }>('/vendors', {
      params: params as Record<string, string>,
    });
  }

  async getVendor(id: string) {
    return this.request<{ data: Vendor }>(`/vendors/${id}`);
  }
}

// Types
export interface PortCall {
  id: string;
  reference: string;
  vessel_id: string;
  port_id: string;
  workspace_id: string;
  status: PortCallStatus;
  eta?: string;
  etd?: string;
  ata?: string;
  atd?: string;
  berth_name?: string;
  berth_terminal?: string;
  berth_confirmed_at?: string;
  agent_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  vessel?: Vessel;
  port?: Port;
  service_orders?: ServiceOrder[];
}

export type PortCallStatus =
  | 'draft'
  | 'planned'
  | 'confirmed'
  | 'arrived'
  | 'alongside'
  | 'departed'
  | 'completed'
  | 'cancelled';

export interface Vessel {
  id: string;
  name: string;
  imo: string;
  flag: string;
  type: string;
}

export interface Port {
  id: string;
  name: string;
  unlocode: string;
  country: string;
}

export interface ServiceOrder {
  id: string;
  port_call_id: string;
  service_type_id: string;
  status: ServiceOrderStatus;
  description?: string;
  quantity?: number;
  unit?: string;
  specifications?: Record<string, unknown>;
  requested_date?: string;
  confirmed_date?: string;
  completed_date?: string;
  vendor_id?: string;
  quoted_price?: number;
  final_price?: number;
  currency: string;
  rfq_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  service_type?: ServiceType;
  vendor?: Vendor;
}

export type ServiceOrderStatus =
  | 'draft'
  | 'requested'
  | 'rfq_sent'
  | 'quoted'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface ServiceType {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface Vendor {
  id: string;
  name: string;
}

export interface TimelineEvent {
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

export interface CreatePortCallInput {
  vessel_id: string;
  port_id: string;
  workspace_id: string;
  eta?: string;
  etd?: string;
  berth_name?: string;
  berth_terminal?: string;
  agent_id?: string;
}

export interface UpdatePortCallInput {
  status?: PortCallStatus;
  eta?: string;
  etd?: string;
  ata?: string;
  atd?: string;
  berth_name?: string;
  berth_terminal?: string;
  agent_id?: string;
}

export interface CreateServiceOrderInput {
  service_type_id: string;
  description?: string;
  quantity?: number;
  unit?: string;
  specifications?: Record<string, unknown>;
  requested_date?: string;
}

export interface UpdateServiceOrderInput {
  status?: ServiceOrderStatus;
  description?: string;
  quantity?: number;
  unit?: string;
  specifications?: Record<string, unknown>;
  requested_date?: string;
  vendor_id?: string;
  quoted_price?: number;
  final_price?: number;
  currency?: string;
}



// Vessel API Client
class VesselApiClient extends ApiClient {
  // Vessels
  async getVessels(params?: {
    page?: number;
    per_page?: number;
    workspace_id?: string;
    flag?: string;
    type?: string;
  }) {
    return this.request<{
      data: VesselFull[];
      meta: { total: number; page: number; per_page: number };
    }>('/vessels', {
      params: params as Record<string, string>,
    });
  }

  async getVessel(id: string) {
    return this.request<{ data: VesselFull }>(`/vessels/${id}`);
  }

  async getVesselByIMO(imo: string) {
    return this.request<{ data: VesselFull }>(`/vessels/imo/${imo}`);
  }

  async createVessel(input: CreateVesselInput) {
    return this.request<{ data: VesselFull }>('/vessels', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateVessel(id: string, input: UpdateVesselInput) {
    return this.request<{ data: VesselFull }>(`/vessels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  // Positions
  async getFleetPositions(workspaceId: string) {
    return this.request<{ data: VesselPosition[] }>(`/positions/fleet/${workspaceId}`);
  }

  async getVesselPosition(vesselId: string) {
    return this.request<{ data: VesselPosition }>(`/positions/${vesselId}/latest`);
  }

  async getVesselTrack(vesselId: string, params?: {
    from?: string;
    to?: string;
    limit?: number;
  }) {
    return this.request<{ data: VesselPosition[] }>(`/positions/${vesselId}/track`, {
      params: params as Record<string, string>,
    });
  }

  async refreshPositions(workspaceId: string) {
    return this.request<{ data: { updated: number } }>(`/positions/fleet/${workspaceId}/refresh`, {
      method: 'POST',
    });
  }
}

// RFQ Types
export interface RFQ {
  id: string;
  reference: string;
  service_type_id: string;
  port_call_id: string;
  status: RFQStatus;
  description?: string;
  quantity?: number;
  unit?: string;
  specifications?: Record<string, unknown>;
  delivery_date?: string;
  deadline: string;
  invited_vendors: string[];
  awarded_quote_id?: string;
  awarded_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  service_type?: ServiceType;
  quotes?: Quote[];
  quote_count?: number;
}

export type RFQStatus = 'draft' | 'open' | 'closed' | 'awarded' | 'cancelled' | 'expired';

export interface Quote {
  id: string;
  rfq_id: string;
  vendor_id: string;
  status: QuoteStatus;
  unit_price: number;
  total_price: number;
  currency: string;
  payment_terms?: string;
  delivery_date?: string;
  valid_until?: string;
  notes?: string;
  attachments?: string[];
  submitted_at: string;
  vendor?: Vendor;
}

export type QuoteStatus = 'submitted' | 'accepted' | 'rejected' | 'withdrawn';

export interface QuoteComparison {
  rfq_id: string;
  quotes: Quote[];
  lowest_price: number;
  highest_price: number;
  average_price: number;
  quote_count: number;
  recommendation?: string;
}

export interface CreateRFQInput {
  service_type_id: string;
  port_call_id: string;
  description?: string;
  quantity?: number;
  unit?: string;
  specifications?: Record<string, unknown>;
  delivery_date?: string;
  deadline: string;
  invited_vendors?: string[];
}

export interface UpdateRFQInput {
  description?: string;
  quantity?: number;
  unit?: string;
  specifications?: Record<string, unknown>;
  delivery_date?: string;
  deadline?: string;
  invited_vendors?: string[];
}

export interface SubmitQuoteInput {
  vendor_id: string;
  unit_price: number;
  total_price: number;
  currency: string;
  payment_terms?: string;
  delivery_date?: string;
  valid_until?: string;
  notes?: string;
  attachments?: string[];
}

// Vessel Types
export interface VesselFull {
  id: string;
  imo: string;
  mmsi?: string;
  name: string;
  flag: string;
  type: string;
  gross_tonnage?: number;
  deadweight?: number;
  length_overall?: number;
  beam?: number;
  draft?: number;
  year_built?: number;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  current_position?: VesselPosition;
}

export interface VesselPosition {
  id: string;
  vessel_id: string;
  latitude: number;
  longitude: number;
  heading?: number;
  course?: number;
  speed?: number;
  nav_status?: string;
  destination?: string;
  eta?: string;
  source: string;
  recorded_at: string;
  created_at: string;
}

export interface CreateVesselInput {
  imo: string;
  mmsi?: string;
  name: string;
  flag: string;
  type: string;
  gross_tonnage?: number;
  deadweight?: number;
  length_overall?: number;
  beam?: number;
  draft?: number;
  year_built?: number;
  workspace_id: string;
}

export interface UpdateVesselInput {
  mmsi?: string;
  name?: string;
  flag?: string;
  type?: string;
  gross_tonnage?: number;
  deadweight?: number;
  length_overall?: number;
  beam?: number;
  draft?: number;
  year_built?: number;
}

// API Error
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

export const api = new ApiClient(API_BASE_URL);
export const vesselApi = new VesselApiClient(VESSEL_API_URL);
