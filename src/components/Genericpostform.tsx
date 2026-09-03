import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL, API, authHeaders } from '../config/api';
import { COMPANY_POST_HOST } from '../config/constants';
import type { Option, Person } from '../types';
import BaseForm from './BaseForm';
import { SearchableSelect, FieldWrap } from './SearchableSelect';
import { LoadingPane, Alert, Modal, Button } from './UI';

const STATUS_OPTS: Option[] = [
  {id:'1',name:'مكتمل'},
  {id:'2',name:'قيد التنفيذ'},
  {id:'3',name:'مرفوض'},
  {id:'4',name:'معتمد'},
  {id:'5',name:'قيد المراجعة'},
];
const DELIVERY_OPTS: Option[] = [{id:'1',name:'يدويًا'},{id:'2',name:'إيميل'},{id:'3',name:'فاكس'}];
const DEPT_TYPE_OPTS: Option[] = [{id:'1',name:'مدني عام'},{id:'2',name:'إليكتروميكانيك'}];

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="form-section">{children}</div>
);

// ── File size formatter ───────────────────────────────────────────────────────
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// ── File icon by extension ────────────────────────────────────────────────────
const FileIcon = ({ name }: { name: string }) => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pdf:  { bg: 'bg-red-50',    text: 'text-red-500',    label: 'PDF'  },
    docx: { bg: 'bg-blue-50',   text: 'text-blue-500',   label: 'DOC'  },
    doc:  { bg: 'bg-blue-50',   text: 'text-blue-500',   label: 'DOC'  },
    xlsx: { bg: 'bg-green-50',  text: 'text-green-600',  label: 'XLS'  },
    xls:  { bg: 'bg-green-50',  text: 'text-green-600',  label: 'XLS'  },
    png:  { bg: 'bg-purple-50', text: 'text-purple-500', label: 'IMG'  },
    jpg:  { bg: 'bg-purple-50', text: 'text-purple-500', label: 'IMG'  },
    jpeg: { bg: 'bg-purple-50', text: 'text-purple-500', label: 'IMG'  },
  };
  const style = map[ext] ?? { bg: 'bg-gray-100', text: 'text-gray-500', label: ext.toUpperCase() || 'FILE' };
  return (
    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-[10px] font-bold font-mono flex-shrink-0 ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
};

interface GenericPostFormProps {
  title: string;
  endpoint: string;
  serialPrefix: string;
  serialNumberEndpoint: string;
  topFields?: React.ReactNode;
  extraFields?: React.ReactNode;
  fetchCompanies?: boolean;
  fetchDeliveryDirection?: boolean;
  hideDepartment?: boolean;
  postnumberEnable?: boolean;
  enableCompanyDelivery?: boolean;
  disableDocumentNumberInput?: boolean;
  onDocumentChange?: (num: string) => void;
  copyData?: Record<string, unknown> | null;
  onSuccess?: () => void;
  /** Enables the "صورة لشخص" following-person picker + auto-generated follow notes, same behavior as PurchaseOrderPage. */
  enableFollowingPerson?: boolean;
  /** Endpoint used to fetch the list of selectable persons. */
  followingPersonEndpoint?: string;
  defaultDeliveryType?: string;
  /** Enables the "صادر أصلي" (original sender) fields. Uses its own state, separate from "جهة التسليم". */
  enableOriginalSender?: boolean;
}

export default function GenericPostForm({
  title, endpoint, serialPrefix, serialNumberEndpoint,
  topFields, extraFields,
  fetchCompanies = true, fetchDeliveryDirection = false,
  hideDepartment = false, enableCompanyDelivery = false,
  postnumberEnable = false,
  disableDocumentNumberInput = false,
  onDocumentChange, copyData, onSuccess,
  enableFollowingPerson = false,
  followingPersonEndpoint = '/SysUsers/getfollowingpersons',
  defaultDeliveryType = '',
  enableOriginalSender = false,
}: GenericPostFormProps) {
  const [serialNumber,   setSerialNumber]   = useState<number | null>(null);
  const [companies,      setCompanies]      = useState<Option[]>([]);
  const [publisherOpts,  setPublisherOpts]  = useState<Option[]>([]);
  const [deliveryOpts,   setDeliveryOpts]   = useState<Option[]>([]);
 // const [workTypes,      setWorkTypes]      = useState<Option[]>([]);
  const [projects,       setProjects]       = useState<Option[]>([]);
  const [projectId,      setProjectId]       = useState('');
  const [loading,        setLoading]        = useState(true);
  const [loadError,      setLoadError]      = useState('');
  const [successMsg,     setSuccessMsg]     = useState('');

  const [documentNumber, setDocumentNumber] = useState('');
  const [companyId,      setCompanyId]      = useState('');
  const [publisherType,  setPublisherType]  = useState('');
  const [publisherId,    setPublisherId]    = useState('');
  const [deptType,       setDeptType]       = useState('');
  const [deliveryType,   setDeliveryType]   = useState(defaultDeliveryType);
  const [receivedFromId, setReceivedFromId] = useState('');
  //const [workTypeId,     setWorkTypeId]     = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('1');
  const [deliveryDate,   setDeliveryDate]   = useState('');
  const [documentDate,   setDocumentDate]   = useState('');
  const [statusMethod,   setStatusMethod]   = useState('1');
  const [subject,        setSubject]        = useState('');
  const [summary,        setSummary]        = useState('');
  const [notes,          setNotes]          = useState('');

  // ── "صادر أصلي" (original sender) state — kept separate from "جهة التسليم" ──
  const [originalSenderType, setOriginalSenderType] = useState('');
  const [originalSenderId,   setOriginalSenderId]   = useState('');
  const [originalSenderOpts, setOriginalSenderOpts] = useState<Option[]>([]);

  // ── Attachment state ──────────────────────────────────────────────────────
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging,    setIsDragging]    = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Following person state ────────────────────────────────────────────────
  const [persons,             setPersons]             = useState<Person[]>([]);
  const [personModalOpen,     setPersonModalOpen]     = useState(false);
  const [selectedPersons,     setSelectedPersons]     = useState<string[]>([]);
  const [followOption,        setFollowOption]        = useState('');
  const [followNotes,         setFollowNotes]         = useState('');
  const [notesManuallyEdited, setNotesManuallyEdited] = useState(false);
  const [personModalError,    setPersonModalError]    = useState('');
  

  // ── Scroll-to-message refs ────────────────────────────────────────────────
  const statusRef = useRef<HTMLDivElement>(null);

  const scrollToStatus = useCallback(() => {
    // Wait a tick so the element is actually rendered/updated before scrolling
    requestAnimationFrame(() => {
      statusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, []);

  useEffect(() => {
    if (loadError) scrollToStatus();
  }, [loadError, scrollToStatus]);

  useEffect(() => {
    if (successMsg) scrollToStatus();
  }, [successMsg, scrollToStatus]);

  const fetchInitial = useCallback(async () => {
    setLoading(true); setLoadError('');
    try {
      const h = authHeaders();
      const [snRes , prjDept] = await Promise.all([
        fetch(`${API_BASE_URL}${serialNumberEndpoint}`, { headers: h }),
       // fetch(`${API_BASE_URL}${API.WORK_TYPES}`, { headers: h }),
        fetch(`${API_BASE_URL}${API.PROJECTSDEPT}`, { headers: h }),
      ]);
      const sn = await snRes.json();
      setSerialNumber(typeof sn === 'number' ? sn : Number(sn));
     // const wt = await wtRes.json();
      //setWorkTypes(Array.isArray(wt) ? wt : []);

      const prjDpt = await prjDept.json();
      setProjects(Array.isArray(prjDpt) ? prjDpt : []);

      if (fetchCompanies) {
        const co = await fetch(`${API_BASE_URL}${API.COMPANIES}`, { headers: h });
        const coData = await co.json();
        setCompanies(Array.isArray(coData) ? coData : []);
      }

      if (enableFollowingPerson) {
        const pers = await fetch(`${API_BASE_URL}${followingPersonEndpoint}`, { headers: h });
        const persData = await pers.json();
        setPersons(Array.isArray(persData) ? persData : []);
      }
    } catch {
      setLoadError('حدث خطأ أثناء تحميل البيانات. يرجى إعادة المحاولة.');
    }
    finally  { setLoading(false); }
  }, [serialNumberEndpoint, fetchCompanies, enableFollowingPerson, followingPersonEndpoint]);

  useEffect(() => { fetchInitial(); }, [fetchInitial]);

  useEffect(() => {
    if (!publisherType) { setPublisherOpts([]); return; }
    const url = publisherType === 'Department' ? API.DEPARTMENTS : API.PROJECTS;
    fetch(`${API_BASE_URL}${url}`).then(r => r.json())
      .then(d => setPublisherOpts(Array.isArray(d) ? d : [])).catch(() => {});
  }, [publisherType]);

  useEffect(() => {
    if (!deliveryType) { setDeliveryOpts([]); return; }
    let path = '';
    if (deliveryType === 'Department') path = API.DEPARTMENTS;
    else if (deliveryType === 'Project')                          path = API.PROJECTS;
    else if (deliveryType === 'Company' && enableCompanyDelivery) path = API.SUPPLIERS;
    if (path) fetch(`${API_BASE_URL}${path}`).then(r => r.json())
      .then(d => setDeliveryOpts(Array.isArray(d) ? d : [])).catch(() => {});
  }, [deliveryType, enableCompanyDelivery]);

  // ── Fetch options for "صادر أصلي", mirrors the "جهة التسليم" effect but is fully independent ──
  useEffect(() => {
    if (!enableOriginalSender) return;
    if (!originalSenderType) { setOriginalSenderOpts([]); return; }
    let path = '';
    if (originalSenderType === 'Department') path = API.DEPARTMENTS;
    else if (originalSenderType === 'Project')                          path = API.PROJECTS;
    else if (originalSenderType === 'Company' && enableCompanyDelivery) path = API.SUPPLIERS;
    if (path) fetch(`${API_BASE_URL}${path}`).then(r => r.json())
      .then(d => setOriginalSenderOpts(Array.isArray(d) ? d : [])).catch(() => {});
  }, [enableOriginalSender, originalSenderType, enableCompanyDelivery]);

  useEffect(() => {
    if (!copyData) return;
    setCompanyId(String(copyData.companyId ?? ''));
    setPublisherId(String(copyData.publisherId ?? ''));
   // setWorkTypeId(String(copyData.workTypeId ?? ''));
    setDeptType(String(copyData.documentType != null ? copyData.documentType : ''));
    setDeliveryMethod(String(copyData.deliveryMethod != null ? copyData.deliveryMethod : '1'));
    setStatusMethod(String(copyData.statusMethod != null ? copyData.statusMethod : '1'));
    setSubject(String(copyData.subject ?? ''));
    setSummary(String(copyData.summary ?? ''));
    setNotes(String(copyData.notes ?? ''));
    setDocumentDate(String(copyData.documentDate ?? '').substring(0, 10));
    setDeliveryDate(String(copyData.deliveryDate ?? '').substring(0, 10));
    setPublisherType(String(copyData.publisherType ?? ''));
    setDeliveryType(String(copyData.receivedType ?? ''));
    setOriginalSenderType(String(copyData.originalSenderType ?? ''));
  }, [copyData]);

  // ── Auto-generate follow notes (mirrors PurchaseOrderPage behavior) ───────
  useEffect(() => {
    if (!enableFollowingPerson || notesManuallyEdited || !followOption) return;
    const num = documentNumber || '___';
    const link = COMPANY_POST_HOST;
    const map: Record<string, string> = {
      Sharing: `السادة الأفاضل،\nيرجى التكرم بالاطلاع على رقم ${num} والمشاركة برأيكم أو ملاحظاتكم إن وجدت.\nيمكنكم الاطلاع على تفاصيل المستند من خلال الرابط التالي:\n${link}`,
      Followed: `السادة الأفاضل،\nنرجو منكم التكرم بمتابعة المستند رقم ${num} واتخاذ اللازم حسب الإجراءات المعتمدة.\nيمكنكم الاطلاع على تفاصيل المستند من خلال الرابط التالي:\n${link}`,
      //Escalated: `نود التنويه إلى ضرورة الإسراع في اتخاذ الإجراءات اللازمة بشأن المستند رقم ${num} لأهمية الموضوع.\nيمكنكم الاطلاع على تفاصيل المستند من خلال الرابط التالي:\n${link}`,
      Escalated: `السادة الأفاضل،\nيرجى التكرم بالإسراع في اتخاذ الإجراءات اللازمة بشأن المستند رقم ${num}، نظرًا لأهمية الموضوع.\nيمكنكم الاطلاع على تفاصيل المستند من خلال الرابط التالي:\n${link}`,
    };
    setFollowNotes(map[followOption] ?? '');
  }, [enableFollowingPerson, followOption, documentNumber, notesManuallyEdited]);

  const followingPersonDisplay = selectedPersons
    .map(id => persons.find(p => p.id === id)?.name).filter(Boolean).join('، ');

  // The textarea shown to the user holds just the follow-option text (followNotes).
  // The subject is appended on its own line only in the value that actually gets submitted.
  const emailContentValue = subject
    ? `${followNotes}\nالموضوع: ${subject}`
    : followNotes;

  // ── Single source of truth for clearing all controlled state ────────────
  const clearFields = () => {
    setDocumentNumber(''); setCompanyId(''); setPublisherType(''); setPublisherId('');
    setDeptType(''); setDeliveryType(''); setReceivedFromId(''); 
    //setWorkTypeId('');
    setOriginalSenderType(''); setOriginalSenderId('');
    setDeliveryMethod('1'); setDeliveryDate(''); setDocumentDate('');
    setStatusMethod('1'); // default back to "مكتمل"
    setSubject(''); setSummary(''); setNotes('');
    setProjectId(''); // بخصوص
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSelectedPersons([]); setFollowOption(''); setFollowNotes(''); // موجه إلي (+ its display, derived from selectedPersons)
    setNotesManuallyEdited(false);
  };

  const resetAll = async () => {
    clearFields();
    await fetchInitial();

    // show + scroll to success message
    setLoadError('');
    setSuccessMsg('تم حفظ المستند بنجاح.');
    // auto-clear after a few seconds
    window.setTimeout(() => setSuccessMsg(''), 4000);

    onSuccess?.();
  };

  const handleManualReset = () => {
    clearFields();
    setLoadError(''); setSuccessMsg('');
  };

  // ── File handlers ─────────────────────────────────────────────────────────
  const mergeFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...selectedFiles];
    Array.from(incoming).forEach(f => {
      if (!next.some(x => x.name === f.name && x.size === f.size)) next.push(f);
    });
    setSelectedFiles(next);

    // Sync the real <input> via DataTransfer so the form submission includes all files
    if (fileInputRef.current) {
      const dt = new DataTransfer();
      next.forEach(f => dt.items.add(f));
      fileInputRef.current.files = dt.files;
    }
  };

  const removeFile = (index: number) => {
    const next = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(next);
    if (fileInputRef.current) {
      const dt = new DataTransfer();
      next.forEach(f => dt.items.add(f));
      fileInputRef.current.files = dt.files;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    mergeFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    mergeFiles(e.dataTransfer.files);
  };

  if (loading) return <LoadingPane />;

  const serialBadge = serialNumber != null ? `${serialPrefix}${serialNumber}` : '';
  const handleApplyPersonModal = () => {
  if (selectedPersons.length === 0) {
    setPersonModalError('يرجى اختيار شخص واحد على الأقل.');
    return;
  }
  if (!followNotes.trim()) {
    setPersonModalError('يرجى إدخال نص الملاحظة.');
    return;
  }
  setPersonModalError('');
  setPersonModalOpen(false);
};

  return (
    <>
      <BaseForm
        key={serialNumber ?? undefined}
        title={title}
        endpoint={endpoint}
        serialBadge={serialBadge}
        onSuccess={resetAll}
        onReset={handleManualReset}
        extraFields={
          <div className="space-y-6 sm:space-y-8">
            {/* ── Status messages (scroll target) ── */}
            <div ref={statusRef}>
              {loadError && <Alert type="error" onClose={() => setLoadError('')}>{loadError}</Alert>}
              {successMsg && <Alert type="success" onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}
            </div>

            {topFields && <div>{topFields}</div>}

            {/* ── Section 1 ── */}
            <div>
              <SectionTitle>بيانات المستند الأساسية</SectionTitle>
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
                <FieldWrap label="الرقم التسلسلي">
                  <input name="SerialNumber" type="hidden" value={serialNumber ?? ''} />
                  <input className="siac-input font-mono !text-navy-mid !bg-[#f0f4f8]" value={serialBadge} readOnly />
                </FieldWrap>

                {!disableDocumentNumberInput && (
                  <FieldWrap label="رقم المستند" required>
                    <input name="DocumentNumber" required value={documentNumber}
                      onChange={e => { const v = e.target.value.replace(/\D/g,''); setDocumentNumber(v); onDocumentChange?.(v); }}
                      className="siac-input" placeholder="أدخل رقم المستند" />
                  </FieldWrap>
                )}

                {fetchCompanies && (
                  <FieldWrap label="الشركة" required>
                    <SearchableSelect name="CompanyId" options={companies} value={companyId}
                      onChange={setCompanyId} required placeholder="اختر الشركة" />
                  </FieldWrap>
                )}
              </div>
            </div>

            {/* ── Section 2 ── */}
            <div>
              <SectionTitle>جهة الإصدار والاستلام</SectionTitle>
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
                <FieldWrap label="جهة الإصدار" required>
                  <select name="PublisherType" value={publisherType}
                    onChange={e => { setPublisherType(e.target.value); setPublisherId(''); }}
                    required className="siac-select">
                    <option value="">اختر...</option>
                    <option value="Department">إدارة</option>
                    <option value="Project">مشروع</option>
                    <option value="Company">شركة</option>
                  </select>
                </FieldWrap>

                <FieldWrap label="صادر من" required>
                  <SearchableSelect name="PublishedId" options={publisherOpts} value={publisherId}
                    onChange={setPublisherId} required disabled={!publisherType} placeholder="اختر..." />
                </FieldWrap>

                <FieldWrap label="نوع القسم" required>
                  <SearchableSelect name="PostDocumentType" options={DEPT_TYPE_OPTS} value={deptType}
                    onChange={setDeptType} placeholder="اختر..." />
                </FieldWrap>

                {fetchDeliveryDirection && (
                  <>
                    <FieldWrap label="جهة التسليم" required>
                      <select value={deliveryType}
                        onChange={e => { setDeliveryType(e.target.value); setReceivedFromId(''); }}
                        className="siac-select">
                        <option value="">اختر...</option>
                        {!hideDepartment && <option value="Department">إدارة</option>}
                        <option value="Project">مشروع</option>
                        {enableCompanyDelivery && <option value="Company">شركة</option>}
                      </select>
                    </FieldWrap>
                    <FieldWrap label="مستلم من قبل" required>
                      <SearchableSelect name="RecivedFromId" options={deliveryOpts} value={receivedFromId}
                        onChange={setReceivedFromId} required disabled={!deliveryType} placeholder="اختر..." />
                    </FieldWrap>
                  </>
                )}

                {/* ── صادر أصلي: independent boolean + independent state, no longer reuses جهة التسليم's state ── */}
                {enableOriginalSender && (
                  <>
                    <FieldWrap label="صادر أصلي" required>
                      <select value={originalSenderType}
                        onChange={e => { setOriginalSenderType(e.target.value); setOriginalSenderId(''); }}
                        className="siac-select">
                        <option value="">اختر...</option>
                        {!hideDepartment && <option value="Department">إدارة</option>}
                        <option value="Project">مشروع</option>
                        {enableCompanyDelivery && <option value="Company">شركة</option>}
                      </select>
                    </FieldWrap>
                    <FieldWrap label="مستلم من قبل" required>
                      <SearchableSelect name="OriginalSenderId" options={originalSenderOpts} value={originalSenderId}
                        onChange={setOriginalSenderId} required disabled={!originalSenderType} placeholder="اختر..." />
                    </FieldWrap>
                  </>
                )}

                {/* <FieldWrap label="نوع الأعمال" required>
                  <SearchableSelect name="WorkTypeId" options={workTypes} value={workTypeId}
                    onChange={setWorkTypeId} required placeholder="اختر..." />
                </FieldWrap> */}
              </div>
            </div>

            {/* ── Section 3 ── */}
            <div>
              <SectionTitle>التواريخ والحالة</SectionTitle>
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
                <FieldWrap label="تاريخ التسليم" required>
                  <input type="date" name="DeliveryDate" required value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)} className="siac-input" />
                </FieldWrap>
                <FieldWrap label="تاريخ المستند" required>
                  <input type="date" name="DocumentDate" required value={documentDate}
                    onChange={e => setDocumentDate(e.target.value)} className="siac-input" />
                </FieldWrap>
                <FieldWrap label="طريقة التسليم">
                  <SearchableSelect name="DeliveryMethod" options={DELIVERY_OPTS} value={deliveryMethod}
                    onChange={setDeliveryMethod} placeholder="اختر..." />
                </FieldWrap>
                <FieldWrap label="الحالة">
                  <SearchableSelect name="StatusMethod" options={STATUS_OPTS} value={statusMethod}
                    onChange={setStatusMethod} placeholder="اختر..." />
                </FieldWrap>
                  <FieldWrap label="رقم الوارد">
                    <input
                      type="text"
                      name="IncomingNumber"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="siac-input"
                      placeholder="رقم الوارد"
                      onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
                }}
                    />
                  </FieldWrap>
               {postnumberEnable && (
                      <FieldWrap label="رقم الصادر" required>
                        <input
                          type="text"
                          name="PostNumber"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="siac-input"
                          required
                          placeholder="رقم الصادر"
                          onInput={(e: React.FormEvent<HTMLInputElement>) => {
                            e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
                          }}
                        />
                      </FieldWrap>
                    )}
                  <FieldWrap label="مرجع قديم">
                  <input name="OldRef" className="siac-input" placeholder="مرجع قديم" />
                </FieldWrap>

                 <FieldWrap label="نوع الأعمال">
                  <input name="AboutWork" className="siac-input" placeholder="نوع الأعمال" />
                </FieldWrap>
              </div>
            </div>

            {/* ── Section 4 ── */}
            <div>
              <SectionTitle>تفاصيل المستند</SectionTitle>
              <div className="space-y-4">
                <FieldWrap label="الموضوع" required>
                  <input name="Subject" required value={subject} onChange={e => setSubject(e.target.value)}
                    className="siac-input" placeholder="أدخل موضوع المستند" />
                </FieldWrap>
                <FieldWrap label="ملخص" required>
                  <textarea name="Summary" required rows={3} value={summary} onChange={e => setSummary(e.target.value)}
                    className="siac-textarea" placeholder="أدخل ملخص المستند..." />
                </FieldWrap>
                <FieldWrap label="ملاحظات">
                  <textarea name="Notes" rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                    className="siac-textarea" placeholder="ملاحظات إضافية..." />
                </FieldWrap>

                {/* ── Attachments ── */}
                <FieldWrap label="المرفقات">
                  {/* Hidden real input — kept in DOM so BaseForm picks it up on submit */}
                  <input
                    ref={fileInputRef}
                    name="attachments"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {/* Drop zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`upload-zone cursor-pointer select-none transition-colors ${
                      isDragging ? 'border-navy-mid bg-blue-50' : ''
                    }`}
                  >
                    <svg className="w-8 h-8 mx-auto mb-2 text-muted opacity-30" viewBox="0 0 32 32" fill="none">
                      <path d="M16 20V10m0 0l-4 4m4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="4" y="22" width="24" height="6" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                    </svg>
                    <p className="text-sm font-cairo text-muted">
                      اسحب الملفات هنا أو{' '}
                      <span className="text-navy-mid font-bold">انقر للاختيار</span>
                    </p>
                    <p className="text-[11px] mt-1 text-muted/60">PDF, DOCX, XLSX — بحد أقصى 20 ميجابايت</p>
                  </div>

                  {/* File list */}
                  {selectedFiles.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {selectedFiles.map((file, i) => (
                        <li
                          key={`${file.name}-${i}`}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-surface"
                        >
                          <FileIcon name={file.name} />

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-navy-dark font-cairo truncate">{file.name}</p>
                            <p className="text-[11px] text-muted">{formatBytes(file.size)}</p>
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); removeFile(i); }}
                            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-muted hover:bg-red-50 hover:text-red-500 transition-colors"
                            aria-label="حذف الملف"
                          >
                            <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* File count badge */}
                  {selectedFiles.length > 0 && (
                    <p className="mt-2 text-[11px] text-muted font-cairo text-left">
                      {selectedFiles.length} {selectedFiles.length === 1 ? 'ملف مرفق' : 'ملفات مرفقة'}
                    </p>
                  )}
                </FieldWrap>

                 <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
                  <FieldWrap label="بخصوص">
                    <SearchableSelect
                      name="ProjectId"
                      options={projects}
                      value={projectId}
                      onChange={setProjectId}
                      placeholder="اختر المشروع - الإدارة"
                    />
                  </FieldWrap>
                </div>

                {/* ── Following person ── */}
                {enableFollowingPerson && (
                  <>
                    <input type="hidden" name="EmailContent" value={emailContentValue} />
                    <input type="hidden" name="Options" value={followOption} />
                    {selectedPersons.map(id => <input key={id} type="hidden" name="SentEmailsTo" value={id} />)}

                    <FieldWrap label="موجه إلي">
                      <div className="flex gap-2">
                        <input
                          name="FollowingPerson"
                          readOnly
                          value={followingPersonDisplay}
                          className="siac-input flex-1 !bg-gray-100 !text-muted cursor-default"
                          placeholder="اختر الأشخاص..."
                        />
                       <Button type="button" variant="ghost" size="sm" onClick={() => { setPersonModalError(''); setPersonModalOpen(true); }}>اختر</Button>
                      </div>
                    </FieldWrap>
                  </>
                )}
              </div>

            </div>

            {extraFields && <div>{extraFields}</div>}
          </div>
        }
      />

        {/* Person modal */}
        {enableFollowingPerson && (
          <Modal
            open={personModalOpen}
            onClose={() => setPersonModalOpen(false)}
            title="متابعة واستعلام"
            footer={<Button onClick={handleApplyPersonModal}>تطبيق</Button>}
          >
            <div className="space-y-4">
              {personModalError && (
                <Alert type="error" onClose={() => setPersonModalError('')}>
                  {personModalError}
                </Alert>
              )}

              <FieldWrap label="خيارات المتابعة والاستعلام">
                <select
                  value={followOption}
                  onChange={e => { setFollowOption(e.target.value); setNotesManuallyEdited(false); }}
                  className="h-10 border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface w-full outline-none focus:border-navy-mid focus:bg-white transition-colors appearance-none cursor-pointer"
                >
                  <option value="">اختر...</option>
                  <option value="Sharing">المشاركة</option>
                  <option value="Followed">المتابعة</option>
                  <option value="Escalated">الأهمية والاستعجال</option>
                </select>
              </FieldWrap>

              <FieldWrap label="الأشخاص">
                <div className="border border-border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {persons.map(p => (
                    <label key={p.id} className="flex items-center gap-2 px-3 py-2 hover:bg-surface cursor-pointer border-b border-border last:border-b-0">
                      <input
                        type="checkbox"
                        checked={selectedPersons.includes(p.id)}
                        onChange={e => setSelectedPersons(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id))}
                        className="w-4 h-4 accent-navy-mid"
                      />
                      <span className="text-sm text-navy-dark">{p.name}</span>
                    </label>
                  ))}
                </div>
              </FieldWrap>

              <FieldWrap label="النص">
                <textarea
                  rows={5}
                  value={followNotes}
                  onChange={e => { setFollowNotes(e.target.value); setNotesManuallyEdited(true); }}
                  className="border border-border rounded-lg px-3 py-2 text-sm font-cairo text-navy-dark bg-surface w-full outline-none resize-none leading-relaxed focus:border-navy-mid focus:bg-white transition-colors"
                  placeholder="أدخل النص..."
                />
              </FieldWrap>
            </div>
          </Modal>
        )}
    </>
  );
}