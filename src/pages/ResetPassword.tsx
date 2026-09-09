
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const ENDPOINT = {
    ResetPassword: `${API_BASE_URL}/SysUsers/resetpassword`,
  };

  useEffect(() => {
    if (!token) {
      setError(
        'رابط إعادة تعيين كلمة المرور غير صالح. يرجى طلب رابط جديد.'
      );
    }
  }, [token, email]);

  const validatePassword = () => {
    if (newPassword.length < 6) {
      return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';
    }

    if (newPassword !== confirmPassword) {
      return 'كلمتا المرور غير متطابقتين.';
    }

    return '';
  };

  const resetPassword = async (
    dto: ResetPasswordDTO
  ): Promise<boolean> => {
    const response = await fetch(ENDPOINT.ResetPassword, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      let errMsg = 'فشل إعادة تعيين كلمة المرور';

      try {
        const err = await response.json();

        if (err && err.message) {
          errMsg = err.message;
        }
      } catch {
        // Ignore JSON parsing error
      }

      throw new Error(errMsg);
    }

    const result = await response.json();

    return result as boolean;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    const passwordError = validatePassword();

    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!token) {
      setError(
        'رابط إعادة تعيين كلمة المرور غير صالح. يرجى طلب رابط جديد.'
      );
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword({
        token,
        newPassword,
      });

      if (!result) {
        setError('تعذر إعادة تعيين كلمة المرور.');
        return;
      }

      setSuccess(
        'تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.'
      );

      setTimeout(() => {
        navigate('/login');
      }, 4500);
    } catch (err: any) {
      setError(
        err.message || 'تعذر إعادة تعيين كلمة المرور.'
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(30,41,59,0.8)',
    border: '1px solid rgba(71,85,105,0.6)',
    color: '#e2e8f0',
    fontFamily: 'inherit',
  };

  const handleInputFocus = (
    e: React.FocusEvent<HTMLInputElement>
  ) => {
    e.currentTarget.style.border =
      '1px solid rgba(59,130,246,0.7)';

    e.currentTarget.style.boxShadow =
      '0 0 0 3px rgba(59,130,246,0.1)';
  };

  const handleInputBlur = (
    e: React.FocusEvent<HTMLInputElement>
  ) => {
    e.currentTarget.style.border =
      '1px solid rgba(71,85,105,0.6)';

    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        fontFamily: "'Cairo', 'Tajawal', sans-serif",
      }}
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

        {/* Glowing orb */}
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
            <path
              d="M256 0L0 0L256 256Z"
              fill="url(#g1)"
            />

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

        {/* Top accent */}
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
                border:
                  '1px solid rgba(59,130,246,0.4)',
                boxShadow:
                  '0 0 20px rgba(59,130,246,0.2)',
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
              إنشاء كلمة مرور جديدة
            </p>

            {/* Divider */}
            <div className="flex items-center gap-2 mt-4 w-full">
              <div
                className="flex-1 h-px"
                style={{
                  background:
                    'rgba(59,130,246,0.15)',
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
                  background:
                    'rgba(59,130,246,0.15)',
                }}
              />
            </div>
          </div>

          {/* Invalid link / Error */}
          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-3"
              style={{
                background:
                  'rgba(239,68,68,0.1)',
                border:
                  '1px solid rgba(239,68,68,0.3)',
                color: '#fca5a5',
              }}
              role="alert"
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

              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-3"
              style={{
                background:
                  'rgba(34,197,94,0.1)',
                border:
                  '1px solid rgba(34,197,94,0.3)',
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
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* New Password */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: '#94a3b8' }}
              >
                كلمة المرور الجديدة
              </label>

              <div className="relative">

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  dir="ltr"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  required
                  placeholder="••••••••"
                  disabled={
                    !!success ||
                    loading ||
                    (!!error && !token)
                  }
                  className="w-full rounded-xl px-4 py-3 text-left text-sm outline-none transition-all duration-200 pr-10"
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  disabled={!!success || loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-150"
                  style={{
                    color: '#475569',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color =
                      '#94a3b8')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color =
                      '#475569')
                  }
                >
                  {showPassword ? (
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
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />

                      <path
                        strokeLinecap="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: '#94a3b8' }}
              >
                تأكيد كلمة المرور
              </label>

              <div className="relative">

                <input
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  dir="ltr"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  required
                  placeholder="••••••••"
                  disabled={
                    !!success ||
                    loading ||
                    (!!error && !token)
                  }
                  className="w-full rounded-xl px-4 py-3 text-left text-sm outline-none transition-all duration-200 pr-10"
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  disabled={!!success || loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-150"
                  style={{
                    color: '#475569',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color =
                      '#94a3b8')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color =
                      '#475569')
                  }
                >
                  {showConfirmPassword ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />

                      <path
                        strokeLinecap="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Password note */}
            <div
              className="text-xs px-3 py-2 rounded-lg"
              style={{
                background:
                  'rgba(59,130,246,0.06)',
                border:
                  '1px solid rgba(59,130,246,0.12)',
                color: '#64748b',
              }}
            >
              يجب أن تحتوي كلمة المرور على 6 أحرف
              على الأقل.
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={
                !!success ||
                loading ||
                (!!error && !token)
              }
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 relative overflow-hidden mt-2"
              style={{
                background:
                  loading || success
                    ? 'rgba(30,64,175,0.5)'
                    : 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0ea5e9 100%)',
                color:
                  loading || success
                    ? '#93c5fd'
                    : '#ffffff',
                border: 'none',
                cursor:
                  loading ||
                  success ||
                  (!!error && !token)
                    ? 'not-allowed'
                    : 'pointer',
                boxShadow:
                  loading || success
                    ? 'none'
                    : '0 4px 20px rgba(37,99,235,0.4)',
                letterSpacing: '0.03em',
              }}
              onMouseEnter={(e) => {
                if (
                  !loading &&
                  !success &&
                  token
                ) {
                  e.currentTarget.style.transform =
                    'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform =
                  'translateY(0)';
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

                  جارٍ تحديث كلمة المرور...
                </span>
              ) : (
                'تحديث كلمة المرور'
              )}
            </button>
          </form>

          {/* Footer */}
          <div
            className="mt-6 text-center text-sm"
            style={{ color: '#64748b' }}
          >
            تواجه مشكلة؟{' '}

            <Link
              to="/forgotpassword"
              className="font-semibold transition-colors duration-150"
              style={{
                color: '#60a5fa',
              }}
            >
              طلب رابط جديد
            </Link>
          </div>

          <div
            className="mt-3 text-center text-sm"
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
                (e.currentTarget.style.color =
                  '#93c5fd')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color =
                  '#60a5fa')
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

