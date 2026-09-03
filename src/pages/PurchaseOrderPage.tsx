import { useState, useEffect } from 'react';
import BaseForm from '../components/BaseForm';
import { SearchableSelect, FieldWrap } from '../components/SearchableSelect';
import { Modal, Button, Spinner , Alert } from '../components/UI';
import { API_BASE_URL, COMPANY_POST_HOST } from '../config/constants';
import type { Option, Person } from '../types';

const CURRENCY_OPTIONS: Option[] = [
  { id: '1', name: 'دولار أمريكي (USD)' },
  { id: '2', name: 'يورو (EUR)' },
  { id: '3', name: 'جنيه مصري (EGP)' },
  { id: '4', name: 'ريال سعودي (SAR)' },
];
const DEPT_OPTIONS: Option[] = [
  { id: '1', name: 'الميكانيكا' },
  { id: '2', name: 'الكهرباء' },
  { id: '3', name: 'مدني عام' },
];
const STATUS_OPTIONS: Option[] = [
  { id: '1', name: 'مكتمل' }, { id: '2', name: 'قيد التنفيذ' },
  { id: '3', name: 'مرفوض' }, { id: '4', name: 'معتمد' },
  { id: '5', name: 'قيد المراجعة' }
];
const NATURE_OPTIONS: Option[] = [
  { id: '1', name: 'توريد' },
  { id: '2', name: 'توريد وتركيب' },
];
const IMPORT_STATUS_OPTIONS: Option[] = [
  { id: '1', name: 'بالكامل' },
  { id: '2', name: 'جزئي' },
  { id: '3', name: 'ملغاة' },
];

export default function PurchaseOrderPage() {
  const [projects, setProjects] = useState<Option[]>([]);
  const [contractors, setContractors] = useState<Option[]>([]);
  const [workTypes, setWorkTypes] = useState<Option[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [serialNumber, setSerialNumber] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);

  const [projectId, setProjectId] = useState('');
  const [workTypeId, setWorkTypeId] = useState('');
  const [contractorId, setContractorId] = useState('');
  const [currency, setCurrency] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('1');
  const [natureOfWork, setNatureOfWork] = useState('');
  const [importingStatus, setImportingStatus] = useState('');

  // Followup
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  const [followOption, setFollowOption] = useState('');
  const [followNotes, setFollowNotes] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [notesManuallyEdited, setNotesManuallyEdited] = useState(false);
  const [personModalError,    setPersonModalError]    = useState('');

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    const h = { Authorization: `Bearer ${token}` };
    try {
      const [pRes, sRes, wRes, snRes, persRes] = await Promise.all([
        fetch(`${API_BASE_URL}/Publisher/get-projects`, { headers: h }),
        fetch(`${API_BASE_URL}/Publisher/get-suppliers`, { headers: h }),
        fetch(`${API_BASE_URL}/WorkTypes/get-worktypes`, { headers: h }),
        fetch(`${API_BASE_URL}/PurchaseOrder/GetPurchaseOrderMaxSerialNumber`, { headers: h }),
        fetch(`${API_BASE_URL}/SysUsers/getfollowingpersons`, { headers: h }),
      ]);
      const [p, s, w, sn, pers] = await Promise.all([pRes.json(), sRes.json(), wRes.json(), snRes.json(), persRes.json()]);
      setProjects(Array.isArray(p) ? p : []);
      setContractors(Array.isArray(s) ? s : []);
      setWorkTypes(Array.isArray(w) ? w : []);
      setSerialNumber(typeof sn === 'number' ? sn : undefined);
      setPersons(Array.isArray(pers) ? pers : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Auto-generate follow notes
  useEffect(() => {
    if (notesManuallyEdited || !followOption) return;
    const num = documentNumber || '___';
    const link = COMPANY_POST_HOST;
    const map: Record<string, string> = {
      Sharing: `السادة الأفاضل،
      يرجى التكرم بالاطلاع على أمر التوريد رقم ${num} والمشاركة برأيكم أو ملاحظاتكم إن وجدت.
      يمكنكم الاطلاع على تفاصيل أمر التوريد من خلال الرابط التالي:
      ${link}`,

      Followed: `السادة الأفاضل،
      نرجو منكم التكرم بمتابعة أمر التوريد رقم ${num} واتخاذ اللازم حسب الإجراءات المعتمدة.
      يمكنكم الاطلاع على تفاصيل أمر التوريد من خلال الرابط التالي:
      ${link}`,

      Escalated: `السادة الأفاضل،
      يرجى التكرم بالإسراع في اتخاذ الإجراءات اللازمة بشأن أمر التوريد رقم ${num}، نظرًا لأهمية الموضوع.
      يمكنكم الاطلاع على تفاصيل أمر التوريد من خلال الرابط التالي:
      ${link}`,
    };
    setFollowNotes(map[followOption] ?? '');
  }, [followOption, documentNumber, notesManuallyEdited]);

  const followingPersonDisplay = selectedPersons
    .map(id => persons.find(p => p.id === id)?.name).filter(Boolean).join('، ');

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  const serialBadge = serialNumber != null ? `PO-${serialNumber}` : undefined;

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


    const clearFields = () => {
    setProjectId(''); setWorkTypeId(''); setContractorId('');
    setCurrency(''); setDepartment('');
    setStatus('1'); // default back to مكتمل
    setNatureOfWork(''); setImportingStatus('');
    setSelectedPersons([]); setFollowOption(''); setFollowNotes('');
    setDocumentNumber('');
    setNotesManuallyEdited(false);
  };

  return (
    <>
      <BaseForm
        title="إدخال مستند جديد (أمر توريد)"
        endpoint="/PurchaseOrder/createpurchaseorder"
        serialBadge={serialBadge}
        onSuccess={() => {
          setProjectId(''); setWorkTypeId(''); setContractorId('');
          setCurrency(''); setDepartment(''); setStatus('');
          setSelectedPersons([]); setFollowOption(''); setFollowNotes('');
          setDocumentNumber('');
          fetchData();
        }}
        onReset={clearFields}
        extraFields={
          <div className="space-y-6">
            {/* Hidden followup */}
            <input type="hidden" name="EmailContent" value={followNotes} />
            <input type="hidden" name="Options" value={followOption} />
            {selectedPersons.map(id => <input key={id} type="hidden" name="SentEmailsTo" value={id} />)}

            {/* Section: Core */}
            <div>
              <div className="text-xs font-bold text-muted uppercase tracking-widest mb-3.5 flex items-center gap-2">
                <span className="inline-block w-0.5 h-3.5 bg-navy-mid rounded-sm" />
                بيانات أمر التوريد
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FieldWrap label="الرقم التسلسلي">
                  <input type="hidden" name="SerialNumber" value={serialNumber ?? ''} />
                  <input readOnly value={serialBadge ?? ''} className="h-10 border border-border rounded-lg px-3 text-sm font-cairo bg-gray-100 text-muted w-full outline-none font-mono cursor-default" />
                </FieldWrap>

                <FieldWrap label="رقم أمر التوريد" required>
                  <input
                    name="PurchaseOrderNumber"
                    required
                    inputMode="numeric"
                    value={documentNumber}
                    onChange={e => setDocumentNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={e => { if (!/[0-9]/.test(e.key) && e.key !== 'Backspace') e.preventDefault(); }}
                    className="h-10 border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface w-full outline-none focus:border-navy-mid focus:bg-white transition-colors"
                    placeholder="أدخل رقم أمر التوريد"
                  />
                </FieldWrap>

                <FieldWrap label="نوع القسم" required>
                  <input type="hidden" name="Department" value={department} />
                  <SearchableSelect options={DEPT_OPTIONS} value={department} onChange={setDepartment} required placeholder="اختر..." />
                </FieldWrap>

                <FieldWrap label="المشروع" required>
                  <input type="hidden" name="ProjectId" value={projectId} />
                  <SearchableSelect options={projects} value={projectId} onChange={setProjectId} required placeholder="اختر المشروع" />
                </FieldWrap>

                <FieldWrap label="المورد" required>
                  <input type="hidden" name="PersonOrgId" value={contractorId} />
                  <SearchableSelect options={contractors} value={contractorId} onChange={setContractorId} required placeholder="اختر المورد" />
                </FieldWrap>

                <FieldWrap label="رقم السجل التجاري">
                  <input
                    name="CommericalRegisterId"
                    inputMode="numeric"
                    onKeyDown={e => { if (!/[0-9]/.test(e.key) && e.key !== 'Backspace') e.preventDefault(); }}
                    className="h-10 border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface w-full outline-none focus:border-navy-mid focus:bg-white transition-colors"
                    placeholder="رقم السجل التجاري"
                  />
                </FieldWrap>

                
                <FieldWrap label="نوع الأعمال" required>
                  <input type="hidden" name="WorkTypeId" value={workTypeId} />
                  <SearchableSelect options={workTypes} value={workTypeId} onChange={setWorkTypeId} required placeholder="اختر نوع الأعمال" />
                </FieldWrap>

                <FieldWrap label="طبيعة الأعمال" required>
                  <input type="hidden" name="NatureOfWork" value={natureOfWork} />
                  <SearchableSelect options={NATURE_OPTIONS} value={natureOfWork} onChange={setNatureOfWork} required placeholder="اختر..." />
                </FieldWrap>

                
                <FieldWrap label="موقف التوريد" required>
                  <input type="hidden" name="ImportingStatus" value={importingStatus} />
                  <SearchableSelect options={IMPORT_STATUS_OPTIONS} value={importingStatus} onChange={setImportingStatus} required placeholder="اختر..." />
                </FieldWrap>

                
                <FieldWrap label="العملة" required>
                  <input type="hidden" name="Currency" value={currency} />
                  <SearchableSelect options={CURRENCY_OPTIONS} value={currency} onChange={setCurrency} required placeholder="اختر العملة" />
                </FieldWrap>

                <FieldWrap label="قيمة أمر التوريد" required>
                  <input
                    name="Value"
                    required
                    inputMode="numeric"
                    onKeyDown={e => { if (!/[0-9]/.test(e.key) && e.key !== 'Backspace') e.preventDefault(); }}
                    className="h-10 border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface w-full outline-none focus:border-navy-mid focus:bg-white transition-colors"
                    placeholder="0"
                  />
                </FieldWrap>
                
                <FieldWrap label="قيمة الشيكات الصادرة">
                  <input
                    name="IssuedChecksValue"
                    inputMode="numeric"
                    onKeyDown={e => { if (!/[0-9]/.test(e.key) && e.key !== 'Backspace') e.preventDefault(); }}
                    className="h-10 border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface w-full outline-none focus:border-navy-mid focus:bg-white transition-colors"
                    placeholder="0"
                  />
                </FieldWrap>

                <FieldWrap label="الحالة">
                  <input type="hidden" name="StatusMethod" value={status} />
                  <SearchableSelect options={STATUS_OPTIONS} value={status} onChange={setStatus} placeholder="اختر..." />
                </FieldWrap>

                <FieldWrap label="تاريخ أمر التوريد" required>
                  <input
                    type="date"
                    name="PurchaseOrderDate"
                    required
                    className="h-10 border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface w-full outline-none focus:border-navy-mid focus:bg-white transition-colors"
                  />
                </FieldWrap>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <FieldWrap label="تفاصيل أمر التوريد" required>
                <textarea name="Details" required rows={3} className="border border-border rounded-lg px-3 py-2 text-sm font-cairo text-navy-dark bg-surface w-full outline-none resize-none leading-relaxed focus:border-navy-mid focus:bg-white transition-colors" placeholder="أدخل التفاصيل..." />
              </FieldWrap>
              <FieldWrap label="ملاحظات">
                <textarea name="Notes" rows={3} className="border border-border rounded-lg px-3 py-2 text-sm font-cairo text-navy-dark bg-surface w-full outline-none resize-none leading-relaxed focus:border-navy-mid focus:bg-white transition-colors" placeholder="ملاحظات..." />
              </FieldWrap>
              <FieldWrap label="المرفقات">
                <div className="border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer bg-surface hover:border-navy-mid hover:bg-blue-50 transition-colors relative">
                  <input name="attachments" type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="text-2xl text-muted mb-1">⊕</div>
                  <div className="text-sm text-muted">اسحب الملفات هنا أو انقر للاختيار</div>
                  <div className="text-xs text-slate-400 mt-1">PDF, DOCX, XLSX — بحد أقصى 20 ميجابايت</div>
                </div>
              </FieldWrap>

              {/* Following person */}
              <FieldWrap label="صورة لشخص" >
                <div className="flex gap-2">
                  <input
                    name="FollowingPerson"
                    readOnly
                    value={followingPersonDisplay}
                    className="h-10 flex-1 border border-border rounded-lg px-3 text-sm font-cairo bg-gray-100 text-muted w-full outline-none cursor-default"
                    placeholder="اختر الأشخاص..."
                  />
                 <Button type="button" variant="ghost" size="sm" onClick={() => { setPersonModalError(''); setPersonModalOpen(true); }}>اختر</Button>
                </div>
              </FieldWrap>
            </div>
          </div>
        }
      />

      {/* Person modal */}
      <Modal
        open={personModalOpen}
        onClose={() => setPersonModalOpen(false)}
        title="متابعة واستعلام"
        footer={<Button onClick={() => handleApplyPersonModal()}>تطبيق</Button>}
      >
        <div className="space-y-4">
                      {personModalError && (
                        <Alert type="error" onClose={() => setPersonModalError('')}>
                          {personModalError}
                        </Alert>
              )}
        <div className="space-y-4">
          <FieldWrap label="خيارات المتابعة والاستعلام">
            <select value={followOption} onChange={e => { setFollowOption(e.target.value); setNotesManuallyEdited(false); }} className="h-10 border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface w-full outline-none focus:border-navy-mid focus:bg-white transition-colors appearance-none cursor-pointer">
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
                  <input type="checkbox" checked={selectedPersons.includes(p.id)} onChange={e => setSelectedPersons(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id))} className="w-4 h-4 accent-navy-mid" />
                  <span className="text-sm text-navy-dark">{p.name}</span>
                </label>
              ))}
            </div>
          </FieldWrap>

          <FieldWrap label="النص">
            <textarea rows={5} value={followNotes} onChange={e => { setFollowNotes(e.target.value); setNotesManuallyEdited(true); }} className="border border-border rounded-lg px-3 py-2 text-sm font-cairo text-navy-dark bg-surface w-full outline-none resize-none leading-relaxed focus:border-navy-mid focus:bg-white transition-colors" placeholder="أدخل النص..." />
          </FieldWrap>
        </div>
         </div>
      </Modal>
    </>
  );
}