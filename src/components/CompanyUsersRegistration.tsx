import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/constants';
import { SearchableSelect } from '../components/SearchableSelect';

interface Company {
  id: string;
  name: string;
}

const ALLOWED_DOMAINS = [
  'siac-construction.com',
  'siac-egypt.com',
  'siac.com.eg',
  'siacdevelopments.com',
  'siacholding.com',
  'siacfm.com',
];

/* ── Reusable field wrapper ── */
const Field: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div>
    <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
      {label}
    </label>
    {children}
  </div>
);

/* ── Styled input base styles (inline for dynamic focus) ── */
const inputBase: React.CSSProperties = {
  width: '100%',
  borderRadius: '0.75rem',
  padding: '0.7rem 1rem',
  fontSize: '0.875rem',
  outline: 'none',
  background: 'rgba(30,41,59,0.8)',
  border: '1px solid rgba(71,85,105,0.6)',
  color: '#e2e8f0',
  transition: 'all 0.15s ease',
  fontFamily: "inherit",
  textAlign: 'left',
};

const StyledInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      dir="ltr"
      style={{
        ...inputBase,
        border: focused ? '1px solid rgba(59,130,246,0.7)' : '1px solid rgba(71,85,105,0.6)',
        boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none',
      }}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
    />
  );
};

/* ── Step indicator ── */
const StepDot: React.FC<{ active: boolean; done: boolean; num: number }> = ({ active, done, num }) => (
  <div
    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
    style={{
      background: done
        ? 'linear-gradient(135deg, #1d4ed8, #0ea5e9)'
        : active
        ? 'rgba(37,99,235,0.25)'
        : 'rgba(30,41,59,0.8)',
      border: done
        ? 'none'
        : active
        ? '1px solid rgba(59,130,246,0.7)'
        : '1px solid rgba(71,85,105,0.4)',
      color: done ? '#fff' : active ? '#60a5fa' : '#475569',
    }}
  >
    {done ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ) : num}
  </div>
);

/* ══════════════════════════════════════════ */
const CompanyUsersRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = personal info, 2 = account details
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
 // const [selectOpen, setSelectOpen] = useState(false);

  const [formData, setFormData] = useState({
    UserName: '',
    Name: '',
    Email: '',
    HrCode: '',
    Password: '',
  });

  /* ── Fetch companies ── */
  useEffect(() => {
    const load = async () => {
      setLoadingCompanies(true);
      try {
        const res = await fetch(`${API_BASE_URL}/Company/get-companies`);
        if (!res.ok) throw new Error();
        setCompanies(await res.json());
      } catch {
        setAlert({ type: 'error', message: 'حدث خطأ أثناء تحميل قائمة الشركات.' });
      } finally {
        setLoadingCompanies(false);
      }
    };
    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const validateStep1 = () => {
    if (!formData.Name.trim() || !formData.HrCode.trim()) {
      setAlert({ type: 'error', message: 'يرجى تعبئة جميع الحقول.' });
      return false;
    }
    setAlert(null);
    return true;
  };

  const validateFull = () => {
    if (!formData.UserName.trim() || !formData.Email.trim() || !formData.Password.trim()) {
      setAlert({ type: 'error', message: 'يرجى تعبئة جميع الحقول المطلوبة.' });
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.Email)) {
      setAlert({ type: 'error', message: 'يرجى إدخال بريد إلكتروني صالح.' });
      return false;
    }

    if(formData.Password.length<6)
    {
      setAlert({ type: 'error', message: 'يجب ألا تقل كلمة المرور عن 6 حروف ' });
      return false;
    }
    const domain = formData.Email.split('@')[1]?.toLowerCase();
    if (!ALLOWED_DOMAINS.includes(domain)) {
      setAlert({ type: 'error', message: `النطاق "${domain}" غير مسموح به.` });
      return false;
    }
    if (!selectedCompany) {
      setAlert({ type: 'error', message: 'يرجى اختيار الشركة.' });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    if (!validateFull()) return;
    setSubmitting(true);
    const token = localStorage.getItem('authToken');
    try {
      const res = await fetch(`${API_BASE_URL}/SysUsers/createCompanyUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          UserName: formData.UserName.trim(),
          Name: formData.Name.trim(),
          Email: formData.Email.trim(),
          HrCode: formData.HrCode.trim(),
          Password: formData.Password,
          Company: selectedCompany,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'فشل في إرسال البيانات.');
      }
      setAlert({ type: 'success', message: 'تم إنشاء المستخدم بنجاح' });
      setFormData({ UserName: '', Name: '', Email: '', HrCode: '', Password: '' });
      setSelectedCompany('');
      setStep(1);
      navigate('/login');
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'حدث خطأ أثناء الإرسال.' });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCompanyName = companies.find((c) => c.id === selectedCompany)?.name;

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center relative overflow-hidden py-8"
      style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
    >
      {/* ── Geometric background ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(99,179,237,0.4) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(99,179,237,0.4) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #1e40af 0%, transparent 70%)', filter: 'blur(50px)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)', filter: 'blur(50px)' }}
        />
        {/* Corner accent */}
        <div className="absolute bottom-0 left-0 w-64 h-64 opacity-10 rotate-180">
          <svg viewBox="0 0 256 256" fill="none"><path d="M256 0L0 0L256 256Z" fill="url(#g2)" />
            <defs><linearGradient id="g2" x1="0" y1="0" x2="256" y2="256">
              <stop stopColor="#3b82f6" /><stop offset="1" stopColor="#0ea5e9" stopOpacity="0" />
            </linearGradient></defs>
          </svg>
        </div>
      </div>

      {/* ── Card ── */}
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(59,130,246,0.2)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.08)',
        }}
      >
        {/* Top bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #1d4ed8 0%, #0ea5e9 50%, #1d4ed8 100%)' }} />

        <div className="px-8 pt-7 pb-9">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 relative"
              style={{
                background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2040 100%)',
                border: '1px solid rgba(59,130,246,0.4)',
                boxShadow: '0 0 20px rgba(59,130,246,0.15)',
              }}
            >
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBhFq_A1raDvxGepmfefP7JhlsYJDLoj-F9w&s"
                alt="logo"
                className="w-9 h-9 rounded-lg object-contain"
              />
            </div>
            <h1 className="text-lg font-bold" style={{ color: '#e2e8f0' }}>
              تسجيل مستخدم جديد
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
              نظام المراسلات والخطابات
            </p>

            <div className="flex items-center gap-2 mt-4 w-full">
              <div className="flex-1 h-px" style={{ background: 'rgba(59,130,246,0.12)' }} />
              <div className="w-1 h-1 rounded-full" style={{ background: '#3b82f6', opacity: 0.5 }} />
              <div className="flex-1 h-px" style={{ background: 'rgba(59,130,246,0.12)' }} />
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <StepDot num={1} active={step === 1} done={step > 1} />
            <div className="flex-1 h-px max-w-16" style={{ background: step > 1 ? 'rgba(59,130,246,0.6)' : 'rgba(71,85,105,0.4)', transition: 'background 0.3s' }} />
            <StepDot num={2} active={step === 2} done={false} />
            <div className="text-xs mr-1" style={{ color: '#475569' }}>
              {step === 1 ? 'البيانات الشخصية' : 'بيانات الحساب'}
            </div>
          </div>

          {/* Alert */}
          {alert && (
            <div
              className="mb-4 px-4 py-3 rounded-xl text-sm flex items-start gap-3"
              style={{
                background: alert.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${alert.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: alert.type === 'success' ? '#86efac' : '#fca5a5',
              }}
            >
              {alert.type === 'success' ? (
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5h2v2H9v-2zm0-8h2v6H9V5z" clipRule="evenodd" />
                </svg>
              )}
              {alert.message}
            </div>
          )}

          {/* Loading spinner for companies */}
          {loadingCompanies ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div
                className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'rgba(59,130,246,0.4)', borderTopColor: '#3b82f6' }}
              />
              <span className="text-sm" style={{ color: '#475569' }}>جارٍ تحميل البيانات...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-4">
                  <Field label="الاسم الكامل *">
                    <StyledInput
                      name="Name"
                      value={formData.Name}
                      onChange={handleChange}
                      placeholder="Full Name"
                      required
                    />
                  </Field>
                  <Field label="كود الموظف *">
                    <StyledInput
                      name="HrCode"
                      value={formData.HrCode}
                      onChange={handleChange}
                      placeholder="EMP-001"
                      required
                    />
                  </Field>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full py-3 rounded-xl text-sm font-semibold mt-2 transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0ea5e9 100%)',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      letterSpacing: '0.02em',
                      boxShadow: '0 4px 20px rgba(37,99,235,0.35)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    التالي ←
                  </button>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-4">
                  <Field label="اسم المستخدم *">
                    <StyledInput
                      name="UserName"
                      value={formData.UserName}
                      onChange={handleChange}
                      placeholder="john.doe"
                      required
                    />
                  </Field>

                  <Field label="كلمة المرور *">
                    <div className="relative">
                      <StyledInput
                        name="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.Password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                        style={{ paddingRight: '2.5rem' } as any}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </Field>

                  <Field label="البريد الإلكتروني *">
                    <StyledInput
                      name="Email"
                      type="email"
                      value={formData.Email}
                      onChange={handleChange}
                      placeholder="name@siac-egypt.com"
                      required
                    />
                  </Field>

                  {/* Custom Select */}
               <Field label="الشركة *">
                <SearchableSelect
                    options={companies.map((company) => ({
                    id: String(company.id),
                    name: company.name,
                    }))}
                    value={selectedCompany}
                    onChange={(value) => setSelectedCompany(value)}
                    placeholder="اختر الشركة"
                    required
                    className="w-full"
                />
                </Field>

                  {/* Actions */}
                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => { setStep(1); setAlert(null); }}
                      className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                      style={{
                        background: 'rgba(30,41,59,0.6)',
                        border: '1px solid rgba(71,85,105,0.5)',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(99,130,186,0.5)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(71,85,105,0.5)')}
                    >
                      → رجوع
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-[2] py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                      style={{
                        background: submitting
                          ? 'rgba(30,64,175,0.4)'
                          : 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0ea5e9 100%)',
                        color: submitting ? '#93c5fd' : '#fff',
                        border: 'none',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        letterSpacing: '0.02em',
                        boxShadow: submitting ? 'none' : '0 4px 20px rgba(37,99,235,0.35)',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          جارٍ الإنشاء...
                        </span>
                      ) : 'إنشاء المستخدم'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 text-center text-xs" style={{ color: '#64748b' }}>
            لديك حساب بالفعل؟{' '}
            <button
              onClick={() => navigate('/login')}
              style={{ color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 600 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#93c5fd')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#60a5fa')}
            >
              تسجيل الدخول
            </button>
          </div>
        </div>

        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.25), transparent)' }} />
      </div>
    </div>
  );
};

export default CompanyUsersRegistration;