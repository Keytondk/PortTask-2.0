// ===========================================
// Navo Constants
// ===========================================

// -----------------------------
// Application
// -----------------------------

export const APP_NAME = 'Navo';
export const APP_DESCRIPTION = 'The Nerve Center for Maritime Operations';

// -----------------------------
// Portals
// -----------------------------

export const PORTALS = {
  KEY: 'key',
  PORTAL: 'portal',
  VENDOR: 'vendor',
} as const;

export const PORTAL_NAMES = {
  [PORTALS.KEY]: 'Navo Platform',
  [PORTALS.PORTAL]: 'Navo Portal',
  [PORTALS.VENDOR]: 'Navo Vendor',
} as const;

// -----------------------------
// Port Call Statuses
// -----------------------------

export const PORT_CALL_STATUSES = {
  DRAFT: 'draft',
  PLANNED: 'planned',
  CONFIRMED: 'confirmed',
  ARRIVED: 'arrived',
  ALONGSIDE: 'alongside',
  DEPARTED: 'departed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PORT_CALL_STATUS_LABELS: Record<string, string> = {
  [PORT_CALL_STATUSES.DRAFT]: 'Draft',
  [PORT_CALL_STATUSES.PLANNED]: 'Planned',
  [PORT_CALL_STATUSES.CONFIRMED]: 'Confirmed',
  [PORT_CALL_STATUSES.ARRIVED]: 'Arrived',
  [PORT_CALL_STATUSES.ALONGSIDE]: 'Alongside',
  [PORT_CALL_STATUSES.DEPARTED]: 'Departed',
  [PORT_CALL_STATUSES.COMPLETED]: 'Completed',
  [PORT_CALL_STATUSES.CANCELLED]: 'Cancelled',
};

export const PORT_CALL_STATUS_COLORS: Record<string, string> = {
  [PORT_CALL_STATUSES.DRAFT]: 'gray',
  [PORT_CALL_STATUSES.PLANNED]: 'blue',
  [PORT_CALL_STATUSES.CONFIRMED]: 'green',
  [PORT_CALL_STATUSES.ARRIVED]: 'yellow',
  [PORT_CALL_STATUSES.ALONGSIDE]: 'orange',
  [PORT_CALL_STATUSES.DEPARTED]: 'purple',
  [PORT_CALL_STATUSES.COMPLETED]: 'green',
  [PORT_CALL_STATUSES.CANCELLED]: 'red',
};

// -----------------------------
// Service Order Statuses
// -----------------------------

export const SERVICE_ORDER_STATUSES = {
  DRAFT: 'draft',
  REQUESTED: 'requested',
  RFQ_SENT: 'rfq_sent',
  QUOTED: 'quoted',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const SERVICE_ORDER_STATUS_LABELS: Record<string, string> = {
  [SERVICE_ORDER_STATUSES.DRAFT]: 'Draft',
  [SERVICE_ORDER_STATUSES.REQUESTED]: 'Requested',
  [SERVICE_ORDER_STATUSES.RFQ_SENT]: 'RFQ Sent',
  [SERVICE_ORDER_STATUSES.QUOTED]: 'Quoted',
  [SERVICE_ORDER_STATUSES.CONFIRMED]: 'Confirmed',
  [SERVICE_ORDER_STATUSES.IN_PROGRESS]: 'In Progress',
  [SERVICE_ORDER_STATUSES.COMPLETED]: 'Completed',
  [SERVICE_ORDER_STATUSES.CANCELLED]: 'Cancelled',
};

// -----------------------------
// RFQ Statuses
// -----------------------------

export const RFQ_STATUSES = {
  DRAFT: 'draft',
  SENT: 'sent',
  EVALUATING: 'evaluating',
  AWARDED: 'awarded',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export const RFQ_STATUS_LABELS: Record<string, string> = {
  [RFQ_STATUSES.DRAFT]: 'Draft',
  [RFQ_STATUSES.SENT]: 'Sent',
  [RFQ_STATUSES.EVALUATING]: 'Evaluating',
  [RFQ_STATUSES.AWARDED]: 'Awarded',
  [RFQ_STATUSES.EXPIRED]: 'Expired',
  [RFQ_STATUSES.CANCELLED]: 'Cancelled',
};

// -----------------------------
// Incident Priorities
// -----------------------------

export const INCIDENT_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const INCIDENT_PRIORITY_LABELS: Record<string, string> = {
  [INCIDENT_PRIORITIES.LOW]: 'Low',
  [INCIDENT_PRIORITIES.MEDIUM]: 'Medium',
  [INCIDENT_PRIORITIES.HIGH]: 'High',
  [INCIDENT_PRIORITIES.CRITICAL]: 'Critical',
};

export const INCIDENT_PRIORITY_COLORS: Record<string, string> = {
  [INCIDENT_PRIORITIES.LOW]: 'green',
  [INCIDENT_PRIORITIES.MEDIUM]: 'yellow',
  [INCIDENT_PRIORITIES.HIGH]: 'orange',
  [INCIDENT_PRIORITIES.CRITICAL]: 'red',
};

// -----------------------------
// Vessel Types
// -----------------------------

export const VESSEL_TYPES = {
  CONTAINER: 'container',
  BULK_CARRIER: 'bulk_carrier',
  TANKER: 'tanker',
  LNG: 'lng',
  LPG: 'lpg',
  RORO: 'roro',
  GENERAL_CARGO: 'general_cargo',
  OFFSHORE: 'offshore',
  PASSENGER: 'passenger',
  YACHT: 'yacht',
  TUG: 'tug',
  OTHER: 'other',
} as const;

export const VESSEL_TYPE_LABELS: Record<string, string> = {
  [VESSEL_TYPES.CONTAINER]: 'Container',
  [VESSEL_TYPES.BULK_CARRIER]: 'Bulk Carrier',
  [VESSEL_TYPES.TANKER]: 'Tanker',
  [VESSEL_TYPES.LNG]: 'LNG Carrier',
  [VESSEL_TYPES.LPG]: 'LPG Carrier',
  [VESSEL_TYPES.RORO]: 'RoRo',
  [VESSEL_TYPES.GENERAL_CARGO]: 'General Cargo',
  [VESSEL_TYPES.OFFSHORE]: 'Offshore',
  [VESSEL_TYPES.PASSENGER]: 'Passenger',
  [VESSEL_TYPES.YACHT]: 'Yacht',
  [VESSEL_TYPES.TUG]: 'Tug',
  [VESSEL_TYPES.OTHER]: 'Other',
};

// -----------------------------
// Document Types
// -----------------------------

export const DOCUMENT_TYPES = {
  PDA: 'pda',
  FDA: 'fda',
  SOF: 'sof',
  BDN: 'bdn',
  INVOICE: 'invoice',
  RECEIPT: 'receipt',
  CERTIFICATE: 'certificate',
  OTHER: 'other',
} as const;

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  [DOCUMENT_TYPES.PDA]: 'Proforma Disbursement Account',
  [DOCUMENT_TYPES.FDA]: 'Final Disbursement Account',
  [DOCUMENT_TYPES.SOF]: 'Statement of Facts',
  [DOCUMENT_TYPES.BDN]: 'Bunker Delivery Note',
  [DOCUMENT_TYPES.INVOICE]: 'Invoice',
  [DOCUMENT_TYPES.RECEIPT]: 'Receipt',
  [DOCUMENT_TYPES.CERTIFICATE]: 'Certificate',
  [DOCUMENT_TYPES.OTHER]: 'Other',
};

// -----------------------------
// User Roles
// -----------------------------

export const USER_ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  CUSTOMER: 'customer',
  CREW: 'crew',
  CREW_OPS: 'crew-ops',
  AGENT: 'agent',
  VENDOR: 'vendor',
} as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.OPERATOR]: 'Operator',
  [USER_ROLES.CUSTOMER]: 'Customer',
  [USER_ROLES.CREW]: 'Crew',
  [USER_ROLES.CREW_OPS]: 'Crew (Operations)',
  [USER_ROLES.AGENT]: 'Port Agent',
  [USER_ROLES.VENDOR]: 'Vendor',
};

// -----------------------------
// Service Categories
// -----------------------------

export const SERVICE_CATEGORIES = {
  BUNKERS: 'bunkers',
  PROVISIONS: 'provisions',
  REPAIRS: 'repairs',
  LAUNCH: 'launch',
  TOWAGE: 'towage',
  PILOTAGE: 'pilotage',
  MOORING: 'mooring',
  AGENCY: 'agency',
  CARGO: 'cargo',
  CREW: 'crew',
  OTHER: 'other',
} as const;

export const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  [SERVICE_CATEGORIES.BUNKERS]: 'Bunkers & Lubricants',
  [SERVICE_CATEGORIES.PROVISIONS]: 'Provisions & Stores',
  [SERVICE_CATEGORIES.REPAIRS]: 'Repairs & Maintenance',
  [SERVICE_CATEGORIES.LAUNCH]: 'Launch Services',
  [SERVICE_CATEGORIES.TOWAGE]: 'Towage',
  [SERVICE_CATEGORIES.PILOTAGE]: 'Pilotage',
  [SERVICE_CATEGORIES.MOORING]: 'Mooring',
  [SERVICE_CATEGORIES.AGENCY]: 'Agency Services',
  [SERVICE_CATEGORIES.CARGO]: 'Cargo Operations',
  [SERVICE_CATEGORIES.CREW]: 'Crew Services',
  [SERVICE_CATEGORIES.OTHER]: 'Other',
};

// -----------------------------
// Currencies
// -----------------------------

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'SGD', 'AED', 'NOK', 'DKK', 'SEK'] as const;

export const DEFAULT_CURRENCY = 'USD';

// -----------------------------
// Pagination
// -----------------------------

export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

// -----------------------------
// Time
// -----------------------------

export const REFRESH_INTERVALS = {
  REAL_TIME: 5000,      // 5 seconds
  FREQUENT: 30000,      // 30 seconds
  NORMAL: 60000,        // 1 minute
  SLOW: 300000,         // 5 minutes
} as const;
