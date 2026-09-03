import React, { useState, useRef, useEffect } from 'react';
import { Alert, Spinner } from './UI';
import { API_BASE_URL, authHeaders } from '../config/api';

interface BaseFormProps {
  title: string;
  endpoint: string;
  extraFields: React.ReactNode;
  useJson?: boolean;
  onSubmit?: (data: Record<string, unknown>) => Promise<void>;
  onSuccess?: () => void;
  onReset?: () => void;
  serialBadge?: string;
}

export default function BaseForm({ title, endpoint, extraFields, useJson = false, onSubmit, onSuccess, onReset, serialBadge }: BaseFormProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Scroll to the alert whenever an error or success message appears
  useEffect(() => {
    if ((error || success) && alertRef.current) {
      requestAnimationFrame(() => {
        alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [error, success]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');

    try {
      const form = e.currentTarget;

      if (useJson && onSubmit) {
        const fd = new FormData(form);
        const data: Record<string, unknown> = {};
        fd.forEach((v, k) => { data[k] = v; });
        await onSubmit(data);
        setSuccess('تم الحفظ بنجاح ✓');
        form.reset(); onSuccess?.();
        return;
      }

      const formData = new FormData(form);
      // Strip serial prefix (WRD-123 → 123)
      const sn = formData.get('SerialNumber');
      if (typeof sn === 'string') formData.set('SerialNumber', sn.replace(/\D+/g, ''));

      var token = localStorage.getItem('authToken');

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST', headers: authHeaders(), body: formData,
      });
      const result = await res.json();

      if ((res.ok && result.success) || result.status === true) {
        setSuccess('تم حفظ المستند بنجاح ✓');
        setTimeout(() => { form.reset(); onSuccess?.(); }, 1800);
      } else {
        setError(result.message || 'حدث خطأ أثناء إرسال البيانات.');
      }
    } catch {
      setError('تعذّر الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    formRef.current?.reset();   // clears plain uncontrolled DOM fields
    onReset?.();                // clears parent's controlled state (dropdowns, dates, files, etc.)
    setError(''); setSuccess('');
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div ref={topRef} className="w-full max-w-5xl mx-auto anim-fade-up">
      <div className="siac-card overflow-hidden">
        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-7 py-4 sm:py-5"
          style={{ background: 'linear-gradient(135deg,#001f45 0%,#00366e 100%)' }}>
          <div>
            <h2 className="text-white font-bold text-sm sm:text-base leading-tight">{title}</h2>
            <p className="text-white/40 text-[10px] sm:text-[11px] mt-0.5 font-mono">
              الحقول المطلوبة مشار إليها بـ <span className="text-red-400">*</span>
            </p>
          </div>
          {serialBadge && (
            <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border"
              style={{ background: 'rgba(201,168,76,.14)', borderColor: 'rgba(201,168,76,.3)' }}>
              <span className="text-[9px] text-white/40 font-mono uppercase tracking-widest hidden sm:inline">رقم</span>
              <span className="font-mono font-bold text-sm" style={{ color: '#e8d08a' }}>{serialBadge}</span>
            </div>
          )}
        </div>

        {/* Alerts — scroll target */}
        {(error || success) && (
          <div ref={alertRef} className="px-5 sm:px-7 pt-4 sm:pt-5 space-y-2">
            {error   && <Alert type="error"   onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}
          </div>
        )}

        {/* Body */}
        <form ref={formRef} onSubmit={handleSubmit}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
              e.preventDefault(); formRef.current?.requestSubmit();
            }
          }}
          className="px-4 sm:px-7 py-5 sm:py-6">
          {extraFields}

          {/* Submit row */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-5 sm:pt-6 mt-6 sm:mt-8 border-t border-border">
            <button type="button" onClick={handleReset} className="btn btn-secondary">
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                <path d="M1 7A6 6 0 1 1 7 13M1 7V3m0 4H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              إعادة تعيين
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg justify-center">
              {loading
                ? <><Spinner size="sm" />جاري الحفظ...</>
                : <><svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M2 8l4.5 4.5 7.5-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>حفظ المستند</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}