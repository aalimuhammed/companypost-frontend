
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

interface ForgotPasswordDTO {
  email: string;
}

const ENDPOINT = {
  ForgotPassword: `${API_BASE_URL}/SysUsers/forgotpassword`,
};

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const forgotPassword = async (
    dto: ForgotPasswordDTO
  ): Promise<boolean> => {
    const response = await fetch(ENDPOINT.ForgotPassword, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    return data.success;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await forgotPassword({ email });

      if (!result) {
        setError('تعذر إرسال رابط إعادة تعيين كلمة المرور.');
        return;
      }

      setSuccess(
        'إذا كان البريد الإلكتروني موجودًا في النظام، فسيتم إرسال رابط إعادة تعيين كلمة المرور إليه. يرجى التحقق من البريد الوارد ومجلد الرسائل غير المرغوب فيها.'
      );

      setTimeout(() => {
        navigate('/login');
      }, 4500);
    } catch (err: any) {
      setError(
        err.message || 'تعذر إرسال رابط إعادة تعيين كلمة المرور.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
    >
      {/* ── Geometric background ── */}
      <div className="absolute inset-0 pointer-events-none">

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(
                rgba(99,179,237,0.4) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(99,179,237,0.4) 1px,
                transparent 1px
              )
            `,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Glowing orbs */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{
            background:
              'radial-gradient(circle, #1e40af 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <div
          className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-15"
          style={{
            background:
              'radial-gradient(circle, #0ea5e9 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <svg
            viewBox="0 0 256 256"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M256 0L0 0L256 256Z" fill="url(#g1)" />

            <defs>
              <linearGradient
                id="g1"
                x1="0"
                y1="0"
                x2="256"
                y2="256"
              >
                <stop stopColor="#3b82f6" />
                <stop
                  offset="1"
                  stopColor="#0ea5e9"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* ── Card ── */}
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(59,130,246,0.25)',
          backdropFilter: 'blur(20px)',
          boxShadow:
            '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.1)',
        }}
      >

        {/* Top accent bar */}
        <div
          className="h-1 w-full"
          style={{
            background:
              'linear-gradient(90deg, #1d4ed8 0%, #0ea5e9 50%, #1d4ed8 100%)',
          }}
        />

        <div className="px-8 pt-8 pb-10">

          {/* Logo + Header */}
          <div className="flex flex-col items-center mb-8">

            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 relative"
              style={{
                background:
                  'linear-gradient(135deg, #1e3a5f 0%, #0f2040 100%)',
                border: '1px solid rgba(59,130,246,0.4)',
                boxShadow: '0 0 20px rgba(59,130,246,0.2)',
              }}
            >
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBbsajfYo63U4X9tDQIurfzgG762wNXaeFsg&s"
                alt="شعار الشركة"
                className="w-10 h-10 rounded-lg object-contain"
              />

              {/* Glow ring */}
              <div
                className="absolute inset-0 rounded-2xl opacity-30 animate-pulse"
                style={{
                  border: '2px solid #3b82f6',
                }}
              />
            </div>

            <h1
              className="text-xl font-bold mb-1"
              style={{
                color: '#e2e8f0',
                letterSpacing: '0.01em',
              }}
            >
              نظام المراسلات والخطابات
            </h1>

            <p
              className="text-sm text-center"
              style={{ color: '#64748b' }}
            >
              إعادة تعيين كلمة المرور
            </p>

            {/* Decorative divider */}
            <div className="flex items-center gap-2 mt-4 w-full">
              <div
                className="flex-1 h-px"
                style={{
                  background: 'rgba(59,130,246,0.15)',
                }}
              />

              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: '#3b82f6',
                  opacity: 0.6,
                }}
              />

              <div
                className="flex-1 h-px"
                style={{
                  background: 'rgba(59,130,246,0.15)',
                }}
              />
            </div>
          </div>

          {/* Error alert */}
          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-3"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#fca5a5',
              }}
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5h2v2H9v-2zm0-8h2v6H9V5z"
                  clipRule="evenodd"
                />
              </svg>

              {error}
            </div>
          )}

          {/* Success alert */}
          {success && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-3"
              style={{
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
                color: '#86efac',
              }}
              role="status"
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>

              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: '#94a3b8' }}
              >
                البريد الإلكتروني
              </label>

              <div className="relative">
                <input
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="username@company.com"
                  disabled={!!success || loading}
                  className="w-full rounded-xl px-4 py-3 text-left text-sm outline-none transition-all duration-200 pr-10"
                  style={{
                    background: 'rgba(30,41,59,0.8)',
                    border: '1px solid rgba(71,85,105,0.6)',
                    color: '#e2e8f0',
                    fontFamily: 'inherit',
                    opacity: success || loading ? 0.6 : 1,
                  }}
                  onFocus={(e) => {
                    if (!success && !loading) {
                      e.currentTarget.style.border =
                        '1px solid rgba(59,130,246,0.7)';
                      e.currentTarget.style.boxShadow =
                        '0 0 0 3px rgba(59,130,246,0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border =
                      '1px solid rgba(71,85,105,0.6)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />

                {/* Email icon */}
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#475569' }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!!success || loading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 relative overflow-hidden mt-2"
              style={{
                background:
                  loading || success
                    ? 'rgba(30,64,175,0.5)'
                    : 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0ea5e9 100%)',
                color: loading || success ? '#93c5fd' : '#ffffff',
                border: 'none',
                cursor:
                  loading || success ? 'not-allowed' : 'pointer',
                boxShadow:
                  loading || success
                    ? 'none'
                    : '0 4px 20px rgba(37,99,235,0.4)',
                letterSpacing: '0.03em',
              }}
              onMouseEnter={(e) => {
                if (!loading && !success) {
                  e.currentTarget.style.transform =
                    'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>

                  جارٍ إرسال الرابط...
                </span>
              ) : (
                'إرسال رابط إعادة التعيين'
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div
            className="mt-6 text-center text-sm"
            style={{ color: '#64748b' }}
          >
            تذكرت كلمة المرور؟{' '}

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="font-semibold transition-colors duration-150"
              style={{
                color: '#60a5fa',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = '#93c5fd')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = '#60a5fa')
              }
            >
              تسجيل الدخول
            </button>
          </div>

          {/* Bottom accent */}
          <div
            className="h-px w-full mt-6"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
