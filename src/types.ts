/** Generic id/name pair used in every dropdown / autocomplete */
export interface Option {
  id: string;
  name: string;
}

/** Same shape, alias kept for clarity in person-selection contexts */
export interface Person {
  id: string;
  name: string;
}

/** A downloaded file reference returned by the API */
export interface Attachment {
  filePath: string;
  fileName: string;
}

// ─── Enum-like unions (mirror .NET enums in the backend) ─────────────────────

/** Status codes returned/sent as numbers in the API */
export type StatusMethod = 1 | 2 | 3 | 4 | 5 | 6;
// 1=مكتمل 2=قيد التنفيذ 3=مرفوض 4=معتمد 5=قيد المراجعة 6=لا شئ

/** Delivery method codes */
export type DeliveryMethod = 1 | 2 | 3;
// 1=يدوياً  2=إيميل  3=فاكس

/** Publisher / Delivery source type discriminator */
export type PublisherType = 'Department' | 'Project' | 'Company';

/** Followup action option */
export type FollowupOption = 'Sharing' | 'Followed' | 'Escalated' | '';

// ─── API response shapes ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  status?: boolean;
  message?: string;
  data?: T;
}

/** Shared base fields every document row has */
export interface BaseDocument {
  id: string;
  serialNumber: number;
  documentNumber: string;
  subject: string;
  summary?: string;
  notes?: string;
  deliveryDate: string;
  documentDate: string;
  deliveryMethod?: DeliveryMethod;
  statusMethod?: StatusMethod;
  attachments?: string[] | string | null;
  createdBy?: string;
  createdAt?: string;
}

/** Incoming document row */
export interface IncomingDocument extends BaseDocument {
  companyName?: string;
  publisherName?: string;
  receivedFromName?: string;
  workTypeName?: string;
  projectName?: string;
  documentType?: number;
  saveDate?: string;
  incomingNumber?: string;
  oldRef?: string;
}

/** Outgoing document row */
export interface OutgoingDocument extends BaseDocument {
  companyName?: string;
  publisherName?: string;
  receivedFromName?: string;
  workTypeName?: string;
  deliveryTypeName?: string;
  incomingNumber?: string;
  oldRef?: string;
}

/** Contract row */
export interface Contract {
  id: string;
  serialNum?: number;
  contractNum: string;
  contractNumber: string;
  type?: string;
  value: string;
  canEdit:boolean;
  contractValue: string;
  currency: string;
  contractDate: string;
  personOrg?: string;
  supplierId: string;
  department: string;
  project?: string;
  projectId: string;
  workTypeId: string;
  details: string;
  notes?: string;
  purchaseOrderRef?: string;
  oldReferenceNumber?: string;
  attachmentPaths?: string[] | null;
  createdBy?: string;
  createdAt?: string;
  approvalDeliveryDate?:string
  dateOfReceipt:string
}

/** Purchase Order row */
export interface PurchaseOrder {
  id: string;
  serialNumber: number;
  purchaseOrderNumber: string;
  purchaseOrderValue?: string;
  value?: string;
  workType?: string;
  workTypeId: string;
  purchaseOrderDate: string;
  subContractor?: string;
  supplierId: string;
  department?: string;
  departmentId?: string;
  projectName?: string;
  projectId: string;
  currency?: string;
  attachments?: string[] | string | null;
  createdBy?: string;
  createdAt?: string;
}

/** Dashboard summary stats */
export interface DashStats {
  totalDocuments: number;
  incomingCount: number;
  outgoingCount: number;
  activeContracts: number;
  rejectedCount: number;
  completedCount: number;
  inProgressCount: number;
  approvedContracts: number;
  underReviewContracts: number;
}