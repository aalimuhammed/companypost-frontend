import React, { useState, useMemo } from 'react';
import { Badge, Spinner, Alert, Modal, Button } from '../components/UI';
//import type { BadgeVariant } from '../components/UI';
import { SearchableSelect } from '../components/SearchableSelect';
import { API_BASE_URL } from '../config/constants';
import type { Attachment } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Doc {
  id: string;
  serialNumber: number;
  documentNumber: string;
  subject: string;
  companyName?: string;
  publisherName?: string;
  type?: string;
  deliveryDate: string;
  documentDate: string;
  statusMethod: number;
  attachmentPaths?: string[] | null;
  createdBy?: string;
  createdAt?: string;
  canEdit:boolean
}

interface DropdownOption {
  id: string;
  name: string;
}

// Matches AttachmentDTO(Guid Id, string FileName, string Url) from SelectedPostByIdDTO
interface ExistingAttachment {
  id: string;
  fileName: string;
  url: string;
}

// Matches SelectedPostByIdDTO shape (camelCase JSON) — adjust field names here
// if your JSON serializer settings differ, or if post-internal's DTO diverges.
interface DocDetail {
  documentNumber: string;
  subject: string;
  summary: string;
  notes: string;
  companyId: string;
  publisherId: string;
  publishedArea?: string;
  recievedFromId: string;
  oldReferenceNumber?: string; // incoming only — new field
  workTypeId: string;
  documentDate: string;
  deliveryDate: string;
  deliveryMethod: number;
  status: number;
  postDocumentType: number;
  attachments: ExistingAttachment[];
  // post-transformer-only extras — optional because SelectedPostByIdDTO (external)
  // doesn't have them; if post-internal/transformer's DTO differs, adjust here.
  inComingNumber?: string;
  postNumber?: string;
  recivedByName?: string;
  documentType?: number;
  projectId?: string;
}

interface UpdateFormData {
  documentNumber: string;
  subject: string;
  summary: string;
  notes: string;
  documentDate: string;
  deliveryDate: string;
  companyId: string;
  publishedId: string;
  receivedFromId: string;
  workTypeId: string;
  oldReferenceNumber: string;
  inComingNumber: string;
  postNumber: string;
  recivedByName: string;
  documentType: string;      // transformer-only enum: 1=إيميل, 2=مذكرة داخلية
  postDocumentType: string;  // PostDocumentTypes enum: 1=مدني عام, 2=إليكتروميكانيك (was the broken "deptSelection")
  status: string;            // Status enum: 1=مكتمل, 2=قيد التنفيذ, 3=مرفوض, 4=معتمد, 5=قيد المراجعة, 6=لا شئ
  projectId: string;
  deliveryMethod: string;
  [key: string]: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

type DocType = 'post-external' | 'post-internal' | 'post-transformer' | 'incoming';

const DOC_TYPES: { value: DocType; label: string; prefix: string }[] = [
  { value: 'post-external',    label: 'صادر خارجي',  prefix: 'SDE-' },
  { value: 'post-internal',    label: 'صادر داخلي',  prefix: 'SDI-' },
  { value: 'post-transformer', label: 'صادر محول',   prefix: 'TRN-' },
  { value: 'incoming',         label: 'وارد',         prefix: 'WRD-' },
];

const prefixedSerial = (num: number, type: DocType) => {
  const prefix = DOC_TYPES.find(t => t.value === type)?.prefix ?? '';
  return `${prefix}${num}`;
};

// Same enum as GenericPostForm's create form (DEPT_TYPE_OPTS) — this is the
// ONE correct "نوع القسم" for PostDocumentTypes. The old 3-option list
// (الميكانيكا/الكهرباء/مدني عام) that used to live here read from a
// nonexistent `data.department` field and always saved as NaN. Removed.
const DEPT_TYPE_OPTS: DropdownOption[] = [
  { id: '1', name: 'مدني عام' },
  { id: '2', name: 'إليكتروميكانيك' },
];

const DOC_TYPE_OPTS: DropdownOption[] = [
  { id: '1', name: 'إيميل' },
  { id: '2', name: 'مذكرة داخلية' },
  { id: '2', name: 'طلب شراء' },
];

const DELIVERY_METHOD_OPTS: DropdownOption[] = [
  { id: '1', name: 'يدويا' },
  { id: '2', name: 'إيميل' },
  { id: '3', name: 'فاكس' },
];

// Matches the backend `Status` enum (CompanyPost.Domain / wherever it lives):
//   1=Completed, 2=InProgress, 3=Rejected, 4=Approved, 5=UnderRevision, 6=Nothing
const STATUS_OPTS: DropdownOption[] = [
  { id: '1', name: 'مكتمل' },
  { id: '2', name: 'قيد التنفيذ' },
  { id: '3', name: 'مرفوض' },
  { id: '4', name: 'معتمد' },
  { id: '5', name: 'قيد المراجعة' }
];

const getStatusLabel = (status?: number | string): string => {
  if (status === undefined || status === null || status === '') return '—';
  const opt = STATUS_OPTS.find(s => s.id === String(status));
  return opt?.name ?? '—';
};

// Badge color per status — matches the real BadgeVariant union from '../components/UI'
// ('blue' | 'gold' | 'green' | 'red' | 'purple' | 'gray' | 'navy').
// const getStatusBadgeVariant = (status?: number | string): BadgeVariant => {
//   switch (String(status)) {
//     case '1': return 'green';   // مكتمل
//     case '2': return 'blue';    // قيد التنفيذ
//     case '3': return 'red';     // مرفوض
//     case '4': return 'navy';    // معتمد
//     case '5': return 'gold';    // قيد المراجعة
//     default:  return 'gray';    // لا شئ / unknown
//   }
// };

const EMPTY_FORM: UpdateFormData = {
  documentNumber: '', subject: '', summary: '', notes: '',
  documentDate: '', deliveryDate: '', companyId: '', publishedId: '',
  receivedFromId: '', workTypeId: '', inComingNumber: '', oldReferenceNumber: '',
  postNumber: '', recivedByName: '', documentType: '', postDocumentType: '', status: '',
  projectId: '', deliveryMethod: '1',
};

type ColumnKey =
  | 'serialNumber' | 'documentNumber' | 'subject' | 'documentDate'
  | 'deliveryDate' | 'status' | 'createdBy' | 'createdAt' | 'attachments' | 'actions';

interface ColumnDef {
  key: ColumnKey;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
}

const COLUMNS: ColumnDef[] = [
  { key: 'serialNumber',   label: 'الرقم التسلسلي', sortable: true,  filterable: true },
  { key: 'documentNumber', label: 'رقم المستند',     sortable: true,  filterable: true },
  { key: 'subject',        label: 'الموضوع',         sortable: true,  filterable: true },
  { key: 'documentDate',   label: 'تاريخ المستند',   sortable: true,  filterable: true },
  { key: 'deliveryDate',   label: 'تاريخ التسليم',   sortable: true,  filterable: true },
 // { key: 'status',         label: 'الحالة',          sortable: true,  filterable: true },
  { key: 'createdBy',      label: 'أنشئ بواسطة',    sortable: true,  filterable: true },
  { key: 'createdAt',      label: 'تاريخ الإنشاء',   sortable: true,  filterable: true },
  { key: 'attachments',    label: 'المرفقات',        sortable: false, filterable: false },
  { key: 'actions',        label: 'إجراءات',         sortable: false, filterable: false },
];

const SortIcon = ({ active, direction }: { active: boolean; direction?: 'asc' | 'desc' }) => (
  <span className="inline-flex flex-col ms-1 -space-y-0.5 align-middle">
    <svg className={`w-2 h-2 ${active && direction === 'asc' ? 'text-navy-mid' : 'text-slate-300'}`} viewBox="0 0 8 8" fill="currentColor">
      <path d="M4 1l3 3H1z" />
    </svg>
    <svg className={`w-2 h-2 ${active && direction === 'desc' ? 'text-navy-mid' : 'text-slate-300'}`} viewBox="0 0 8 8" fill="currentColor">
      <path d="M4 7L1 4h6z" />
    </svg>
  </span>
);

// ─── Small UI helpers ─────────────────────────────────────────────────────────

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-xs font-bold text-navy-dark mb-1 font-cairo">{children}</label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={`h-10 w-full border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface outline-none focus:border-navy-mid focus:bg-white transition-colors ${props.readOnly ? 'opacity-60 cursor-not-allowed' : ''} ${props.className ?? ''}`}
  />
);

const SelectField: React.FC<{
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ value, onChange, children, disabled }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    disabled={disabled}
    className="h-10 w-full border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface outline-none focus:border-navy-mid focus:bg-white transition-colors disabled:opacity-50"
  >
    {children}
  </select>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DocumentsViewPage() {
  // ── Filter state ──
  const [selectedType, setSelectedType] = useState<DocType>('post-external');
  const [startDate,       setStartDate]       = useState('');
  const [endDate,         setEndDate]         = useState('');
  const [documentNumber,  setDocumentNumber]  = useState('');
  const [inComingNumber,  setInComingNumber]  = useState('');
  const [filterProjectId, setFilterProjectId] = useState('');

  // ── Data state ──
  const [documents, setDocuments] = useState<Doc[]>([]);
 // const [projects,  setProjects]  = useState<DropdownOption[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  // ── Attachment (read-only) modal — used from the table row action ──
  const [attachmentModal, setAttachmentModal] = useState<{ open: boolean; items: Attachment[] }>({
    open: false, items: [],
  });

  // ── Update dialog ──
  const [openUpdate,    setOpenUpdate]    = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [formData,      setFormData]      = useState<UpdateFormData>({ ...EMPTY_FORM });
  const [selectedId,    setSelectedId]    = useState<string | null>(null);

  // جهة الصدور / جهة التسليم — client-side only, never sent to the backend.
  // The backend only stores publishedId/receivedFromId as raw GUIDs with no
  // type flag, so on load we infer Department vs Project vs Company by
  // checking which fetched list contains the id (same as create form).
  const [publisherType, setPublisherType] = useState<'' | 'Department' | 'Project'>('');
  const [deliveryType,  setDeliveryType]  = useState<'' | 'Department' | 'Project' | 'Company'>('');

  const [dropdownData, setDropdownData]   = useState<{
    departments: DropdownOption[];
    projectsList: DropdownOption[];
    suppliers:  DropdownOption[]; // "company as delivery target" — post-transformer/external only
    companies:  DropdownOption[]; // "الشركة" field itself
    categories: DropdownOption[]; // work types
  }>({ departments: [], projectsList: [], suppliers: [], companies: [], categories: [] });

  // ── Attachments in the edit dialog ──
  const [existingAttachments,     setExistingAttachments]     = useState<ExistingAttachment[]>([]);
  const [attachmentIdsToDelete,   setAttachmentIdsToDelete]   = useState<string[]>([]);
  const [newAttachmentFiles,      setNewAttachmentFiles]      = useState<File[]>([]);

  // ── Pagination / search ──
  const [page,        setPage]        = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const PAGE_SIZE = 10;

  // ── Table sorting & per-column filters (client-side, over the already fetched results) ──
  const [sortConfig, setSortConfig] = useState<{ key: ColumnKey; direction: 'asc' | 'desc' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Partial<Record<ColumnKey, string>>>({});

  const token = () => localStorage.getItem('authToken');
  const authHeader = () => ({ Authorization: `Bearer ${token()}` });

  // Options shown in "صادر من" once جهة الصدور is picked
  const publisherOpts = useMemo<DropdownOption[]>(() => {
    if (publisherType === 'Department') return dropdownData.departments;
    if (publisherType === 'Project')    return dropdownData.projectsList;
    return [];
  }, [publisherType, dropdownData]);

  // Options shown in "مستلم من" once جهة التسليم is picked
  const deliveryOpts = useMemo<DropdownOption[]>(() => {
    if (deliveryType === 'Department') return dropdownData.departments;
    if (deliveryType === 'Project')    return dropdownData.projectsList;
    if (deliveryType === 'Company')    return dropdownData.suppliers;
    return [];
  }, [deliveryType, dropdownData]);

  // Returns the human-readable value for a column, used for both filtering and sorting
  const getDisplayValue = (doc: Doc, key: ColumnKey): string => {
    switch (key) {
      case 'serialNumber': return prefixedSerial(doc.serialNumber, selectedType);
      case 'documentDate': return doc.documentDate?.substring(0, 10) || '';
      case 'deliveryDate': return doc.deliveryDate?.substring(0, 10) || '';
      case 'createdAt':    return doc.createdAt?.substring(0, 10) || '';
      case 'status':       return getStatusLabel(doc.statusMethod);
      default: {
        const v = (doc as any)[key];
        return v != null ? String(v) : '';
      }
    }
  };

  // ── Load filter projects on mount ──
  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const res = await fetch(`${API_BASE_URL}/Publisher/get-projects`, { headers: authHeader() });
  //       const data = await res.json();
  //       setProjects(Array.isArray(data) ? data : []);
  //     } catch { setProjects([]); }
  //   })();
  // }, []);

  // ─── Fetch documents (same URL pattern as legacy) ─────────────────────────
  const handleViewDocuments = async () => {
    const allEmpty = !documentNumber && !inComingNumber && !filterProjectId;
    if (allEmpty && (!startDate || !endDate)) {
      setError('يرجى تحديد نطاق زمني أو فلتر للبحث');
      return;
    }
    setLoading(true);
    setError('');
    setPage(1);
    try {
      const qs = new URLSearchParams();
      if (startDate)       qs.append('startDate',      startDate);
      if (endDate)         qs.append('endDate',         endDate);
      if (documentNumber)  qs.append('documentNumber',  documentNumber);
      if (inComingNumber)  qs.append('incomingNumber',  inComingNumber);
      if (filterProjectId) qs.append('projectId',       filterProjectId);

      const url = `${API_BASE_URL}/Documents/${selectedType}${qs.toString() ? `?${qs}` : ''}`;
      const res = await fetch(url, { headers: authHeader() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch {
      setError('حدث خطأ أثناء جلب المستندات');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setDocumentNumber('');
    setInComingNumber('');
    setFilterProjectId('');
    setDocuments([]);
    setError('');
    setPage(1);
    clearTableFilters();
  };

  // ─── Attachments (read-only view from table row) ──────────────────────────
  const handleViewAttachments = (files: string[] | null | undefined) => {
    const valid = (files ?? []).map(fp => ({
      filePath: fp,
      fileName: fp.split('/').pop() ?? fp,
    }));
    setAttachmentModal({ open: true, items: valid });
  };

  // ─── Open update dialog ────────────────────────────────────────────────────
  const findOptionType = (
    id: string,
    departments: DropdownOption[],
    projectsList: DropdownOption[],
    suppliers: DropdownOption[],
  ): '' | 'Department' | 'Project' | 'Company' => {
    if (!id) return '';
    if (departments.some(d => d.id === id)) return 'Department';
    if (projectsList.some(p => p.id === id)) return 'Project';
    if (suppliers.some(s => s.id === id))    return 'Company';
    return '';
  };

 const handleOpenUpdate = async (id: string) => {
  try {
    setUpdateLoading(true);

    const docRes = await fetch(`${API_BASE_URL}/Documents/${selectedType}/${id}`, { headers: authHeader() });
    if (!docRes.ok) throw new Error();
    const data: DocDetail = await docRes.json();

    const [departments, projectsList, suppliers, companies, workTypes] = await Promise.all([
      fetch(`${API_BASE_URL}/Department/get-departments`, { headers: authHeader() }).then(r => r.json()),
      fetch(`${API_BASE_URL}/Publisher/get-projects`,     { headers: authHeader() }).then(r => r.json()),
      fetch(`${API_BASE_URL}/WorkTypes/get-worktypes`,    { headers: authHeader() }).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE_URL}/Company/get-companies`,      { headers: authHeader() }).then(r => r.json()),
      fetch(`${API_BASE_URL}/WorkTypes/get-worktypes`,    { headers: authHeader() }).then(r => r.json()),
    ]);

    const deptOpts     = Array.isArray(departments)  ? departments  : [];
    const projOpts     = Array.isArray(projectsList) ? projectsList : [];
    const supplierOpts = Array.isArray(suppliers)    ? suppliers    : [];

    setDropdownData({
      departments: deptOpts,
      projectsList: projOpts,
      suppliers: supplierOpts,
      companies: Array.isArray(companies) ? companies : [],
      categories: Array.isArray(workTypes) ? workTypes : [],
    });

    // incoming uses PublishedArea; everything else uses publisherId
    const isIncomingType = selectedType === 'incoming';
    const rawPublisherId = isIncomingType ? (data.publishedArea ?? '') : data.publisherId;

    setPublisherType(
      (findOptionType(rawPublisherId, deptOpts, projOpts, []) as '' | 'Department' | 'Project'),
    );
    setDeliveryType(findOptionType(data.recievedFromId, deptOpts, projOpts, supplierOpts));

    console.log(data);

    setFormData({
      documentNumber:   data.documentNumber   ?? '',
      subject:          data.subject          ?? '',
      summary:          data.summary          ?? '',
      notes:            data.notes            ?? '',
      documentDate:     data.documentDate?.split('T')[0] ?? '',
      deliveryDate:     data.deliveryDate?.split('T')[0] ?? '',
      companyId:        data.companyId        ?? '',
      publishedId:      rawPublisherId         ?? '',   // ← use the resolved value
      receivedFromId:   data.recievedFromId   ?? '',
      workTypeId:       data.workTypeId       ?? '',
      inComingNumber:   data.inComingNumber   ?? '',
      oldReferenceNumber: data.oldReferenceNumber ?? '',   // ← new
      postNumber:       data.postNumber       ?? '',
      recivedByName:    data.recivedByName    ?? '',
      documentType:     data.documentType?.toString() ?? '',
      postDocumentType: data.postDocumentType?.toString() ?? '',
      status:           data.status?.toString() ?? '',
      projectId:        data.projectId        ?? '',
      deliveryMethod:   data.deliveryMethod?.toString() ?? '1',
    });

    setExistingAttachments(data.attachments ?? []);
    setAttachmentIdsToDelete([]);
    setNewAttachmentFiles([]);

    setSelectedId(id);
    setOpenUpdate(true);
  } catch {
    alert('حدث خطأ أثناء تحميل تفاصيل المستند');
  } finally {
    setUpdateLoading(false);
  }
};

  const handleCloseUpdate = () => {
    setOpenUpdate(false);
    setFormData({ ...EMPTY_FORM });
    setPublisherType('');
    setDeliveryType('');
    setExistingAttachments([]);
    setAttachmentIdsToDelete([]);
    setNewAttachmentFiles([]);
    setSelectedId(null);
  };

  // ─── Attachment handlers (edit dialog) ─────────────────────────────────────
  // Removes the attachment from the visible list immediately and queues its id
  // for deletion on save.
  const removeExistingAttachment = (attId: string) => {
    setAttachmentIdsToDelete(prev => (prev.includes(attId) ? prev : [...prev, attId]));
    setExistingAttachments(prev => prev.filter(a => a.id !== attId));
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ─── Attachment handlers (edit dialog) ─────────────────────────────────────
  // const toggleDeleteExisting = (attId: string) => {
  //   setAttachmentIdsToDelete(prev =>
  //     prev.includes(attId) ? prev.filter(x => x !== attId) : [...prev, attId],
  //   );
  // };

  const handleNewFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = e.target.files;
    if (!incoming) return;
    const next = [...newAttachmentFiles];
    Array.from(incoming).forEach(f => {
      if (!next.some(x => x.name === f.name && x.size === f.size)) next.push(f);
    });
    setNewAttachmentFiles(next);
    e.target.value = '';
  };

  const removeNewFile = (index: number) => {
    setNewAttachmentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveUpdate = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('documentNumber', formData.documentNumber);
      fd.append('subject',        formData.subject);
      fd.append('summary',        formData.summary);
      fd.append('notes',          formData.notes);
      fd.append('documentDate',   formData.documentDate);
      fd.append('deliveryDate',   formData.deliveryDate);
      fd.append('companyId',      formData.companyId);
      fd.append('oldReferenceNumber', formData.oldReferenceNumber || '');
      fd.append('inComingNumber',     formData.inComingNumber || '');
      if (isIncoming) {
          fd.append('publishedArea',      formData.publishedId);
          fd.append('receivedFromId',     formData.receivedFromId || '');
          fd.append('projectId',          formData.projectId);
          fd.append('originalsender',     formData.originalsender || '');

          fd.append('documentType',       formData.documentType || '0');
        } else {
          fd.append('publishedId', formData.publishedId);
        }
    //  fd.append('publishedId',    formData.publishedId);
      fd.append('receivedFromId', formData.receivedFromId);
      fd.append('workTypeId',     formData.workTypeId);
      fd.append('deliveryMethod', formData.deliveryMethod || '1');
      // Maps to `department` on UpdatePostExternalDocumentRequestDTO (== PostDocumentTypes)
      fd.append('department',     formData.postDocumentType);
      // Maps to `status` on UpdatePostExternalDocumentRequestDTO (== Status enum)
      fd.append('status',         formData.status);

      if (isTransformer) {
        fd.append('inComingNumber', formData.inComingNumber);
        fd.append('postNumber',     formData.postNumber);
        fd.append('recivedByName',  formData.recivedByName);
        fd.append('documentType',   formData.documentType);
      }
      if (isIncoming) {
        fd.append('projectId', formData.projectId);
      }

      newAttachmentFiles.forEach(f => fd.append('Attachments', f));
      attachmentIdsToDelete.forEach(id => fd.append('AttachmentIdsToDelete', id));

      const res = await fetch(`${API_BASE_URL}/Documents/${selectedType}/${selectedId}`, {
        method: 'PUT',
        headers: authHeader(), // no Content-Type — browser sets multipart boundary
        body: fd,
      });
      if (!res.ok) throw new Error();
      alert('تم تحديث المستند بنجاح ✅');
      handleCloseUpdate();
      handleViewDocuments();
    } catch {
      alert('حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  };

  // ─── Sorting / column filter handlers ─────────────────────────────────────
  const handleSort = (key: ColumnKey) => {
    setSortConfig(prev => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null; // third click clears sorting for that column
    });
  };

  const handleColumnFilterChange = (key: ColumnKey, value: string) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearTableFilters = () => {
    setColumnFilters({});
    setSortConfig(null);
    setPage(1);
  };

  const hasActiveColumnFilters = Object.values(columnFilters).some(v => !!v);

  // ─── Derived / pagination ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = documents.filter(d =>
      !searchQuery ||
      d.subject?.includes(searchQuery) ||
      d.documentNumber?.includes(searchQuery) ||
      d.companyName?.includes(searchQuery)
    );

    (Object.keys(columnFilters) as ColumnKey[]).forEach(key => {
      const term = columnFilters[key];
      if (!term) return;
      result = result.filter(d => getDisplayValue(d, key).toLowerCase().includes(term.toLowerCase()));
    });

    if (sortConfig) {
      const { key, direction } = sortConfig;
      result = [...result].sort((a, b) => {
        const av = getDisplayValue(a, key);
        const bv = getDisplayValue(b, key);
        const an = parseFloat(av);
        const bn = parseFloat(bv);
        const bothNumeric = av !== '' && bv !== '' && !isNaN(an) && !isNaN(bn);
        const cmp = bothNumeric ? an - bn : av.localeCompare(bv, 'ar');
        return direction === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [documents, searchQuery, columnFilters, sortConfig, selectedType]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Whether specific fields should show in update dialog ──
  const isTransformer = selectedType === 'post-transformer';
  const isIncoming    = selectedType === 'incoming';
  const showCompany   = selectedType === 'post-transformer' ||
                        selectedType === 'post-external' ||
                        selectedType === 'post-internal';
  // جهة التسليم company option — mirrors GenericPostForm's enableCompanyDelivery,
  // only offered where a supplier/company can legitimately be a receiving party.
  const allowCompanyDelivery = selectedType === 'post-external' || selectedType === 'post-transformer';

  const handleDownloadAttachment = async (filePath: string, fileName: string) => {
    try {
      const cleanPath = filePath.replace(/^\/+/, '');
      const res = await fetch(`${API_BASE_URL}/files/${cleanPath}`, {});
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('تعذر تحميل الملف، يرجى المحاولة مرة أخرى.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in" dir="rtl">
      {/* ── Page header ── */}
      <div className="mb-1 text-xl font-bold text-navy-dark">بحث و عرض المستندات</div>
      <div className="mb-6 text-sm text-muted">
        يمكنك استعراض المستندات، تحديثها، أو حذفها من خلال هذه الصفحة
      </div>

      {/* ── Document type tabs ── */}
      <div className="flex gap-0 border-b-2 border-border mb-6">
        {DOC_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => { setSelectedType(t.value); resetFilters(); }}
            className={`px-5 py-2.5 text-sm font-bold font-cairo border-none bg-transparent cursor-pointer border-b-2 -mb-0.5 transition-all ${
              selectedType === t.value
                ? 'text-navy-mid border-navy-mid'
                : 'text-muted border-transparent hover:text-navy-dark'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Filters card ── */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4"
        onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleViewDocuments();
            }
          }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

          <div>
            <Label>من تاريخ</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>

          <div>
            <Label>إلى تاريخ</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={!startDate} />
          </div>

          <div>
            <Label>رقم المستند</Label>
            <Input
              value={documentNumber}
              onChange={e => setDocumentNumber(e.target.value)}
              placeholder="أدخل رقم المستند"
            />
          </div>

          <div>
            <Label>رقم الوارد</Label>
            <Input
              value={inComingNumber}
              onChange={e => setInComingNumber(e.target.value)}
              placeholder="أدخل رقم الوارد"
            />
          </div>

          {/* <div>
            <Label>المشروع</Label>
            <SearchableSelect
              options={projects}
              value={filterProjectId}
              onChange={setFilterProjectId}
              placeholder="اختر المشروع"
            />
          </div> */}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={resetFilters}>
            إعادة تعيين
          </Button>
          <Button onClick={handleViewDocuments} loading={loading}>
            عرض المستندات
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert type="error" onClose={() => setError('')}>{error}</Alert>
        </div>
      )}

      {/* ── Table card ── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* table header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-navy-dark">المستندات</span>
            <Badge variant="blue">{filtered.length} مستند</Badge>
            {hasActiveColumnFilters || sortConfig ? (
              <button
                onClick={clearTableFilters}
                className="h-6 px-2 rounded-md border border-border text-[10px] font-cairo text-muted hover:bg-surface hover:text-navy-dark transition-colors cursor-pointer bg-transparent"
              >
                مسح فرز/فلاتر الجدول
              </button>
            ) : null}
          </div>
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            className="h-8 w-48 border border-border rounded-lg px-3 text-xs font-cairo bg-surface outline-none focus:border-navy-mid"
            placeholder="بحث..."
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={`py-2.5 px-4 bg-surface text-muted font-bold text-xs border-b border-border text-right whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none' : ''}`}
                    >
                      <span className="inline-flex items-center">
                        {col.label}
                        {col.sortable && (
                          <SortIcon
                            active={sortConfig?.key === col.key}
                            direction={sortConfig?.key === col.key ? sortConfig.direction : undefined}
                          />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
                <tr>
                  {COLUMNS.map(col => (
                    <th key={`filter-${col.key}`} className="py-1.5 px-4 bg-surface border-b border-border">
                      {col.key === 'status' ? (
                        <select
                          value={columnFilters.status || ''}
                          onChange={e => handleColumnFilterChange('status', e.target.value)}
                          className="h-6 w-full border border-border rounded-md px-1 text-[10px] font-cairo bg-white outline-none focus:border-navy-mid"
                        >
                          <option value="">الكل</option>
                          {STATUS_OPTS.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                        </select>
                      ) : col.filterable ? (
                        <input
                          value={columnFilters[col.key] || ''}
                          onChange={e => handleColumnFilterChange(col.key, e.target.value)}
                          placeholder="فلترة..."
                          className="h-6 w-full border border-border rounded-md px-2 text-[10px] font-cairo bg-white outline-none focus:border-navy-mid"
                        />
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="py-12 text-center text-muted font-cairo">
                      لا توجد بيانات — اختر نوع المستند واضغط عرض المستندات
                    </td>
                  </tr>
                )}
                {paginated.map(doc => {
                  const hasAtt = !!doc.attachmentPaths?.length;
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 border-b border-border font-mono font-bold text-navy-mid text-xs whitespace-nowrap">
                        {prefixedSerial(doc.serialNumber, selectedType)}
                      </td>
                      <td className="py-2.5 px-4 border-b border-border text-navy-dark">{doc.documentNumber}</td>
                      <td className="py-2.5 px-4 border-b border-border text-navy-dark max-w-xs truncate">{doc.subject}</td>
                      <td className="py-2.5 px-4 border-b border-border font-mono text-muted whitespace-nowrap">
                        {doc.documentDate?.substring(0, 10)}
                      </td>
                      <td className="py-2.5 px-4 border-b border-border font-mono text-muted whitespace-nowrap">
                        {doc.deliveryDate?.substring(0, 10)}
                      </td>
                      
                      <td className="py-2.5 px-4 border-b border-border text-muted whitespace-nowrap">{doc.createdBy}</td>
                      <td className="py-2.5 px-4 border-b border-border font-mono text-muted whitespace-nowrap">
                        {doc.createdAt?.substring(0, 10)}
                      </td>
                      <td className="py-2.5 px-4 border-b border-border">
                        <button
                          onClick={() => handleViewAttachments(doc.attachmentPaths)}
                          disabled={!hasAtt}
                          className="h-7 px-3 rounded-md border border-border bg-transparent text-xs font-cairo cursor-pointer transition-colors hover:bg-surface hover:text-navy-dark text-muted disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {hasAtt ? `عرض (${doc.attachmentPaths!.length})` : 'لا يوجد'}
                        </button>
                      </td>
                      <td className="py-2.5 px-4 border-b border-border">
                        {doc.canEdit?<div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenUpdate(doc.id)}
                            disabled={updateLoading}
                            className="h-7 px-3 rounded-md border border-navy-mid bg-navy-mid text-white text-xs font-cairo font-bold cursor-pointer transition-colors hover:opacity-80 disabled:opacity-40"
                          >
                            تعديل
                          </button>
                        </div>:null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 px-5 py-3 border-t border-border">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 px-3 rounded-md border border-border bg-card text-xs text-muted cursor-pointer transition-colors hover:bg-surface hover:text-navy-dark disabled:opacity-40 disabled:cursor-not-allowed font-cairo"
            >
              ‹ السابق
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-8 min-w-8 px-2 rounded-md border font-cairo text-xs cursor-pointer transition-colors ${
                  page === p
                    ? 'bg-navy-mid text-white border-navy-mid'
                    : 'bg-card border-border text-muted hover:bg-surface hover:text-navy-dark'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 px-3 rounded-md border border-border bg-card text-xs text-muted cursor-pointer transition-colors hover:bg-surface hover:text-navy-dark disabled:opacity-40 disabled:cursor-not-allowed font-cairo"
            >
              التالي ›
            </button>
          </div>
        )}
      </div>

      {/* ── Read-only attachment modal (table row action) ── */}
      <Modal
        open={attachmentModal.open}
        onClose={() => setAttachmentModal({ open: false, items: [] })}
        title="المرفقات"
        footer={
          <Button variant="secondary" onClick={() => setAttachmentModal({ open: false, items: [] })}>
            إغلاق
          </Button>
        }
      >
        {attachmentModal.items.length === 0 ? (
          <Alert type="info">لا توجد مرفقات متاحة</Alert>
        ) : (
          <ul className="space-y-2">
            {attachmentModal.items.map((a, i) => (
              <li key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface">
                <Badge variant="blue">{a.fileName}</Badge>
                <a
                  onClick={() => handleDownloadAttachment(a.filePath, a.fileName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-navy-mid hover:underline font-cairo cursor-pointer"
                >
                  تحميل ↗
                </a>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {/* ── Update dialog ── */}
      <Modal
        open={openUpdate}
        onClose={handleCloseUpdate}
        title="تحديث بيانات المستند"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={handleCloseUpdate}>إلغاء</Button>
            <Button onClick={handleSaveUpdate} loading={saving}>
              حفظ التعديلات
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* رقم المستند (read-only) */}
          <div>
            <Label>رقم المستند</Label>
            <Input value={formData.documentNumber} readOnly />
          </div>

          {/* الحالة — new */}
          <div>
            <Label>الحالة</Label>
            <SelectField value={formData.status} onChange={v => handleFormChange('status', v)}>
              <option value="">اختر</option>
              {STATUS_OPTS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </SelectField>
          </div>

          {/* طريقة التسليم */}
          <div>
            <Label>طريقة التسليم</Label>
            <SelectField value={formData.deliveryMethod} onChange={v => handleFormChange('deliveryMethod', v)}>
              <option value="">اختر</option>
              {DELIVERY_METHOD_OPTS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </SelectField>
          </div>

          {/* جهة الصدور — was missing */}
          <div>
            <Label>جهة الإصدار</Label>
            <SelectField
              value={publisherType}
              onChange={v => { setPublisherType(v as any); handleFormChange('publishedId', ''); }}
            >
              <option value="">اختر...</option>
              <option value="Department">إدارة</option>
              <option value="Project">مشروع</option>
            </SelectField>
          </div>

          {/* صادر من */}
          <div>
            <Label>صادر من</Label>
            <SearchableSelect
              options={publisherOpts}
              value={formData.publishedId}
              onChange={v => handleFormChange('publishedId', v)}
              disabled={!publisherType}
              placeholder="اختر"
            />
          </div>

   {!isIncoming && (
  <>
    {/* جهة التسليم */}
    <div>
      <Label>جهة التسليم</Label>
      <SelectField
        value={deliveryType}
        onChange={(v) => {
          setDeliveryType(v as any);
          handleFormChange("receivedFromId", "");
        }}
      >
        <option value="">اختر...</option>
        <option value="Department">إدارة</option>
        <option value="Project">مشروع</option>
        {allowCompanyDelivery && <option value="Company">شركة</option>}
      </SelectField>
    </div>

    {/* مستلم من */}
    <div>
      <Label>مستلم من</Label>
      <SearchableSelect
        options={deliveryOpts}
        value={formData.receivedFromId}
        onChange={(v) => handleFormChange("receivedFromId", v)}
        disabled={!deliveryType}
        placeholder="اختر"
      />
    </div>
  </>
)}
          {/* الشركة — post-external, post-internal, post-transformer */}
          {showCompany && (
            <div className="md:col-span-2">
              <Label>الشركة</Label>
              <SelectField value={formData.companyId} onChange={v => handleFormChange('companyId', v)}>
                <option value="">اختر</option>
                {dropdownData.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </SelectField>
            </div>
          )}

          {/* المشروع — incoming only */}
          {isIncoming && (
            <div className="md:col-span-2">
              <Label>المشروع</Label>
              <SearchableSelect
                options={dropdownData.projectsList}
                value={formData.projectId}
                onChange={v => handleFormChange('projectId', v)}
                placeholder="اختر"
              />
            </div>
          )}

          {/* الحالة — new */}

          {/* نوع العمل */}
          {/* <div className="md:col-span-2">
            <Label>نوع الأعمال</Label>
            <SearchableSelect
              options={dropdownData.categories}
              value={formData.workTypeId}
              onChange={v => handleFormChange('workTypeId', v)}
              placeholder="اختر"
            />
          </div> */}

          {/* نوع القسم — FIXED: now uses the real PostDocumentTypes enum,
              same options as the create form, instead of the previous
              unrelated 3-option list that was reading a nonexistent field. */}
          <div className="md:col-span-2">
            <Label>نوع القسم</Label>
            <SelectField value={formData.postDocumentType} onChange={v => handleFormChange('postDocumentType', v)}>
              <option value="">اختر</option>
              {DEPT_TYPE_OPTS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </SelectField>
          </div>

           <div>
                      <Label>الرقم المرجعي القديم</Label>
                      <Input
                        value={formData.oldReferenceNumber}
                        onChange={e => handleFormChange('oldReferenceNumber', e.target.value)}
                      />
          </div>
          

                    <div>
                      <Label>رقم الوارد</Label>
                      <Input
                        value={formData.inComingNumber}
                        onChange={e => handleFormChange('inComingNumber', e.target.value)}
                      />
                    </div>

          {isIncoming && (
                  <>
                  <div className="md:col-span-2">
                      <Label>نوع المستند</Label>
                      <SelectField value={formData.documentType} onChange={v => handleFormChange('documentType', v)}>
                        <option value="">اختر</option>
                        {DOC_TYPE_OPTS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </SelectField>
                  </div>
                   
                  </>
                )}

          {/* الموضوع */}
          <div className="md:col-span-2">
            <Label>الموضوع</Label>
            <Input value={formData.subject} onChange={e => handleFormChange('subject', e.target.value)} />
          </div>

          {/* ملخص */}
          <div className="md:col-span-2">
            <Label>ملخص</Label>
            <Input value={formData.summary} onChange={e => handleFormChange('summary', e.target.value)} />
          </div>

          {/* ملاحظات */}
          <div className="md:col-span-2">
            <Label>ملاحظات</Label>
            <Input value={formData.notes} onChange={e => handleFormChange('notes', e.target.value)} />
          </div>

          {/* تاريخ المستند */}
          <div>
            <Label>تاريخ المستند</Label>
            <Input
              type="date"
              value={formData.documentDate}
              onChange={e => handleFormChange('documentDate', e.target.value)}
            />
          </div>

          {/* تاريخ التسليم */}
          <div>
            <Label>تاريخ التسليم</Label>
            <Input
              type="date"
              value={formData.deliveryDate}
              onChange={e => handleFormChange('deliveryDate', e.target.value)}
            />
          </div>

          {/* Extra fields — post-transformer only */}
          {isTransformer && (
            <>

              <div>
                <Label>رقم الصادر</Label>
                <Input
                  value={formData.postNumber}
                  onChange={e => handleFormChange('postNumber', e.target.value)}
                />
              </div>
{/* 
              <div>
                <Label>اسم المستلم</Label>
                <Input
                  value={formData.recivedByName}
                  onChange={e => handleFormChange('recivedByName', e.target.value)}
                />
              </div> */}
{/* 
              <div>
                <Label>نوع المستند</Label>
                <SelectField value={formData.documentType} onChange={v => handleFormChange('documentType', v)}>
                  <option value="">اختر</option>
                  <option value="1">إيميل</option>
                  <option value="2">مذكرة داخلية</option>
                </SelectField>
              </div> */}
            </>
          )}

          {/* ── Attachments — was completely missing from the edit dialog ── */}
          <div className="md:col-span-2">
            <Label>المرفقات</Label>

            {existingAttachments.length === 0 && newAttachmentFiles.length === 0 && (
              <div className="text-xs text-muted font-cairo mb-2">لا توجد مرفقات حالياً</div>
            )}

            {existingAttachments.length > 0 && (
              <ul className="space-y-2 mb-2">
                {existingAttachments.map(a => {
                  const marked = attachmentIdsToDelete.includes(a.id);
                  return (
                    <li
                      key={a.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border ${
                        marked ? 'border-red-200 bg-red-50' : 'border-border bg-surface'
                      }`}
                    >
                      <span className={`text-xs font-cairo ${marked ? 'line-through text-red-400' : 'text-navy-dark'}`}>
                        {a.fileName}
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          onClick={() => handleDownloadAttachment(a.url, a.fileName)}
                          className="text-xs text-navy-mid hover:underline font-cairo cursor-pointer"
                        >
                          تحميل ↗
                        </a>
                          <button
                        type="button"
                        onClick={() => removeExistingAttachment(a.id)}
                        className="h-6 px-2 rounded-md border border-red-300 text-red-500 text-[10px] font-cairo cursor-pointer hover:bg-red-100 transition-colors"
                      >
                        حذف
                      </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {newAttachmentFiles.length > 0 && (
              <ul className="space-y-2 mb-2">
                {newAttachmentFiles.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center justify-between p-2.5 rounded-lg border border-navy-mid/30 bg-blue-50">
                    <span className="text-xs font-cairo text-navy-dark">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeNewFile(i)}
                      className="h-6 px-2 rounded-md border border-border text-[10px] font-cairo text-muted hover:bg-white cursor-pointer"
                    >
                      إزالة
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <label className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-dashed border-border text-xs font-cairo text-muted cursor-pointer hover:border-navy-mid hover:text-navy-dark transition-colors">
              + إضافة مرفقات
              <input type="file" multiple className="hidden" onChange={handleNewFilesChange} />
            </label>
          </div>

        </div>
      </Modal>
    </div>
  );
}
