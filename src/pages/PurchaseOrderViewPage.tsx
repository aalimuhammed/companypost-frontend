import React, { useState, useEffect } from 'react';
import { Badge, Spinner, Alert, Modal, Button, EmptyState, PageHeader } from '../components/UI';
import { SearchableSelect, FieldWrap } from '../components/SearchableSelect';
import { API_BASE_URL } from '../config/constants';
import type { Option, PurchaseOrder, Attachment } from '../types';

const DEPT_OPTS: Option[] = [
  { id: '1', name: 'الميكانيكا' }, { id: '2', name: 'الكهرباء' }, { id: '3', name: 'مدني عام' },
];
const DEPT_MAP: Record<string, string> = { '1':'الميكانيكا', '2':'الكهرباء', '3':'مدني عام' };

export default function PurchaseOrdersViewPage() {
  const [projects,   setProjects]   = useState<Option[]>([]);
  const [suppliers,  setSuppliers]  = useState<Option[]>([]);
  const [workTypes,  setWorkTypes]  = useState<Option[]>([]);
  const [documents,  setDocuments]  = useState<PurchaseOrder[]>([]);
  const [searching,  setSearching]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [searchQuery,setSearchQuery]= useState('');
  const [page,       setPage]       = useState(1);
  const PAGE_SIZE = 10;

  // Filters
  const [projectId,      setProjectId]      = useState('');
  const [supplierId,     setSupplierId]      = useState('');
  const [departmentId,   setDepartmentId]   = useState('');
  const [purchaseOrderRef,setPurchaseOrderRef]=useState('');
  const [startDate,      setStartDate]      = useState('');
  const [endDate,        setEndDate]        = useState('');

  // Modals
  const [attModal,    setAttModal]    = useState<{ open: boolean; items: Attachment[] }>({ open: false, items: [] });
  const [updateModal, setUpdateModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    const h = { Authorization: `Bearer ${localStorage.getItem('authToken')}` };

    Promise.all([
      fetch(`${API_BASE_URL}/Publisher/get-projects`, { headers: h }).then(r=>r.json()),
      fetch(`${API_BASE_URL}/Publisher/get-suppliers`, { headers: h }).then(r=>r.json()),
      fetch(`${API_BASE_URL}/WorkTypes/get-worktypes`, { headers: h }).then(r=>r.json()),
      
    ]).then(([p,s,w]) => {
      setProjects(Array.isArray(p)?p:[]); setSuppliers(Array.isArray(s)?s:[]); setWorkTypes(Array.isArray(w)?w:[]);
    }).catch(()=>{});
  }, []);

  const handleSearch = async () => {
    const allEmpty = !projectId && !supplierId && !departmentId && !purchaseOrderRef;
    if (allEmpty && (!startDate || !endDate)) { setError('يرجى تحديد نطاق زمني أو فلتر للبحث'); return; }
    setSearching(true); setError(''); setPage(1);
    try {
      const h = { Authorization: `Bearer ${localStorage.getItem('authToken')}` };
      const q = new URLSearchParams();

      if (projectId)       q.append('ProjectId',       projectId);
      if (supplierId)      q.append('SupplierId',      supplierId);
      if (departmentId)    q.append('DepartmentId',    departmentId);
      if (startDate)       q.append('StartDate',       startDate);
      if (endDate)         q.append('EndDate',         endDate);
      if (purchaseOrderRef)q.append('PurchaseOrderRef',purchaseOrderRef);

      const res = await fetch(`${API_BASE_URL}/Documents/purchase-orders?${q}`, { headers: h });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data.map((d: PurchaseOrder,i:number) => ({...d, id: d.id||String(i)})) : []);
    } catch { setError('حدث خطأ أثناء جلب أوامر التوريد'); }
    finally { setSearching(false); }
  };

  const viewAtt = (filePaths: string | string[] | null | undefined) => {
    const valid = Array.isArray(filePaths)?filePaths.filter(Boolean):filePaths?[filePaths]:[];
    setAttModal({ open:true, items: valid.map(fp=>({ filePath:fp, fileName: fp.split('/').pop()||fp })) });
  };

  const openUpdate = async (id: string) => {
    setLoading(true);
    try {
      const h = { Authorization: `Bearer ${localStorage.getItem('authToken')}` };
      const res = await fetch(`${API_BASE_URL}/Documents/purchase-orders/${id}`, { headers: h });
      if (!res.ok) throw new Error();
      setSelectedDoc(await res.json()); setUpdateModal(true);
    } catch { alert('حدث خطأ أثناء تحميل البيانات'); }
    finally { setLoading(false); }
  };

  const submitUpdate = async () => {
    if (!selectedDoc) return;
    setLoading(true);
    try {
      const h = { Authorization: `Bearer ${localStorage.getItem('authToken')}`, 'Content-Type': 'application/json' };
      const res = await fetch(`${API_BASE_URL}/Documents/purchase-order/${selectedDoc.id}`, { method:'PUT', headers:h, body: JSON.stringify(selectedDoc) });
      if (!res.ok) throw new Error();
      setUpdateModal(false); handleSearch();
    } catch { alert('حدث خطأ أثناء التحديث'); }
    finally { setLoading(false); }
  };

  const filtered = documents.filter(d =>
    !searchQuery || d.purchaseOrderNumber?.includes(searchQuery) || d.projectName?.includes(searchQuery) || d.subContractor?.includes(searchQuery)
  );
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length/PAGE_SIZE);

  return (
    <div className="animate-fade-up">
      <PageHeader title="بحث وعرض أوامر التوريد" subtitle="ابحث وراجع أوامر التوريد وقم بتعديلها" />

      {/* Filter card */}
      <div className="siac-card p-6 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <FieldWrap label="رقم أمر التوريد">
            <input value={purchaseOrderRef} onChange={e=>setPurchaseOrderRef(e.target.value)} className="siac-input" placeholder="أدخل رقم أمر التوريد" />
          </FieldWrap>
          <FieldWrap label="المشروع">
            <SearchableSelect options={projects} value={projectId} onChange={setProjectId} placeholder="اختر المشروع" />
          </FieldWrap>
          <FieldWrap label="المورد">
            <SearchableSelect options={suppliers} value={supplierId} onChange={setSupplierId} placeholder="اختر المورد" />
          </FieldWrap>
          <FieldWrap label="القسم">
            <SearchableSelect options={DEPT_OPTS} value={departmentId} onChange={setDepartmentId} placeholder="اختر..." />
          </FieldWrap>
          <FieldWrap label="من تاريخ">
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="siac-input" />
          </FieldWrap>
          <FieldWrap label="إلى تاريخ">
            <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} disabled={!startDate} className="siac-input disabled:opacity-50" />
          </FieldWrap>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => { setProjectId(''); setSupplierId(''); setDepartmentId(''); setPurchaseOrderRef(''); setStartDate(''); setEndDate(''); }}>مسح الفلاتر</Button>
          <Button loading={searching} onClick={handleSearch}>
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4"/><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            عرض أوامر التوريد
          </Button>
        </div>
      </div>

      {error && <div className="mb-4"><Alert type="error" onClose={()=>setError('')}>{error}</Alert></div>}

      {/* Table */}
      <div className="siac-card overflow-hidden">
        <div className="siac-card-header">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#1a2744]">أوامر التوريد</span>
            <Badge variant="navy">{filtered.length} أمر</Badge>
          </div>
          <input value={searchQuery} onChange={e=>{setSearchQuery(e.target.value);setPage(1);}}
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
                  {['الرقم التسلسلي','رقم أمر التوريد','القيمة','نوع الأعمال','التاريخ','المورد','القسم','المشروع','أنشئ بواسطة','المرفقات',''].map(h=>(
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length===0 && <tr><td colSpan={11} className="py-0 border-none"><EmptyState message="لا توجد بيانات. استخدم الفلاتر أعلاه للبحث." /></td></tr>}
                {paginated.map(doc=>{
                  const hasAtt = Array.isArray(doc.attachments)?doc.attachments.length>0:!!doc.attachments;
                  return (
                    <tr key={doc.id}>
                      <td><span className="serial">{`PO-${doc.serialNumber}`}</span></td>
                      <td className="font-medium">{doc.purchaseOrderNumber}</td>
                      <td className="font-mono font-medium">{Number(doc.value||doc.purchaseOrderValue||0).toLocaleString('ar')}</td>
                      <td className="text-[#6b7a99]">{doc.workType}</td>
                      <td className="font-mono text-[#6b7a99]">{doc.purchaseOrderDate?.substring(0,10)}</td>
                      <td className="max-w-[140px] truncate">{doc.subContractor}</td>
                      <td>{doc.department && <span className="text-[11px] text-[#6b7a99]">{DEPT_MAP[doc.department]??doc.department}</span>}</td>
                      <td className="max-w-[120px] truncate text-[#6b7a99]">{doc.projectName}</td>
                      <td className="text-[#6b7a99]">{doc.createdBy}</td>
                      <td>
                        <button onClick={()=>viewAtt(doc.attachments)} disabled={!hasAtt}
                          className="h-7 px-3 rounded-md border border-[#e2e8f0] text-[11px] font-cairo text-[#6b7a99] hover:bg-[#f5f7fa] hover:text-[#1a2744] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-transparent">
                          {hasAtt?`مراجعة`:'لا يوجد'}
                        </button>
                      </td>
                      <td><Button variant="ghost" size="sm" onClick={()=>openUpdate(doc.id)}>تعديل</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages>1 && (
          <div className="flex items-center justify-center gap-1 px-5 py-3 border-t border-[#f1f5f9]">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
              className="h-8 px-3 rounded-md border border-[#e2e8f0] text-xs font-cairo text-[#6b7a99] hover:bg-[#f5f7fa] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-white transition-colors">‹ السابق</button>
            {Array.from({length:Math.min(totalPages,7)},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={()=>setPage(p)}
                className={`h-8 min-w-8 px-2 rounded-md border text-xs font-cairo cursor-pointer transition-colors ${page===p?'bg-[#00428d] text-white border-[#00428d]':'bg-white border-[#e2e8f0] text-[#6b7a99] hover:bg-[#f5f7fa]'}`}>{p}</button>
            ))}
            <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
              className="h-8 px-3 rounded-md border border-[#e2e8f0] text-xs font-cairo text-[#6b7a99] hover:bg-[#f5f7fa] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-white transition-colors">التالي ›</button>
          </div>
        )}
      </div>

      {/* Attachments modal */}
      <Modal open={attModal.open} onClose={()=>setAttModal({open:false,items:[]})} title="المرفقات"
        footer={<Button variant="secondary" onClick={()=>setAttModal({open:false,items:[]})}>إغلاق</Button>}>
        {attModal.items.length===0?<Alert type="info">لا توجد مرفقات متاحة</Alert>:(
          <ul className="space-y-2">
            {attModal.items.map((a,i)=>(
              <li key={i} className="flex items-center justify-between p-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
                <span className="text-xs font-cairo text-[#1a2744] truncate max-w-[200px]">{a.fileName}</span>
                <a href={`${API_BASE_URL}${a.filePath}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[#00428d] hover:underline font-cairo">تحميل ↗</a>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {/* Update modal */}
      <Modal open={updateModal} onClose={()=>setUpdateModal(false)} title="تعديل أمر التوريد" size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={()=>setUpdateModal(false)}>إلغاء</Button>
            <Button loading={loading} onClick={submitUpdate}>حفظ التعديلات</Button>
          </>
        }>
        {selectedDoc && (
          <div className="grid grid-cols-2 gap-4">
            <FieldWrap label="رقم أمر التوريد">
              <input readOnly value={selectedDoc.purchaseOrderNumber} className="siac-input !bg-[#f0f2f5] !text-[#6b7a99]" />
            </FieldWrap>
            <FieldWrap label="قيمة أمر التوريد">
              <input value={selectedDoc.purchaseOrderValue||''} onChange={e=>setSelectedDoc({...selectedDoc,purchaseOrderValue:e.target.value.replace(/\D/g,'')})} className="siac-input" />
            </FieldWrap>
            <FieldWrap label="نوع الأعمال">
              <SearchableSelect options={workTypes} value={selectedDoc.workTypeId} onChange={v=>setSelectedDoc({...selectedDoc,workTypeId:v})} />
            </FieldWrap>
            <FieldWrap label="المشروع">
              <SearchableSelect options={projects} value={selectedDoc.projectId} onChange={v=>setSelectedDoc({...selectedDoc,projectId:v})} />
            </FieldWrap>
            <FieldWrap label="المورد">
              <SearchableSelect options={suppliers} value={selectedDoc.supplierId} onChange={v=>setSelectedDoc({...selectedDoc,supplierId:v})} />
            </FieldWrap>
            <FieldWrap label="تاريخ أمر التوريد">
              <input type="date" value={selectedDoc.purchaseOrderDate?.substring(0,10)||''} onChange={e=>setSelectedDoc({...selectedDoc,purchaseOrderDate:e.target.value})} className="siac-input" />
            </FieldWrap>
          </div>
        )}
      </Modal>
    </div>
  );
}