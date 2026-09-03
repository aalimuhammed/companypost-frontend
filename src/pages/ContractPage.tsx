import { useState, useEffect } from 'react';
import BaseForm from '../components/BaseForm';
import { SearchableSelect, FieldWrap } from '../components/SearchableSelect';
import { Modal, Button, Spinner , Alert} from '../components/UI';
import { API_BASE_URL, COMPANY_POST_HOST } from '../config/constants';
import type { Option, Person } from '../types';

interface ContractNumber { id: string; contractNum: string; }
interface AttachedData { projectName: string; departmentName: string; purchaseOrderRefNumber: string; }

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

export default function ContractsPage() {
  const [projects, setProjects] = useState<Option[]>([]);
  const [contractors, setContractors] = useState<Option[]>([]);
  const [workTypes, setWorkTypes] = useState<Option[]>([]);
  const [baseContracts, setBaseContracts] = useState<ContractNumber[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  const [contractType, setContractType] = useState('Original');
  const [serialNumber, setSerialNumber] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [baseContractId, setBaseContractId] = useState('');
  const [attachedData, setAttachedData] = useState<AttachedData | null>(null);
  const [projectId, setProjectId] = useState('');
  const [workTypeId, setWorkTypeId] = useState('');
  const [contractorId, setContractorId] = useState('');
  const [currency, setCurrency] = useState('');
  const [department, setDepartment] = useState('');

  // Followup
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [personModalError, setPersonModalError] = useState('');
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  const [followOption, setFollowOption] = useState('');
  const [followNotes, setFollowNotes] = useState('');
  const [notesManuallyEdited, setNotesManuallyEdited] = useState(false);
  

  const isOriginal = contractType === 'Original';
  const isHasReference = contractType === 'HasReference';

  useEffect(() => {
  if (contractType !== 'Original') return;

  const loadSerialNumber = async () => {
    const token = localStorage.getItem('token');
    const h = { Authorization: `Bearer ${token}` };

    try {
      const res = await fetch(
        `${API_BASE_URL}/Contracts/GetContractMaxSerialNumber`,
        { headers: h }
      );

      const data = await res.json();
      setSerialNumber(String(data));
    } catch {
      // ignore
    }
  };

  loadSerialNumber();
}, [contractType]);

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

  const fetchDropdowns = async () => {
    const token = localStorage.getItem('token');
    const h = { Authorization: `Bearer ${token}` };
    const [projRes, suppRes, wtRes, persRes] = await Promise.all([
      fetch(`${API_BASE_URL}/Publisher/get-projects`, { headers: h }),
      fetch(`${API_BASE_URL}/Publisher/get-suppliers`, { headers: h }),
      fetch(`${API_BASE_URL}/WorkTypes/get-worktypes`, { headers: h }),
      fetch(`${API_BASE_URL}/SysUsers/getfollowingpersons`, { headers: h }),
    ]);
    const [p, s, w, pers] = await Promise.all([projRes.json(), suppRes.json(), wtRes.json(), persRes.json()]);
    setProjects(Array.isArray(p) ? p : []);
    setContractors(Array.isArray(s) ? s : []);
    setWorkTypes(Array.isArray(w) ? w : []);
    setPersons(Array.isArray(pers) ? pers : []);
    setLoading(false);
  };

  useEffect(() => { fetchDropdowns(); }, []);

  // Auto-generate follow notes (same behavior as PurchaseOrderPage)
  useEffect(() => {
    if (notesManuallyEdited || !followOption) return;
    const num = contractNumber || '___';
    const link = COMPANY_POST_HOST;
    const map: Record<string, string> = {
      Sharing: `السادة الأفاضل،
            يرجى التكرم بالاطلاع على العقد رقم ${num} والمشاركة برأيكم أو ملاحظاتكم إن وجدت.
            يمكنكم الاطلاع على تفاصيل العقد من خلال الرابط التالي:
            ${link}`,

      Followed: `السادة الأفاضل،
            نرجو منكم التكرم بمتابعة العقد رقم ${num} واتخاذ اللازم حسب الإجراءات المعتمدة.
            يمكنكم الاطلاع على تفاصيل العقد من خلال الرابط التالي:
            ${link}`,

      Escalated: `السادة الأفاضل،
            يرجى التكرم بالإسراع في اتخاذ الإجراءات اللازمة بشأن العقد رقم ${num}، نظرًا لأهمية الموضوع.
            يمكنكم الاطلاع على تفاصيل العقد من خلال الرابط التالي:
            ${link}`,
      // Sharing: `السادة الأفاضل،\nيرجى التكرم بالاطلاع على رقم ${num} والمشاركة برأيكم أو ملاحظاتكم إن وجدت.\nيمكنكم الاطلاع على تفاصيل المستند من خلال الرابط التالي:\n${link}`,
      // Followed: `السادة الأفاضل،\nنرجو منكم التكرم بمتابعة المستند رقم ${num} واتخاذ اللازم حسب الإجراءات المعتمدة.\nيمكنكم الاطلاع على تفاصيل المستند من خلال الرابط التالي:\n${link}`,
      // Escalated: `نود التنويه إلى ضرورة الإسراع في اتخاذ الإجراءات اللازمة بشأن المستند رقم ${num} لأهمية الموضوع.\nيمكنكم الاطلاع على تفاصيل المستند من خلال الرابط التالي:\n${link}`,
    };
    setFollowNotes(map[followOption] ?? '');
  }, [followOption, contractNumber, notesManuallyEdited]);

  const followingPersonDisplay = selectedPersons
    .map(id => persons.find(p => p.id === id)?.name).filter(Boolean).join('، ');

  const handleContractTypeChange = async (value: string) => {
    setContractType(value);
    setSerialNumber(''); setContractNumber(''); setBaseContractId('');
    setAttachedData(null); setProjectId(''); setWorkTypeId(''); setContractorId('');

    const token = localStorage.getItem('token');
    const h = { Authorization: `Bearer ${token}` };

    try {
      if (value === 'Original') {
        const res = await fetch(`${API_BASE_URL}/Contracts/GetContractMaxSerialNumber`, { headers: h });
        const data = await res.json();
        setSerialNumber(String(data));
      } else if (value === 'HasReference') {
        // Only fetch the list of base contracts here.
        // GetContractRefMaxSerialNumber is deferred until a base contract is picked.
        const baseRes = await fetch(`${API_BASE_URL}/Contracts/get-contracts-numbers`, { headers: h });
        const baseData = await baseRes.json();
        setBaseContracts(Array.isArray(baseData) ? baseData : []);
      }
    } catch { /* ignore */ }
  };

  const handleBaseContractChange = async (id: string) => {
    setBaseContractId(id);
    const contract = baseContracts.find(c => c.id === id);
    if (!contract) return;

    const token = localStorage.getItem('token');
    const h = { Authorization: `Bearer ${token}` };

    try {
      const [attRes, refRes] = await Promise.all([
        fetch(`${API_BASE_URL}/Contracts/GetAttachedContractData/${id}`, { headers: h }),
        fetch(`${API_BASE_URL}/Contracts/GetContractRefMaxSerialNumber/${id}`, { headers: h }),
      ]);
      const att = await attRes.json();
      const ref = await refRes.json();
      setAttachedData({ projectName: att.projectName, departmentName: att.departmentName, purchaseOrderRefNumber: att.purchaseOrderRefNumber });
      setSerialNumber(`${contract.contractNum}-${ref}`);
     // setContractNumber(`${contract.contractNum}-${ref}`);
    } catch { /* ignore */ }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  const serialBadge = serialNumber ? `CON-${serialNumber}` : undefined;

  const clearFields = () => {
    setContractType(''); setSerialNumber(''); setContractNumber('');
    setBaseContractId(''); setAttachedData(null); setProjectId('');
    setWorkTypeId(''); setContractorId(''); setCurrency(''); setDepartment('');
    setSelectedPersons([]); setFollowOption(''); setFollowNotes('');
    setNotesManuallyEdited(false);
  };

  return (
    <>
      <BaseForm
        title="إدخال مستند جديد (عقود)"
        endpoint="/Contracts/create-contract"
        serialBadge={serialBadge}
        onSuccess={() => {
          clearFields();
          fetchDropdowns();
        }}
        onReset={clearFields}
        extraFields={
          <div className="space-y-6">
            {/* Hidden followup */}
            <input type="hidden" name="EmailContent" value={followNotes} />
            <input type="hidden" name="Options" value={followOption} />
            {selectedPersons.map(id => <input key={id} type="hidden" name="SentEmailsTo" value={id} />)}

            <div>
              <div className="text-xs font-bold text-muted uppercase tracking-widest mb-3.5 flex items-center gap-2">
                <span className="inline-block w-0.5 h-3.5 bg-navy-mid rounded-sm" />
                نوع العقد
              </div>
              <FieldWrap label="نوع العقد" required>
                <select
                  name="HasReference"
                  value={contractType}
                  onChange={e => handleContractTypeChange(e.target.value)}
                  required
                  className="h-10 border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface w-full outline-none focus:border-navy-mid focus:bg-white transition-colors appearance-none cursor-pointer max-w-xs"
                >
                  <option value="Original">عقد أساسي</option>
                  <option value="HasReference">عقد ملحق</option>
                </select>
              </FieldWrap>
            </div>

            {(isOriginal || isHasReference) && (
              <>
                <div>
                  <div className="text-xs font-bold text-muted uppercase tracking-widest mb-3.5 flex items-center gap-2">
                    <span className="inline-block w-0.5 h-3.5 bg-navy-mid rounded-sm" />
                    بيانات العقد الأساسية
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Serial */}
                    <FieldWrap label="الرقم التسلسلي">
                      <input type="hidden" name="SerialNumber" value={serialNumber} />
                      <input
                        readOnly
                        value={serialBadge ?? ''}
                        className="h-10 border border-border rounded-lg px-3 text-sm font-cairo bg-gray-100 text-muted w-full outline-none font-mono cursor-default"
                      />
                    </FieldWrap>

                    {/* Contract number */}
                    {isOriginal && (
                      <FieldWrap label="رقم العقد">
                        <input
                          name="ContractNum"
                          value={contractNumber}
                          onChange={e => setContractNumber(e.target.value.replace(/[^0-9]/g, ''))}
                          className="h-10 border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface w-full outline-none focus:border-navy-mid focus:bg-white transition-colors"
                          placeholder="رقم العقد"
                        />
                      </FieldWrap>
                    )}

                    {/* Base contract selector */}
                    {isHasReference && (
                      <FieldWrap label="العقد الأساسي" required>
                        <select
                          name="BaseContractId"
                          value={baseContractId}
                          onChange={e => handleBaseContractChange(e.target.value)}
                          required
                          className="h-10 border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface w-full outline-none focus:border-navy-mid focus:bg-white transition-colors appearance-none cursor-pointer"
                        >
                          <option value="">اختر العقد الأساسي</option>
                          {baseContracts.map(c => (
                            <option key={c.id} value={c.id}>{c.contractNum}</option>
                          ))}
                        </select>
                      </FieldWrap>
                    )}

                    {isHasReference && (
                      <FieldWrap label="رقم ملحق العقد">
                        <input
                          name="ContractNum"
                          value={contractNumber}
                          onChange={e => setContractNumber(e.target.value)}
                          className="h-10 border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface w-full outline-none focus:border-navy-mid focus:bg-white transition-colors"
                          placeholder="رقم ملحق العقد"
                        />
                      </FieldWrap>
                    )}

                    {/* Contractor (original only) */}
                    
                      <FieldWrap label="المقاول" required>
                        <input type="hidden" name="PersonOrgId" value={contractorId} />
                        <SearchableSelect options={contractors} value={contractorId} onChange={setContractorId} required placeholder="اختر المقاول" />
                      </FieldWrap>
                   

                    {/* Project (original only) */}
                    {isOriginal && (
                      <FieldWrap label="المشروع" required>
                        <input type="hidden" name="ProjectId" value={projectId} />
                        <SearchableSelect options={projects} value={projectId} onChange={setProjectId} required placeholder="اختر المشروع" />
                      </FieldWrap>
                    )}

                    {/* Work type (original only) */}
                    {isOriginal && (
                      <FieldWrap label="نوع الأعمال" required>
                        <input type="hidden" name="WorkTypeId" value={workTypeId} />
                        <SearchableSelect options={workTypes} value={workTypeId} onChange={setWorkTypeId} required placeholder="اختر نوع الأعمال" />
                      </FieldWrap>
                    )}

                    {/* Attached data (reference only) */}
                    {isHasReference && attachedData && (
                      <>
                        <FieldWrap label="اسم المشروع">
                          <input readOnly value={attachedData.projectName} className="h-10 border border-border rounded-lg px-3 text-sm font-cairo bg-gray-100 text-muted w-full outline-none cursor-default" />
                        </FieldWrap>
                        <FieldWrap label="القسم">
                          <input readOnly value={attachedData.departmentName} className="h-10 border border-border rounded-lg px-3 text-sm font-cairo bg-gray-100 text-muted w-full outline-none cursor-default" />
                        </FieldWrap>
                        <FieldWrap label="مرجع أمر التوريد">
                          <input readOnly value={attachedData.purchaseOrderRefNumber} className="h-10 border border-border rounded-lg px-3 text-sm font-cairo bg-gray-100 text-muted w-full outline-none cursor-default" />
                        </FieldWrap>
                      </>
                    )}

                    <FieldWrap label="العملة" required>
                      <input type="hidden" name="Currency" value={currency} />
                      <SearchableSelect options={CURRENCY_OPTIONS} value={currency} onChange={setCurrency} required placeholder="اختر العملة" />
                    </FieldWrap>

                    <FieldWrap label={isOriginal ? 'قيمة العقد' : 'قيمة ملحق العقد'} required>
                      <input
                        name="Value"
                        required
                        inputMode="numeric"
                        onKeyDown={e => { if (!/[0-9]/.test(e.key) && e.key !== 'Backspace') e.preventDefault(); }}
                        className="h-10 border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface w-full outline-none focus:border-navy-mid focus:bg-white transition-colors"
                        placeholder="0"
                      />
                    </FieldWrap>

                    <FieldWrap label={'تاريخ  العقد' } required>
                      <input
                        type="date"
                        name="ContractDate"
                        required
                        className="h-10 border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface w-full outline-none focus:border-navy-mid focus:bg-white transition-colors"
                      />
                    </FieldWrap>


                    <FieldWrap label={'تاريخ تسليم إعتماد' } required>
                      <input
                        type="date"
                        name="DateOfReceipt"
                        required
                        className="h-10 border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface w-full outline-none focus:border-navy-mid focus:bg-white transition-colors"
                      />
                    </FieldWrap>

                    <FieldWrap label={'تاريخ تسليم العقد' } required>
                      <input
                        type="date"
                        name="ApprovalDeliveryDate"
                        required
                        className="h-10 border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface w-full outline-none focus:border-navy-mid focus:bg-white transition-colors"
                      />
                    </FieldWrap>


                    {isOriginal && (
                      <>
                        <FieldWrap label="مرجع أمر التوريد">
                          <input name="PurchaseOrdNumRef" className="h-10 border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface w-full outline-none focus:border-navy-mid focus:bg-white transition-colors" placeholder="مرجع أمر التوريد" />
                        </FieldWrap>
                        <FieldWrap label="نوع القسم" required>
                          <input type="hidden" name="Department" value={department} />
                          <SearchableSelect required options={DEPT_OPTIONS} value={department} onChange={setDepartment} placeholder="اختر..." />
                        </FieldWrap>
                      </>
                    )}

                    <FieldWrap label="مرجع قديم">
                      <input name="OldRef" className="h-10 border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface w-full outline-none focus:border-navy-mid focus:bg-white transition-colors" placeholder="مرجع قديم" />
                    </FieldWrap>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <FieldWrap label={isOriginal ? 'تفاصيل العقد' : 'تفاصيل ملحق العقد'} required>
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
                  <FieldWrap label="صورة لشخص">
                    <div className="flex gap-2">
                      <input
                        name="FollowingPerson"
                        readOnly
                        value={followingPersonDisplay}
                        className="h-10 flex-1 border border-border rounded-lg px-3 text-sm font-cairo bg-gray-100 text-muted w-full outline-none cursor-default"
                        placeholder="اختر الأشخاص..."
                      />
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setPersonModalError(''); setPersonModalOpen(true); }}>
                        اختر
                      </Button>
                    </div>
                  </FieldWrap>
                </div>
              </>
            )}
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