import { useState, useEffect, useMemo } from 'react';
import { Badge, Spinner, Alert, Modal, Button, EmptyState, PageHeader } from '../components/UI';
import { SearchableSelect, FieldWrap } from '../components/SearchableSelect';
import { API_BASE_URL } from '../config/constants';
import type { Option, Contract, Attachment } from '../types';

const CURRENCY_MAP: Record<string, string> = { '1':'USD', '2':'EUR', '3':'EGP', '4':'SAR' };
const DEPT_MAP: Record<string, string> = { '1':'الميكانيكا', '2':'الكهرباء', '3':'مدني عام' };

const DEPT_OPTS: Option[] = [
  { id: '1', name: 'الميكانيكا' }, { id: '2', name: 'الكهرباء' }, { id: '3', name: 'مدني عام' },
];
const CURRENCY_OPTS: Option[] = [
  { id: '1', name: 'دولار أمريكي (USD)' }, { id: '2', name: 'يورو (EUR)' },
  { id: '3', name: 'جنيه مصري (EGP)' },   { id: '4', name: 'ريال سعودي (SAR)' },
];
// const STATUS_OPTS: Option[] = [
//   { id: '1', name: 'مكتمل' }, { id: '2', name: 'قيد التنفيذ' }, { id: '3', name: 'مرفوض' },
//   { id: '4', name: 'معتمد' }, { id: '5', name: 'قيد المراجعة' }, { id: '6', name: 'لا شئ' },
// ];

// Column definitions for the results table (drives header labels, sorting and per-column filters)
type ColumnKey =
  | 'serialNum' | 'contractNum' | 'type' | 'value' | 'currency' | 'contractDate'
  | 'personOrg' | 'department' | 'project' | 'createdBy' | 'attachments' | 'actions' | 'approvalDeliveryDate';

interface ColumnDef {
  key: ColumnKey;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
}

interface ExistingAttachment {
  id: string;
  fileName: string;
  url: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'serialNum',    label: 'الرقم التسلسلي',   sortable: true,  filterable: true },
  { key: 'contractNum',  label: 'رقم العقد',         sortable: true,  filterable: true },
  { key: 'type',         label: 'النوع',             sortable: true,  filterable: true },
  { key: 'value',        label: 'القيمة',            sortable: true,  filterable: true },
  { key: 'currency',     label: 'العملة',            sortable: true,  filterable: true },
  { key: 'contractDate', label: 'التاريخ',           sortable: true,  filterable: true },
  { key: 'personOrg',    label: 'المقاول/المورد',    sortable: true,  filterable: true },
  { key: 'department',   label: 'القسم',             sortable: true,  filterable: true },
  { key: 'project',      label: 'المشروع',           sortable: true,  filterable: true },
  { key: 'createdBy',    label: 'أنشئ بواسطة',      sortable: true,  filterable: true },
  { key: 'attachments',  label: 'المرفقات',          sortable: false, filterable: false },
  { key: 'actions',      label: 'إجراءات',         sortable: false, filterable: false },
  //{ key: 'approvalDeliveryDate', label: 'تاريخ الموافقة على التسليم ', sortable: true, filterable: true },
];

// Returns the human-readable value for a column, used for both filtering and sorting
const getDisplayValue = (doc: Contract, key: ColumnKey): string => {
  switch (key) {
    case 'currency':     return CURRENCY_MAP[doc.currency] ?? doc.currency ?? '';
    case 'department':   return DEPT_MAP[doc.department] ?? doc.department ?? '';
    case 'contractDate': return doc.contractDate?.substring(0, 10) || '';
    case 'value':        return doc.value != null ? String(doc.value) : '';
    default: {
      const v = (doc as any)[key];
      return v != null ? String(v) : '';
    }
  }
};

const SortIcon = ({ active, direction }: { active: boolean; direction?: 'asc' | 'desc' }) => (
  <span className="inline-flex flex-col ms-1 -space-y-0.5 align-middle">
    <svg className={`w-2 h-2 ${active && direction === 'asc' ? 'text-[#00428d]' : 'text-[#c3cbd9]'}`} viewBox="0 0 8 8" fill="currentColor">
      <path d="M4 1l3 3H1z" />
    </svg>
    <svg className={`w-2 h-2 ${active && direction === 'desc' ? 'text-[#00428d]' : 'text-[#c3cbd9]'}`} viewBox="0 0 8 8" fill="currentColor">
      <path d="M4 7L1 4h6z" />
    </svg>
  </span>
);

// Hoisted to module scope so it keeps a stable component identity across renders
// (defining it inside ContractsViewPage caused it to remount on every keystroke,
// which killed focus while typing).
const Input = ({
  label,
  value,
  onChange,
  readOnly,
  inputMode,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  inputMode?: 'text' | 'numeric' | 'decimal';
}) => (
  <FieldWrap label={label}>
    <input
      value={value}
      readOnly={readOnly}
      inputMode={inputMode}
      onChange={e => onChange?.(e.target.value)}
      className={`siac-input ${readOnly ? '!bg-[#f0f2f5] !text-[#6b7a99] !cursor-default' : ''}`}
    />
  </FieldWrap>
);

export default function ContractsViewPage() {
  const [projects,   setProjects]   = useState<Option[]>([]);
  const [suppliers,  setSuppliers]  = useState<Option[]>([]);
  const [workTypes,  setWorkTypes]  = useState<Option[]>([]);
  const [documents,  setDocuments]  = useState<Contract[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [searching,  setSearching]  = useState(false);
  const [error,      setError]      = useState('');
  const [searchQuery,setSearchQuery]= useState('');
  const [page,       setPage]       = useState(1);
  const PAGE_SIZE = 10;

  // Filters
  const [contractRef,     setContractRef]     = useState('');
  const [projectId,       setProjectId]       = useState('');
  const [contractId ]      = useState('');
  const [supplierId,      setSupplierId]      = useState('');
  const [workTypeId,      setWorkTypeId]      = useState('');
  const [departmentId,    setDepartmentId]    = useState('');
  const [purchaseOrderRef,setPurchaseOrderRef]= useState('');
  const [startDate,       setStartDate]       = useState('');
  const [endDate,         setEndDate]         = useState('');

  // Table sorting & per-column filters (client-side, over the already fetched results)
  const [sortConfig, setSortConfig] = useState<{ key: ColumnKey; direction: 'asc' | 'desc' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Partial<Record<ColumnKey, string>>>({});

  // Modals
  const [attModal,    setAttModal]    = useState<{ open: boolean; items: Attachment[] }>({ open: false, items: [] });
  const [updateModal, setUpdateModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Contract | null>(null);
  const [updateFiles, setUpdateFiles] = useState<File[]>([]);

  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);
  const [attachmentIdsToDelete, setAttachmentIdsToDelete] = useState<string[]>([]);
  const [exportingExcel, setExportingExcel] = useState(false);

  useEffect(() => {
    const h = { Authorization: `Bearer ${localStorage.getItem('authToken')}` };
    Promise.all([
      fetch(`${API_BASE_URL}/Publisher/get-projects`, { headers: h }).then(r => r.json()),
      fetch(`${API_BASE_URL}/Publisher/get-suppliers`, { headers: h }).then(r => r.json()),
      fetch(`${API_BASE_URL}/WorkTypes/get-worktypes`, { headers: h }).then(r => r.json()),
    ]).then(([p, s, w]) => {
      setProjects(Array.isArray(p) ? p : []);
      setSuppliers(Array.isArray(s) ? s : []);
      setWorkTypes(Array.isArray(w) ? w : []);
    }).catch(() => {});
  }, []);

  const buildContractsFilterQuery = () => {
  const q = new URLSearchParams();
  if (projectId)        q.append('ProjectId',        projectId);
  if (supplierId)       q.append('PublisherId',      supplierId);
  if (departmentId)     q.append('DepartmentId',     departmentId);
  if (startDate)        q.append('StartDate',        startDate);
  if (endDate)          q.append('EndDate',          endDate);
  if (contractRef)      q.append('ContractRef',      contractRef);
  if (purchaseOrderRef) q.append('PurchaseOrderRef', purchaseOrderRef);
  if (workTypeId)       q.append('WorkTypeId',       workTypeId);
  return q;
};

  const handleSearch = async () => {
    const allEmpty = !contractRef && !projectId && !supplierId && !departmentId && !purchaseOrderRef && !workTypeId && !contractId;
    if (allEmpty && (!startDate || !endDate)) { setError('يرجى تحديد نطاق زمني أو فلتر للبحث'); return; }
    setSearching(true); setError(''); setPage(1);
    try {
      const h = { Authorization: `Bearer ${localStorage.getItem('authToken')}` };
      // const q = new URLSearchParams();
      // if (projectId)        q.append('ProjectId',        projectId);
      // if (supplierId)       q.append('PublisherId',      supplierId);
      // if (departmentId)     q.append('DepartmentId',     departmentId);
      // if (startDate)        q.append('StartDate',        startDate);
      // if (endDate)          q.append('EndDate',          endDate);
      // if (contractRef)      q.append('ContractRef',      contractRef);
      // if (purchaseOrderRef) q.append('PurchaseOrderRef', purchaseOrderRef);
      // if (workTypeId)       q.append('WorkTypeId',       workTypeId);
         const q = buildContractsFilterQuery();

        const res = await fetch(`${API_BASE_URL}/Documents/contracts?${q}`, { headers: h });
        if (!res.ok) throw new Error();
        const data = await res.json();

const flattened: Contract[] = [];

(Array.isArray(data) ? data : []).forEach((d: any, i: number) => {
  flattened.push({
    id: d.id || String(i),
    serialNum: d.serialNum,
    contractNum: d.contractNum,
    contractNumber: d.contractNum,
    type: d.type,
    value: d.value,
    canEdit:d.canEdit,
    contractValue: d.value,
    currency: d.currency,
    contractDate: d.contractDate,
    personOrg: d.personOrg,
    supplierId: '',
    department: d.department,
    project: d.project,
    projectId: '',
    workTypeId: '',
    details: '',
    notes: '',
    purchaseOrderRef: d.purchaseOrderRef,
    oldReferenceNumber: '',
    attachmentPaths: d.attachmentPaths,
    createdBy: d.createdBy,
    createdAt: d.createdAt,
    approvalDeliveryDate:d.approvalDeliveryDate,
    dateOfReceipt:d.dateOfReceipt
  });

  if (Array.isArray(d.references)) {
    d.references.forEach((r: any) => {
      flattened.push({
        id: r.id,
        serialNum: r.displayNumber, 
        contractNum: r.contractNumber,
        contractNumber: r.contractNumber,
        type: 'ملحق',
        value: r.value,
        canEdit:r.canEdit,
        contractValue: r.value,
        currency: r.currency ?? d.currency, 
        contractDate: r.contractDate,
        personOrg: d.personOrg,   
        supplierId: '',
        department: d.department,  
        project: d.project, 
        projectId: '',
        workTypeId: '',
        details: '',
        notes: '',
        purchaseOrderRef: '',
        oldReferenceNumber: '',
        attachmentPaths: r.attachments,
        createdBy: r.createdBy,
        createdAt: '',
        approvalDeliveryDate:d.approvalDeliveryDate,
        dateOfReceipt:d.dateOfReceipt
      });
    });
  }
});

setDocuments(flattened);
     // setDocuments(Array.isArray(data) ? data.map((d: Contract, i: number) => ({ ...d, id: d.id || String(i) })) : []);
    } catch { setError('حدث خطأ أثناء جلب العقود'); }
    finally { setSearching(false); }
  };

  const handleExportExcel = async () => {
  const allEmpty = !contractRef && !projectId && !supplierId && !departmentId && !purchaseOrderRef && !workTypeId && !contractId;
  if (allEmpty && (!startDate || !endDate)) { setError('يرجى تحديد نطاق زمني أو فلتر للتصدير'); return; }
  setExportingExcel(true);
  setError('');
  try {
    const h = { Authorization: `Bearer ${localStorage.getItem('authToken')}` };
    const q = buildContractsFilterQuery();

    const res = await fetch(`${API_BASE_URL}/Excel/contracts/?${q}`, { headers: h });
    if (!res.ok) throw new Error();

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `العقود-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    setError('حدث خطأ أثناء تصدير ملف Excel');
  } finally {
    setExportingExcel(false);
  }
};

  const viewAtt = (filePaths: string | string[] | null | undefined) => {
    const valid = Array.isArray(filePaths) ? filePaths.filter(Boolean) : filePaths ? [filePaths] : [];
    setAttModal({ open: true, items: valid.map(fp => ({ filePath: fp, fileName: fp.split('/').pop() || fp })) });
  };

const openUpdate = async (id: string) => {
  setLoading(true);
  try {
    const h = { Authorization: `Bearer ${localStorage.getItem('authToken')}` };
    const res = await fetch(`${API_BASE_URL}/Contracts/get-contract/${id}`, { headers: h });
    if (!res.ok) throw new Error();
    const raw = await res.json();

    const normalized: Contract = {
      id: raw.id ?? id,
      contractNumber: raw.contractNumber ?? '',
      contractNum: raw.contractNumber ?? '',
      value: raw.contractValue ?? 0,
      canEdit:raw.canEdit??false,
      contractValue: raw.contractValue ?? 0,
      currency: String(raw.currency ?? ''),
      contractDate: raw.contractDate ?? '',
      personOrg: raw.personOrg ?? '',
      supplierId: String(raw.supplierId ?? ''),
      department: String(raw.department ?? ''),
      project: raw.project ?? '',
      projectId: String(raw.projectId ?? ''),
      workTypeId: String(raw.workTypeId ?? ''),
      details: raw.details ?? '',
      notes: raw.notes ?? '',
      purchaseOrderRef: raw.purchaseOrderRef ?? '',
      oldReferenceNumber: raw.oldReferenceNumber ?? '',
      attachmentPaths: raw.attachmentPaths ?? [],
      createdBy: raw.createdBy ?? '',
      createdAt: raw.createdAt ?? '',
      approvalDeliveryDate:raw.approvalDeliveryDate,
      dateOfReceipt:raw.dateOfReceipt
    };

    setSelectedDoc(normalized);
    setExistingAttachments(raw.attachments ?? []);   // ← DTO field is `attachments`, camelCased
    setAttachmentIdsToDelete([]);
    setUpdateFiles([]);
    setUpdateModal(true);
  } catch { alert('حدث خطأ أثناء تحميل بيانات العقد'); }
  finally { setLoading(false); }
};

const removeExistingAttachment = (attId: string) => {
  setAttachmentIdsToDelete(prev => (prev.includes(attId) ? prev : [...prev, attId]));
  setExistingAttachments(prev => prev.filter(a => a.id !== attId));
};

const removeNewFile = (index: number) => {
  setUpdateFiles(prev => prev.filter((_, i) => i !== index));
};

const submitUpdate = async () => {
  if (!selectedDoc) return;
  setLoading(true);
  try {
    const fd = new FormData();
    Object.entries(selectedDoc).forEach(([k, v]) => {
      if (v != null) fd.append(k.charAt(0).toUpperCase() + k.slice(1), String(v));
    });
    updateFiles.forEach(f => fd.append('Attachments', f));
    attachmentIdsToDelete.forEach(id => fd.append('AttachmentIdsToDelete', id));

    const h = { Authorization: `Bearer ${localStorage.getItem('authToken')}` };
    const res = await fetch(`${API_BASE_URL}/Contracts/update-contract/${selectedDoc.id}`, {
      method: 'PUT', headers: h, body: fd,
    });
    if (!res.ok) throw new Error();
    setUpdateModal(false);
    handleSearch();
  } catch { alert('حدث خطأ أثناء التحديث'); }
  finally { setLoading(false); }
};

  const handleSort = (key: ColumnKey) => {
    setSortConfig(prev => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null;
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

  // Global search box (existing behaviour) -> per-column filters -> sorting, in that order
  const filtered = useMemo(() => {
    let result = documents.filter(d =>
      !searchQuery || d.contractNumber?.includes(searchQuery) || d.project?.includes(searchQuery) || d.personOrg?.includes(searchQuery)
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
  }, [documents, searchQuery, columnFilters, sortConfig]);

  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleDownloadAttachment = async (filePath: string, fileName: string) => {
  try {
    const cleanPath = filePath.replace(/^\/+/, '');

    const res = await fetch(`${API_BASE_URL}/files/${cleanPath}`, {
    });
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

  return (
    <div className="animate-fade-up">
      <PageHeader title="بحث واستعراض العقود" subtitle="يمكنك البحث عن العقود وتعديلها من خلال هذه الصفحة" />

      {/* Filter card */}
      <div className="siac-card p-6 mb-5"
        onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <FieldWrap label="رقم العقد">
            <input value={contractRef} onChange={e => setContractRef(e.target.value)} className="siac-input" placeholder="أدخل رقم العقد" />
          </FieldWrap>
          <FieldWrap label="المشروع">
            <SearchableSelect options={projects} value={projectId} onChange={setProjectId} placeholder="اختر المشروع" />
          </FieldWrap>
          <FieldWrap label="المورد / المقاول">
            <SearchableSelect options={suppliers} value={supplierId} onChange={setSupplierId} placeholder="اختر..." />
          </FieldWrap>
          <FieldWrap label="نوع الأعمال">
            <SearchableSelect options={workTypes} value={workTypeId} onChange={setWorkTypeId} placeholder="اختر..." />
          </FieldWrap>
          <FieldWrap label="القسم">
            <SearchableSelect options={DEPT_OPTS} value={departmentId} onChange={setDepartmentId} placeholder="اختر..." />
          </FieldWrap>
          <FieldWrap label="من تاريخ">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="siac-input" />
          </FieldWrap>
          <FieldWrap label="إلى تاريخ">
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={!startDate} className="siac-input disabled:opacity-50" />
          </FieldWrap>
          <FieldWrap label="مرجع أمر التوريد">
            <input value={purchaseOrderRef} onChange={e => setPurchaseOrderRef(e.target.value)} className="siac-input" placeholder="مرجع أمر التوريد" />
          </FieldWrap>
        </div>
          <br />
         <div className="flex justify-end gap-4">
            <Button
              variant="secondary"
              onClick={() => {
                setContractRef('');
                setProjectId('');
                setSupplierId('');
                setWorkTypeId('');
                setDepartmentId('');
                setStartDate('');
                setEndDate('');
                setPurchaseOrderRef('');
                setDocuments([]);
                setColumnFilters({});
                setSortConfig(null);
                setSearchQuery('');
                setError('');
                setPage(1);
              }}
            >
              إعادة تعيين
            </Button>

            <Button
              variant="secondary"
              loading={exportingExcel}
              onClick={handleExportExcel}
              className="!border-[#1e7e34] !text-[#1e7e34] hover:!bg-[#eaf7ee]"
            >
              <span className="inline-flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
                    stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
                  />
                  <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  <path
                    d="M8.5 12.5 12 17m0-4.5-3.5 4.5M15.5 12.5 12 17"
                    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
                  />
                </svg>
                تصدير Excel
              </span>
            </Button>

            <Button loading={searching} onClick={handleSearch}>
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4"/><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              عرض العقود
            </Button>
          </div>
      </div>

      {error && <div className="mb-4"><Alert type="error" onClose={() => setError('')}>{error}</Alert></div>}

      {/* Results table */}
      <div className="siac-card overflow-hidden">
        <div className="siac-card-header">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#1a2744]">العقود</span>
            <Badge variant="navy">{filtered.length} عقد</Badge>
            {hasActiveColumnFilters || sortConfig ? (
              <button onClick={clearTableFilters}
                className="h-6 px-2 rounded-md border border-[#e2e8f0] text-[10px] font-cairo text-[#6b7a99] hover:bg-[#f5f7fa] hover:text-[#1a2744] transition-colors cursor-pointer bg-transparent">
                مسح فرز/فلاتر الجدول
              </button>
            ) : null}
          </div>
          <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            className="h-8 w-52 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 text-xs font-cairo outline-none focus:border-[#00428d]"
            placeholder="بحث في النتائج..." />
        </div>

        {searching ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Spinner size="lg" /><p className="text-sm text-[#6b7a99] font-cairo">جاري البحث...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="siac-table">
              <thead>
                <tr>
                  {COLUMNS.map(col => (
                    <th key={col.key}
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={col.sortable ? 'cursor-pointer select-none' : ''}>
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
                    <th key={`filter-${col.key}`} className="!py-1.5 !font-normal">
                      {col.filterable ? (
                        <input
                          value={columnFilters[col.key] || ''}
                          onChange={e => handleColumnFilterChange(col.key, e.target.value)}
                          placeholder="فلترة..."
                          className="h-6 w-full rounded-md border border-[#e2e8f0] bg-white px-2 text-[10px] font-cairo outline-none focus:border-[#00428d]"
                        />
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && <tr><td colSpan={12} className="py-0 border-none"><EmptyState message="لا توجد عقود. استخدم الفلاتر أعلاه للبحث." /></td></tr>}
                {paginated.map(doc => {
                  const hasAtt = Array.isArray(doc.attachmentPaths) ? doc.attachmentPaths.length > 0 : !!doc.attachmentPaths;
                  return (
                    <tr key={doc.id}>
                      <td><span className="serial">{`CON-${doc.serialNum}`}</span></td>
                      <td className="font-medium">{doc.contractNum}</td>
                      <td>{doc.type && <Badge variant="blue">{doc.type}</Badge>}</td>
                      <td className="font-mono font-medium">{Number(doc.value).toLocaleString('ar')}</td>
                      <td><span className="badge badge-gray">{CURRENCY_MAP[doc.currency] ?? doc.currency}</span></td>
                      <td className="font-mono text-[#6b7a99]">{doc.contractDate?.substring(0,10)}</td>
                      <td className="max-w-[160px] truncate">{doc.personOrg}</td>
                      <td>{doc.department && <span className="text-[11px] text-[#6b7a99]">{DEPT_MAP[doc.department] ?? doc.department}</span>}</td>
                      <td className="max-w-[120px] truncate text-[#6b7a99]">{doc.project}</td>
                      <td className="text-[#6b7a99]">{doc.createdBy}</td>
                      <td>
                        <button onClick={() => viewAtt(doc.attachmentPaths)} disabled={!hasAtt}
                          className="h-7 px-3 rounded-md border border-[#e2e8f0] text-[11px] font-cairo text-[#6b7a99] hover:bg-[#f5f7fa] hover:text-[#1a2744] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-transparent">
                          {hasAtt ? `مراجعة (${Array.isArray(doc.attachmentPaths) ? doc.attachmentPaths.length : 1})` : 'لا يوجد'}
                        </button>
                      </td>
                      {
                        doc.canEdit?<td>
                        <Button variant="ghost" size="sm" onClick={() => openUpdate(doc.id)}>تعديل</Button>
                      </td>:null
                      }
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 px-5 py-3 border-t border-[#f1f5f9]">
            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
              className="h-8 px-3 rounded-md border border-[#e2e8f0] text-xs font-cairo text-[#6b7a99] hover:bg-[#f5f7fa] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-white transition-colors">‹ السابق</button>
            {Array.from({length: Math.min(totalPages,7)},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={()=>setPage(p)}
                className={`h-8 min-w-8 px-2 rounded-md border text-xs font-cairo cursor-pointer transition-colors ${page===p?'bg-[#00428d] text-white border-[#00428d]':'bg-white border-[#e2e8f0] text-[#6b7a99] hover:bg-[#f5f7fa]'}`}>{p}</button>
            ))}
            <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
              className="h-8 px-3 rounded-md border border-[#e2e8f0] text-xs font-cairo text-[#6b7a99] hover:bg-[#f5f7fa] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-white transition-colors">التالي ›</button>
          </div>
        )}
      </div>

      {/* Attachments modal */}
      <Modal open={attModal.open} onClose={() => setAttModal({ open: false, items: [] })} title="المرفقات"
        footer={<Button variant="secondary" onClick={() => setAttModal({ open: false, items: [] })}>إغلاق</Button>}>
        {attModal.items.length === 0 ? <Alert type="info">لا توجد مرفقات متاحة</Alert> : (
          <ul className="space-y-2">
            {attModal.items.map((a, i) => (
              <li key={i} className="flex items-center justify-between p-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#e6f0fb] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#00428d]" viewBox="0 0 16 16" fill="none"><path d="M9 1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5L9 1z" stroke="currentColor" strokeWidth="1.2"/><path d="M9 1v4h4" stroke="currentColor" strokeWidth="1.2"/></svg>
                  </div>
                  <span className="text-xs font-cairo text-[#1a2744] truncate max-w-[200px]">{a.fileName}</span>
                </div>
                <a   onClick={() => handleDownloadAttachment(a.filePath, a.fileName)} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[#00428d] hover:underline font-cairo flex items-center gap-1">
                  تحميل
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M6 1v7M3 5l3 3 3-3M2 10h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {/* Update modal */}
      <Modal open={updateModal} onClose={() => setUpdateModal(false)} title="تعديل العقد" size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setUpdateModal(false)}>إلغاء</Button>
            <Button loading={loading} onClick={submitUpdate}>حفظ التعديلات</Button>
          </>
        }>
        {selectedDoc && (
          <div className="grid grid-cols-2 gap-4">
            <Input label="رقم العقد" value={selectedDoc.contractNumber} readOnly />
            <Input
  label="قيمة العقد"
  value={String(selectedDoc.contractValue)}
  inputMode="decimal"
  onChange={v => {
    // allow digits and at most one decimal point
    const cleaned = v.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
    setSelectedDoc({ ...selectedDoc, value: cleaned, contractValue: cleaned });
  }}
/>
            <Input label="مرجع أمر التوريد" value={selectedDoc.purchaseOrderRef || ''} onChange={v => setSelectedDoc({...selectedDoc, purchaseOrderRef: v})} />
            <Input label="مرجع قديم" value={selectedDoc.oldReferenceNumber || ''} onChange={v => setSelectedDoc({...selectedDoc, oldReferenceNumber: v})} />
            <FieldWrap label="تاريخ العقد">
              <input type="date" value={selectedDoc.contractDate?.substring(0,10) || ''}
                onChange={e => setSelectedDoc({...selectedDoc, contractDate: e.target.value})} className="siac-input" />
            </FieldWrap>
            <FieldWrap label="القسم">
              <SearchableSelect options={DEPT_OPTS} value={selectedDoc.department} onChange={v => setSelectedDoc({...selectedDoc, department: v})} />
            </FieldWrap>
            <FieldWrap label="العملة">
              <SearchableSelect options={CURRENCY_OPTS} value={selectedDoc.currency} onChange={v => setSelectedDoc({...selectedDoc, currency: v})} />
            </FieldWrap>
            <FieldWrap label="المشروع">
              <SearchableSelect options={projects} value={selectedDoc.projectId} onChange={v => setSelectedDoc({...selectedDoc, projectId: v})} />
            </FieldWrap>
            <FieldWrap label="المقاول / المورد">
              <SearchableSelect options={suppliers} value={selectedDoc.supplierId} onChange={v => setSelectedDoc({...selectedDoc, supplierId: v})} />
            </FieldWrap>
            <FieldWrap label="نوع الأعمال">
              <SearchableSelect options={workTypes} value={selectedDoc.workTypeId} onChange={v => setSelectedDoc({...selectedDoc, workTypeId: v})} />
            </FieldWrap>
            <div className="col-span-2"><FieldWrap label="التفاصيل">
              <textarea value={selectedDoc.details} rows={3} onChange={e => setSelectedDoc({...selectedDoc, details: e.target.value})} className="siac-textarea" />
            </FieldWrap></div>
            <div className="col-span-2"><FieldWrap label="ملاحظات">
              <textarea value={selectedDoc.notes || ''} rows={2} onChange={e => setSelectedDoc({...selectedDoc, notes: e.target.value})} className="siac-textarea" />
            </FieldWrap></div>
            <FieldWrap label="تاريخ الاستلام">
            <input
              type="date"
              value={selectedDoc.dateOfReceipt?.substring(0, 10) || ''}
              onChange={e =>
                setSelectedDoc({
                  ...selectedDoc,
                  dateOfReceipt: e.target.value
                })
              }
              className="siac-input"
            />
          </FieldWrap>
            <FieldWrap label="تاريخ الموافقة على التسليم">
            <input
              type="date"
              value={selectedDoc.approvalDeliveryDate?.substring(0, 10) || ''}
              onChange={e =>
                setSelectedDoc({
                  ...selectedDoc,
                  approvalDeliveryDate: e.target.value
                })
              }
              className="siac-input"
            />
          </FieldWrap>
         <div className="col-span-2">
  <FieldWrap label="المرفقات">
    {existingAttachments.length === 0 && updateFiles.length === 0 && (
      <p className="text-xs text-[#6b7a99] font-cairo mb-2">لا توجد مرفقات حالياً</p>
    )}

{existingAttachments.length > 0 && (
  <ul className="space-y-2 mb-2">
    {existingAttachments.map(a => (
      <li key={a.id} className="flex items-center justify-between p-2.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
        <span className="text-xs font-cairo text-[#1a2744]">{a.fileName}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleDownloadAttachment(a.url, a.fileName)}
            className="text-xs text-[#00428d] hover:underline font-cairo cursor-pointer bg-transparent border-none p-0"
          >
            تحميل ↗
          </button>
          <button
            type="button"
            onClick={() => removeExistingAttachment(a.id)}
            className="h-6 px-2 rounded-md border border-red-300 text-red-500 text-[10px] font-cairo cursor-pointer hover:bg-red-100 transition-colors"
          >
            حذف
          </button>
        </div>
      </li>
    ))}
  </ul>
)}

    {updateFiles.length > 0 && (
      <ul className="space-y-2 mb-2">
        {updateFiles.map((f, i) => (
          <li key={`${f.name}-${i}`} className="flex items-center justify-between p-2.5 rounded-lg border border-[#00428d]/30 bg-blue-50">
            <span className="text-xs font-cairo text-[#1a2744]">{f.name}</span>
            <button
              type="button"
              onClick={() => removeNewFile(i)}
              className="h-6 px-2 rounded-md border border-[#e2e8f0] text-[10px] font-cairo text-[#6b7a99] hover:bg-white cursor-pointer"
            >
              إزالة
            </button>
          </li>
        ))}
      </ul>
    )}

    <div className="upload-zone">
      <input
        type="file"
        multiple
        className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={e => {
          const incoming = Array.from(e.target.files || []);
          setUpdateFiles(prev => {
            const next = [...prev];
            incoming.forEach(f => {
              if (!next.some(x => x.name === f.name && x.size === f.size)) next.push(f);
            });
            return next;
          });
          e.target.value = '';
        }}
      />
      <p className="text-xs text-[#6b7a99] font-cairo">انقر لإضافة ملفات</p>
    </div>
  </FieldWrap>
</div>
          </div>
        )}
      </Modal>
    </div>
  );
}