import { useState, useEffect } from 'react';
import GenericPostForm from '../components/Genericpostform';
import {  FieldWrap } from '../components/SearchableSelect';
import { Modal, Button, Alert } from '../components/UI';
import { API_BASE_URL  , COMPANY_POST_HOST} from '../config/constants';
import type {  Person } from '../types';

export default function IncomingPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  const [followOption, setFollowOption] = useState('');
  const [followNotes, setFollowNotes] = useState('');
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [documentNumber, setDocumentNumber] = useState('');
  const [notesManuallyEdited, setNotesManuallyEdited] = useState(false);

  // Copy from
  //const [enableCopy, setEnableCopy] = useState(false);
  // const [copyItems, setCopyItems] = useState<CopyItem[]>([]);
  // const [copyFrom, setCopyFrom] = useState<CopyItem | null>(null);
  // const [copiedData, setCopiedData] = useState<Record<string, unknown> | null>(null);
  // const [loadingCopy, setLoadingCopy] = useState(false);

  const [docType, setDocType] = useState('1');
  //const [saveDate, setSaveDate] = useState('');
  const [loadError, setLoadError] = useState('');

  const [personModalError, setPersonModalError] = useState('');

  useEffect(() => {
      if (notesManuallyEdited || !followOption) return;
      const num = documentNumber || '___';
      const link = COMPANY_POST_HOST;
      const map: Record<string, string> = {
      Sharing: `السادة الأفاضل،
      يرجى التكرم بالاطلاع على الوارد رقم ${num} والمشاركة برأيكم أو ملاحظاتكم إن وجدت.
      يمكنكم الاطلاع على تفاصيل الوارد من خلال الرابط التالي:
      ${link}`,

      Followed: `السادة الأفاضل،
      نرجو منكم التكرم بمتابعة الوارد رقم ${num} واتخاذ اللازم حسب الإجراءات المعتمدة.
      يمكنكم الاطلاع على تفاصيل الوارد من خلال الرابط التالي:
      ${link}`,

      Escalated: `السادة الأفاضل،
      يرجى التكرم بالإسراع في اتخاذ الإجراءات اللازمة بشأن الوارد رقم ${num}، نظرًا لأهمية الموضوع.
      يمكنكم الاطلاع على تفاصيل الوارد من خلال الرابط التالي:
      ${link}`,
      };
      setFollowNotes(map[followOption] ?? '');
    }, [followOption, documentNumber, notesManuallyEdited]);
  

  useEffect(() => {
    const load = async () => {
      try {
        const [personsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/SysUsers/getfollowingpersons`),
          fetch(`${API_BASE_URL}/Incoming/GetDocumentNumbers`),
        ]);
       // const projs = await projRes.json();
        const pers = await personsRes.json();
       // const nums = await docNumsRes.json();
       // setProjects(Array.isArray(projs) ? projs : []);
        setPersons(Array.isArray(pers) ? pers : []);
       // setCopyItems(Array.isArray(nums) ? nums.map((x: { id: string; documentNumber: string }) => ({ id: x.id, name: x.documentNumber })) : []);
      } catch {
        setLoadError('حدث خطأ أثناء تحميل البيانات');
      }
    };
    load();
  }, []);

  // const handleCopySelect = async (item: CopyItem | null) => {
  //   setCopyFrom(item);
  //   if (!item) { setCopiedData(null); return; }
  //   setLoadingCopy(true);
  //   try {
  //     const res = await fetch(`${API_BASE_URL}/Incoming/GetInComingToBeCopied/${item.id}`);
  //     const data = await res.json();
  //     setCopiedData(data);
  //   } catch {
  //     setCopiedData(null);
  //   } finally {
  //     setLoadingCopy(false);
  //   }
  // };

  const followingPersonDisplay = selectedPersons
    .map(id => persons.find(p => p.id === id)?.name)
    .filter(Boolean)
    .join('، ');

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

  
  // const topFields = (
  //   <div className="space-y-3">
  //     {loadError && <Alert type="error">{loadError}</Alert>}

  //     {/* Copy toggle */}
  //     <label className="flex items-center gap-2 cursor-pointer w-fit">
  //       <input
  //         type="checkbox"
  //         checked={enableCopy}
  //         onChange={e => {
  //           setEnableCopy(e.target.checked);
  //           if (!e.target.checked) { setCopyFrom(null); setCopiedData(null); }
  //         }}
  //         className="w-4 h-4 accent-navy-mid"
  //       />
  //       <span className="text-sm font-bold text-navy-dark">نسخ بيانات من مستند سابق</span>
  //     </label>

  //     {enableCopy && (
  //       <div className="flex items-center gap-2">
  //         <div className="flex-1">
  //           <SearchableSelect
  //             options={copyItems}
  //             value={copyFrom?.id ?? ''}
  //             onChange={id => {
  //               const item = copyItems.find(c => c.id === id) ?? null;
  //               handleCopySelect(item);
  //             }}
  //             placeholder="ابحث عن مستند..."
  //           />
  //         </div>
  //         {loadingCopy && <div className="w-4 h-4 rounded-full border-2 border-navy-mid border-t-transparent animate-spin" />}
  //       </div>
  //     )}
  //   </div>
  // );

  const extraFields = (
    <div className="mt-6 space-y-4">
      <div className="text-xs font-bold text-muted uppercase tracking-widest mb-3.5 flex items-center gap-2">
        <span className="inline-block w-0.5 h-3.5 bg-navy-mid rounded-sm" />
        بيانات إضافية
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <FieldWrap label="نوع المستند" required>
          <select
            name="DocumentType"
            value={docType}
            onChange={e => setDocType(e.target.value)}
            required
            className="h-10 border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface w-full outline-none focus:border-navy-mid focus:bg-white transition-colors appearance-none cursor-pointer"
          >
            <option value="">اختر...</option>
            <option value="1">إيميل</option>
            <option value="2">مذكرة داخلية</option>
            <option value="3">طلب شراء</option>
          </select>
        </FieldWrap>

        {/* <FieldWrap label="تاريخ الحفظ" required>
          <input
            type="date"
            name="SaveDate"
            required
            value={saveDate}
            onChange={e => setSaveDate(e.target.value)}
            className="h-10 border border-border rounded-lg px-3 text-sm font-cairo text-navy-dark bg-surface w-full outline-none focus:border-navy-mid focus:bg-white transition-colors"
          />
        </FieldWrap> */}


      </div>
        <FieldWrap label="صورة لشخص" >
          <div className="flex gap-2">
            <input
              name="FollowingPerson"
              readOnly
              value={followingPersonDisplay}
              className="h-10 flex-1 border border-border rounded-lg px-3 text-sm font-cairo bg-gray-100 text-muted w-full outline-none cursor-default"
              placeholder="اختر الأشخاص..."
            />
            <Button variant="ghost" size="sm" type="button" onClick={() => { setPersonModalError(''); setPersonModalOpen(true); }}>
              اختر
            </Button>
          </div>
        </FieldWrap>

      {/* Hidden followup fields */}
      <input type="hidden" name="Options" value={followOption} />
      <input type="hidden" name="EmailContent" value={followNotes} />
      {selectedPersons.map(id => (
        <input key={id} type="hidden" name="SentEmailsTo" value={id} />
      ))}
    </div>
  );

  return (
    <>
      <GenericPostForm
        title="إدخال مستند جديد (وارد)"
        endpoint="/Incoming/CreateIncoming"
        serialPrefix="WRD-"
        serialNumberEndpoint="/Incoming/GetIncomingMaxSerialNumber"
        fetchCompanies={false}
        fetchDeliveryDirection = {false}
        //topFields={topFields}
        extraFields={extraFields}
        enableOriginalSender = {true}
        onDocumentChange={setDocumentNumber} 
      />

      {/* Person selection modal */}
      <Modal
        open={personModalOpen}
        onClose={() => setPersonModalOpen(false)}
        title="متابعة واستعلام"
        footer={
          <Button onClick={() => handleApplyPersonModal()}>تطبيق</Button>
        }
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
            <div className="border border-border rounded-lg overflow-hidden">
              {persons.map(p => (
                <label key={p.id} className="flex items-center gap-2 px-3 py-2 hover:bg-surface cursor-pointer border-b border-border last:border-b-0">
                  <input
                    type="checkbox"
                    checked={selectedPersons.includes(p.id)}
                    onChange={e => {
                      setSelectedPersons(prev =>
                        e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id)
                      );
                    }}
                    className="w-4 h-4 accent-navy-mid"
                  />
                  <span className="text-sm text-navy-dark">{p.name}</span>
                </label>
              ))}
            </div>
          </FieldWrap>

          <FieldWrap label="النص">
            <textarea
              rows={4}
              value={followNotes}
              onChange={e => setFollowNotes(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm font-cairo text-navy-dark bg-surface w-full outline-none resize-none leading-relaxed focus:border-navy-mid focus:bg-white transition-colors"
              placeholder="أدخل النص..."
            />
          </FieldWrap>
        </div>
        </div>
      </Modal>
    </>
  );
}