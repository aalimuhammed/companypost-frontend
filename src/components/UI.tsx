import React from 'react';

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const s = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-8 h-8 border-[3px]' }[size];
  return <span className={`siac-spinner ${s} ${className}`} />;
}

// ─── Loading state ────────────────────────────────────────────────────────────
export function LoadingPane({ label = 'جاري التحميل...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[280px] gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-muted font-cairo">{label}</p>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export type BadgeVariant = 'blue' | 'gold' | 'green' | 'red' | 'purple' | 'gray' | 'navy';

export function Badge({ variant = 'blue', children }: { variant?: BadgeVariant; children: React.ReactNode }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function statusBadge(status?: number | string | null): { label: string; variant: BadgeVariant } {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    '1': { label: 'مكتمل',        variant: 'green'  },
    '2': { label: 'قيد التنفيذ',  variant: 'gold'   },
    '3': { label: 'مرفوض',        variant: 'red'    },
    '4': { label: 'معتمد',        variant: 'blue'   },
    '5': { label: 'قيد المراجعة', variant: 'purple' },
    '6': { label: 'لا شئ',        variant: 'gray'   },
  };
  return map[String(status ?? '6')] ?? { label: 'غير محدد', variant: 'gray' };
}

// ─── Alert ────────────────────────────────────────────────────────────────────
type AlertType = 'error' | 'success' | 'info' | 'warning';
const alertCfg: Record<AlertType, string> = {
  error:   'bg-red-50   border-red-200   text-red-700',
  success: 'bg-green-50 border-green-200 text-green-700',
  info:    'bg-blue-50  border-blue-200  text-blue-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
};
const alertIcons: Record<AlertType, string> = {
  error: '✕', success: '✓', info: 'ℹ', warning: '⚠',
};

export function Alert({ type = 'info', children, onClose }: {
  type?: AlertType; children: React.ReactNode; onClose?: () => void;
}) {
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm font-cairo ${alertCfg[type]}`}>
      <span className="font-bold flex-shrink-0 mt-px">{alertIcons[type]}</span>
      <span className="flex-1 leading-relaxed">{children}</span>
      {onClose && (
        <button onClick={onClose} className="flex-shrink-0 opacity-50 hover:opacity-100 text-lg leading-none cursor-pointer border-none bg-transparent">×</button>
      )}
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', loading, size = 'md', children, disabled, className = '', ...props }: ButtonProps) {
  const v = { primary: 'btn-primary', secondary: 'btn-secondary', ghost: 'btn-ghost', danger: 'btn-danger', icon: 'btn-icon' }[variant];
  const s = { sm: 'btn-sm', md: '', lg: 'btn-lg' }[size];
  return (
    <button {...props} disabled={disabled || loading} className={`btn ${v} ${s} ${className}`}>
      {loading ? <Spinner size="sm" /> : null}
      {children}
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, size = 'md' }: {
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; footer?: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const maxW = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 anim-fade-in"
      style={{ background: 'rgba(0,31,69,.55)' }} onClick={onClose}>
      <div className={`bg-white w-full ${maxW} max-h-[92vh] sm:max-h-[88vh] flex flex-col
                       rounded-t-2xl sm:rounded-2xl shadow-modal anim-scale-in overflow-hidden`}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h3 className="text-[15px] font-bold text-[#1a2744]">{title}</h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-surface hover:text-[#1a2744] cursor-pointer border-none bg-transparent transition-colors text-xl leading-none">×</button>
        </div>
        <div className="px-5 py-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-border flex-shrink-0 bg-[#f8fafc]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({ message = 'لا توجد بيانات', hint }: { message?: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted">
      <svg className="w-12 h-12 opacity-25" viewBox="0 0 48 48" fill="none">
        <rect x="8" y="8" width="32" height="32" rx="6" stroke="currentColor" strokeWidth="2"/>
        <path d="M18 24h12M18 30h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <p className="text-sm font-cairo font-medium">{message}</p>
      {hint && <p className="text-xs text-muted/70 font-cairo">{hint}</p>}
    </div>
  );
}

// ─── Page header ──────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-[#1a2744] leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-xs sm:text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ page, total, pageSize = 10, onChange }: {
  page: number; total: number; pageSize?: number; onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center flex-wrap gap-1 px-4 py-3 border-t border-border">
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}
        className="h-8 px-2.5 rounded-md border border-border text-xs font-cairo text-muted hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-white transition-colors">
        ‹ السابق
      </button>
      {start > 1 && <><button onClick={() => onChange(1)} className="h-8 w-8 rounded-md border border-border text-xs bg-white text-muted hover:bg-surface cursor-pointer">1</button><span className="text-muted text-xs px-1">…</span></>}
      {pages.map(p => (
        <button key={p} onClick={() => onChange(p)}
          className={`h-8 w-8 rounded-md border text-xs cursor-pointer transition-colors font-cairo font-bold ${page === p ? 'bg-navy-mid text-white border-navy-mid' : 'bg-white border-border text-muted hover:bg-surface'}`}>
          {p}
        </button>
      ))}
      {end < totalPages && <><span className="text-muted text-xs px-1">…</span><button onClick={() => onChange(totalPages)} className="h-8 w-8 rounded-md border border-border text-xs bg-white text-muted hover:bg-surface cursor-pointer">{totalPages}</button></>}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="h-8 px-2.5 rounded-md border border-border text-xs font-cairo text-muted hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-white transition-colors">
        التالي ›
      </button>
    </div>
  );
}