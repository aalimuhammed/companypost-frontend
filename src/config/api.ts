// ─────────────────────────────────────────────────────────────────────────────
// REAL API ENDPOINTS — sourced directly from your existing codebase
// Only change API_BASE_URL to point to your backend
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE_URL = 'http://192.168.112.24:5037/api';
export const COMPANY_POST_HOST = 'http://192.168.121.29:8081';
export const TOKEN_KEY = 'authToken';

// ── Shared lookups ────────────────────────────────────────────────────────────
export const API = {
  // Lookups (GET, no auth required in original code)
  WORK_TYPES:        '/WorkTypes/get-worktypes',
  COMPANIES:         '/Company/get-companies',
  DEPARTMENTS:       '/Department/get-departments',
  PROJECTS:          '/Publisher/get-projects',
  PROJECTSDEPT:       '/Publisher/projects-departments',
  SUPPLIERS:         '/Publisher/get-suppliers',
  FOLLOWING_PERSONS: '/SysUsers/getfollowingpersons',

  // ── Incoming ─────────────────────────────────────────────────────────────
  INCOMING_SERIAL:   '/Incoming/GetIncomingMaxSerialNumber',
  INCOMING_CREATE:   '/Incoming/CreateIncoming',
  INCOMING_DOC_NUMBERS: '/Incoming/GetDocumentNumbers',
  INCOMING_COPY:     (id: string) => `/Incoming/GetInComingToBeCopied/${id}`,

  // ── Outgoing — endpoints NOT in uploaded code; update when known ──────────
  // TODO: Replace with your real outgoing endpoints
  OUTGOING_EXT_SERIAL: '/OutgoingDocument/GetOutgoingMaxSerialNumber',
  OUTGOING_EXT_CREATE: '/OutgoingDocument/CreateOutgoing',
  OUTGOING_INT_SERIAL: '/OutgoingInternal/GetOutgoingInternalMaxSerialNumber',
  OUTGOING_INT_CREATE: '/OutgoingInternal/CreateOutgoingInternal',

  // ── Contracts ─────────────────────────────────────────────────────────────
  CONTRACT_SERIAL:     '/Contracts/GetContractMaxSerialNumber',
  CONTRACT_REF_SERIAL: '/Contracts/GetContractRefMaxSerialNumber',
  CONTRACT_NUMBERS:    '/Contracts/get-contracts-numbers',
  CONTRACT_ATTACHED:   (id: string) => `/Contracts/GetAttachedContractData/${id}`,
  CONTRACT_CREATE:     '/Contracts/create-contract',
  CONTRACT_GET:        (id: string) => `/Contracts/get-contract/${id}`,
  CONTRACT_UPDATE:     (id: string) => `/Contracts/update-contract/${id}`,
  CONTRACT_DELETE:     (id: string) => `/Contracts/deletecontract?Id=${id}`,

  // ── Purchase Orders ───────────────────────────────────────────────────────
  PO_SERIAL:    '/PurchaseOrder/GetPurchaseOrderMaxSerialNumber',
  PO_CREATE:    '/PurchaseOrder/createpurchaseorder',
  PO_LIST:      '/Documents/get-purchase-orders',
  PO_GET:       (id: string) => `/Documents/get-purchase-order/${id}`,
  PO_UPDATE:    (id: string) => `/Documents/purchase-order/${id}`,
  PO_DELETE:    (id: string) => `/Documents/deletepurchaseorder/${id}`,

  // ── Documents view ────────────────────────────────────────────────────────
  CONTRACTS_LIST: '/Documents/contracts',
} as const;

// ── Auth helper ───────────────────────────────────────────────────────────────
export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Typed fetch wrappers ──────────────────────────────────────────────────────
export async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function apiPost(endpoint: string, body: FormData | object) {
  const isForm = body instanceof FormData;
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { ...authHeaders(), ...(isForm ? {} : { 'Content-Type': 'application/json' }) },
    body: isForm ? body : JSON.stringify(body),
  });
  return res.json();
}

export async function apiPut(endpoint: string, body: FormData | object) {
  const isForm = body instanceof FormData;
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: { ...authHeaders(), ...(isForm ? {} : { 'Content-Type': 'application/json' }) },
    body: isForm ? body : JSON.stringify(body),
  });
  return res.json();
}

export async function apiDelete(endpoint: string) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'DELETE', headers: authHeaders() });
  return res.json();
}