import React, { useState, useRef, useEffect } from 'react';
import type { Option } from '../types';

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function SearchableSelect({ options, value, onChange, name, required, disabled, placeholder = 'اختر...', className = '' }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.id === value);
  const filtered = query ? options.filter(o => o.name.toLowerCase().includes(query.toLowerCase())) : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    setOpen(v => !v);
    if (!open) setTimeout(() => inputRef.current?.focus(), 30);
  };

  const handleSelect = (id: string) => { onChange(id); setOpen(false); setQuery(''); };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value} />}

      <button type="button" onClick={handleOpen} disabled={disabled}
        className={[
          'siac-input flex items-center justify-between gap-2 text-right cursor-pointer',
          open ? '!border-navy-mid !bg-white ring-[3px] ring-navy-mid/10' : '',
          disabled ? 'opacity-50 !cursor-not-allowed' : '',
          !selected ? '!text-muted' : '',
        ].join(' ')}>
        <span className="flex-1 truncate text-right text-sm">{selected?.name ?? placeholder}</span>
        <svg className={`w-3.5 h-3.5 flex-shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute z-[9999] top-[calc(100%+3px)] left-0 right-0 bg-white rounded-xl border border-border overflow-hidden shadow-dropdown anim-scale-in">
          <div className="p-2 border-b border-border">
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="بحث..."
              className="w-full h-8 rounded-lg border border-border bg-surface px-2.5 text-xs font-cairo text-[#1a2744] outline-none focus:border-navy-mid" />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            
            {filtered.length === 0 && <li className="px-3 py-3 text-xs text-center text-muted font-cairo">لا توجد نتائج</li>}
            {filtered.map(opt => (
              <li key={opt.id} onMouseDown={() => handleSelect(opt.id)}
                className={['flex items-center gap-2 px-3 py-2.5 text-sm font-cairo cursor-pointer transition-colors',
                  opt.id === value ? 'bg-[#e6f0fb] text-navy-mid font-bold' : 'text-[#1a2744] hover:bg-surface'].join(' ')}>
                {opt.id === value && (
                  <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5l4 4 6-8" stroke="#00428d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                <span className={opt.id === value ? '' : 'mr-5'}>{opt.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {required && !value && <input tabIndex={-1} required className="sr-only" onChange={() => {}} value="" aria-hidden />}
    </div>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────
export function FieldWrap({ label, required, children, className = '', hint }: {
  label: string; required?: boolean; children: React.ReactNode; className?: string; hint?: string;
}) {
  return (
    <div className={`field-wrap ${className}`}>
      <label className="field-label">{label}{required && <span className="field-req">*</span>}</label>
      {children}
      {hint && <p className="text-[10px] text-muted mt-0.5">{hint}</p>}
    </div>
  );
}