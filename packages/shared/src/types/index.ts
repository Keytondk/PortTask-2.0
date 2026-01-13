// ===========================================
// Core Domain Types for Navo
// ===========================================

// -----------------------------
// Common Types
// -----------------------------

export type ID = string;

export type Status = 'active' | 'inactive';

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface Contact {
  name: string;
  role?: string;
  email: string;
  phone?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// -----------------------------
// Organization
// -----------------------------

export type OrganizationType = 'operator' | 'customer' | 'vendor' | 'agent';

export interface Organization extends Timestamps {
  id: ID;
  name: string;
  type: OrganizationType;
  status: Status;
  settings: Record<string, unknown>;
}

// -----------------------------
// User & Roles
// -----------------------------

export type UserStatus = 'active' | 'inactive' | 'invited';

export type RoleType =
  | 'admin'
  | 'operator'
  | 'customer'
  | 'crew'
  | 'crew-ops'
  | 'agent'
  | 'vendor';

export type PortalType = 'platform' | 'portal' | 'vendor';

export interface UserRole {
  role: RoleType;
  scope?: {
    workspaceIds?: ID[];
    vesselIds?: ID[];
    portIds?: ID[];
  };
  approvalLimit?: number;
}

export interface User extends Timestamps {
  id: ID;
  email: string;
  name: string;
  organizationId: ID;
  roles: UserRole[];
  status: UserStatus;
  lastLoginAt?: Date;
}

// -----------------------------
// Workspace
// -----------------------------

export type WorkspaceType = 'customer' | 'project' | 'internal';

export interface Workspace extends Timestamps {
  id: ID;
  name: string;
  organizationId: ID;
  type: WorkspaceType;
  status: Status;
  settings: Record<string, unknown>;
}

// -----------------------------
// Vessel
// -----------------------------

export type VesselType =
  | 'container'
  | 'bulk_carrier'
  | 'tanker'
  | 'lng'
  | 'lpg'
  | 'roro'
  | 'general_cargo'
  | 'offshore'
  | 'passenger'
  | 'yacht'
  | 'tug'
  | 'other';

export interface VesselDetails {
  dwt?: number;
  loa?: number;
  beam?: number;
  draft?: number;
  built?: number;
  class?: string;
}

export interface VesselPosition {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  destination?: string;
  eta?: Date;
  updatedAt: Date;
}

export interface Vessel extends Timestamps {
  id: ID;
  name: string;
  imo?: string;
  mmsi?: string;
  flag?: string;
  type: VesselType;
  details: VesselDetails;
  workspaceId: ID;
  status: Status;
  currentPosition?: VesselPosition;
}

// -----------------------------
// Port
// -----------------------------

export interface Port {
  id: ID;
  name: string;
  unlocode: string;
  country: string;
  coordinates: Coordinates;
  timezone: string;
  facilities: string[];
  status: Status;
}

// -----------------------------
// Port Call
// -----------------------------

export type PortCallStatus =
  | 'draft'
  | 'planned'
  | 'confirmed'
  | 'arrived'
  | 'alongside'
  | 'departed'
  | 'completed'
  | 'cancelled';

export interface PortCallSchedule {
  eta: Date;
  etd: Date;
  ata?: Date;
  atd?: Date;
}

export interface PortCallBerth {
  name: string;
  terminal?: string;
  confirmedAt?: Date;
}

export interface PortCall extends Timestamps {
  id: ID;
  reference: string;
  vesselId: ID;
  portId: ID;
  workspaceId: ID;
  status: PortCallStatus;
  schedule: PortCallSchedule;
  berth?: PortCallBerth;
  agentId?: ID;
  createdBy: ID;
}

// -----------------------------
// Service Type
// -----------------------------

export interface ServiceType {
  id: ID;
  name: string;
  category: string;
  description?: string;
  defaultSpecifications?: Record<string, unknown>;
  status: Status;
}

// -----------------------------
// Service Order
// -----------------------------

export type ServiceOrderStatus =
  | 'draft'
  | 'requested'
  | 'rfq_sent'
  | 'quoted'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface ServiceOrderDetails {
  description: string;
  quantity?: number;
  unit?: string;
  specifications?: Record<string, unknown>;
}

export interface ServiceOrderSchedule {
  requestedDate: Date;
  confirmedDate?: Date;
  completedDate?: Date;
}

export interface ServiceOrderPricing {
  quoted?: number;
  final?: number;
  currency: string;
}

export interface ServiceOrderVendor {
  id: ID;
  name: string;
  contact?: string;
}

export interface ServiceOrder extends Timestamps {
  id: ID;
  portCallId: ID;
  serviceTypeId: ID;
  status: ServiceOrderStatus;
  details: ServiceOrderDetails;
  schedule: ServiceOrderSchedule;
  vendor?: ServiceOrderVendor;
  pricing: ServiceOrderPricing;
  rfqId?: ID;
  createdBy: ID;
}

// -----------------------------
// RFQ (Request for Quote)
// -----------------------------

export type RFQStatus =
  | 'draft'
  | 'sent'
  | 'evaluating'
  | 'awarded'
  | 'expired'
  | 'cancelled';

export interface RFQDetails {
  serviceTypeId: ID;
  description: string;
  quantity?: number;
  unit?: string;
  specifications?: Record<string, unknown>;
  deliveryDate: Date;
}

export interface RFQ extends Timestamps {
  id: ID;
  reference: string;
  serviceOrderId?: ID;
  portCallId: ID;
  status: RFQStatus;
  details: RFQDetails;
  deadline: Date;
  invitedVendors: ID[];
  awardedQuoteId?: ID;
  awardedAt?: Date;
  createdBy: ID;
}

// -----------------------------
// Quote
// -----------------------------

export type QuoteStatus = 'submitted' | 'awarded' | 'rejected' | 'withdrawn';

export interface QuotePricing {
  unitPrice: number;
  totalPrice: number;
  currency: string;
}

export interface QuoteTerms {
  paymentTerms: string;
  deliveryDate: Date;
  validUntil: Date;
}

export interface Quote {
  id: ID;
  rfqId: ID;
  vendorId: ID;
  status: QuoteStatus;
  pricing: QuotePricing;
  terms: QuoteTerms;
  notes?: string;
  attachments?: string[];
  submittedAt: Date;
}

// -----------------------------
// Vendor
// -----------------------------

export type VendorStatus = 'pending' | 'verified' | 'active' | 'suspended' | 'inactive';

export interface VendorProfile {
  registrationNumber?: string;
  address?: Address;
  contacts: Contact[];
  bankDetails?: Record<string, unknown>;
}

export interface VendorCapabilities {
  serviceTypes: ID[];
  ports: ID[];
  certifications: string[];
}

export interface VendorPerformance {
  rating: number;
  totalOrders: number;
  onTimeDelivery: number;
  responseTime: number;
}

export interface Vendor extends Timestamps {
  id: ID;
  name: string;
  organizationId: ID;
  profile: VendorProfile;
  capabilities: VendorCapabilities;
  performance: VendorPerformance;
  status: VendorStatus;
  verifiedAt?: Date;
}

// -----------------------------
// Agent
// -----------------------------

export interface AgentProfile {
  address?: Address;
  contacts: Contact[];
}

export interface AgentCoverage {
  ports: ID[];
  services: string[];
}

export interface AgentPerformance {
  rating: number;
  totalCalls: number;
  responseTime: number;
}

export interface Agent extends Timestamps {
  id: ID;
  name: string;
  organizationId: ID;
  profile: AgentProfile;
  coverage: AgentCoverage;
  performance: AgentPerformance;
  status: Status;
}

// -----------------------------
// Document
// -----------------------------

export type DocumentType =
  | 'pda'
  | 'fda'
  | 'sof'
  | 'bdn'
  | 'invoice'
  | 'receipt'
  | 'certificate'
  | 'other';

export type DocumentEntityType =
  | 'port_call'
  | 'service_order'
  | 'vessel'
  | 'vendor';

export interface DocumentFile {
  url: string;
  size: number;
  mimeType: string;
}

export interface Document {
  id: ID;
  name: string;
  type: DocumentType;
  entityType: DocumentEntityType;
  entityId: ID;
  file: DocumentFile;
  uploadedBy: ID;
  uploadedAt: Date;
}

// -----------------------------
// Incident
// -----------------------------

export type IncidentPriority = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface IncidentRelations {
  portCallId?: ID;
  vesselId?: ID;
  serviceOrderId?: ID;
}

export interface IncidentEvent {
  timestamp: Date;
  userId: ID;
  action: string;
  details?: string;
}

export interface Incident extends Timestamps {
  id: ID;
  title: string;
  description?: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  relatedTo?: IncidentRelations;
  assignedTo?: ID;
  timeline: IncidentEvent[];
  resolvedAt?: Date;
  resolution?: string;
  createdBy: ID;
}

// -----------------------------
// Notification
// -----------------------------

export type NotificationType =
  | 'port_call_created'
  | 'port_call_updated'
  | 'rfq_received'
  | 'quote_received'
  | 'quote_awarded'
  | 'service_confirmed'
  | 'service_completed'
  | 'approval_required'
  | 'message_received'
  | 'incident_created'
  | 'system';

export type NotificationChannel = 'in_app' | 'email' | 'push';

export interface Notification {
  id: ID;
  userId: ID;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  link?: string;
  channels: NotificationChannel[];
  readAt?: Date;
  sentAt: Date;
  createdAt: Date;
}

// -----------------------------
// Message
// -----------------------------

export type MessageChannelType = 'port_call' | 'direct' | 'general';

export interface Message {
  id: ID;
  channelType: MessageChannelType;
  channelId: ID;
  senderId: ID;
  content: string;
  attachments?: string[];
  readBy: Array<{ userId: ID; readAt: Date }>;
  createdAt: Date;
}

// -----------------------------
// Automation Rule
// -----------------------------

export type AutomationRuleStatus = 'active' | 'paused' | 'draft';

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: unknown;
}

export interface AutomationAction {
  type: string;
  params: Record<string, unknown>;
}

export interface AutomationTrigger {
  event: string;
  conditions: AutomationCondition[];
}

export interface AutomationRule extends Timestamps {
  id: ID;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  status: AutomationRuleStatus;
  createdBy: ID;
}
