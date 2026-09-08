import React from 'react';
import { useLocation } from 'react-router-dom';

const breadcrumbs: Record<string, { section: string; page: string }> = {
  '/':                     { section: 'الرئيسية',   page: 'لوحة التحكم'          },
  '/incoming':             { section: 'المستندات',  page: 'وارد جديد'             },
  '/outgoing/external':    { section: 'المستندات',  page: 'صادر خارجي'            },
  '/outgoing/internal':    { section: 'المستندات',  page: 'صادر داخلي'            },
  '/contracts':            { section: 'العقود',     page: 'إضافة عقد'              },
  '/purchase-orders':      { section: 'التوريد',    page: 'إضافة أمر توريد'        },
  '/documents/view':       { section: 'التقارير',   page: 'عرض المستندات'          },
  '/contracts/view':       { section: 'التقارير',   page: 'عرض العقود'             },
  '/purchase-orders/view': { section: 'التقارير',   page: 'عرض أوامر التوريد'      },
};

interface HeaderProps { onMenuClick: () => void; }

export default function Header({ onMenuClick }: HeaderProps) {
  const loc = useLocation();
  const crumb = breadcrumbs[loc.pathname] ?? { section: 'الرئيسية', page: '' };

  return (
    <header className="flex items-center h-14 sm:h-16 px-4 sm:px-6 bg-white flex-shrink-0 gap-3"
      style={{ borderBottom: '1px solid #e2e8f0' }}>
      {/* Hamburger — mobile only */}
      <button onClick={onMenuClick}
        className="lg:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-border text-muted hover:bg-surface hover:text-[#1a2744] transition-colors cursor-pointer bg-transparent">
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted font-cairo flex-1 min-w-0">
        <span className="hidden xs:inline truncate">{crumb.section}</span>
        {crumb.page && (
          <>
            <svg className="w-3 h-3 hidden xs:block rotate-180 flex-shrink-0" viewBox="0 0 8 12" fill="none">
              <path d="M6 1L2 6l4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-bold text-navy-mid truncate">{crumb.page}</span>
          </>
        )}
        {!crumb.page && <span className="font-bold text-navy-mid xs:hidden">{crumb.section}</span>}
      </div>

      {/* Right: bell + user */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-muted hover:bg-surface transition-colors relative cursor-pointer border border-border bg-white">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5A4.5 4.5 0 0 0 3.5 6v2.5L2 10.5h12L12.5 8.5V6A4.5 4.5 0 0 0 8 1.5z" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M6.5 13a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-gold" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <div className="text-left leading-tight">
            <div className="text-[13px] font-bold text-[#1a2744]">Hello: { JSON.parse(localStorage.getItem('user') || '""') || 'User' }</div>
          </div>
        </div>

        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#00428d,#001f45)' }}>أ</div>

        <button 
        className="hidden sm:block h-8 px-3 rounded-lg border border-border bg-transparent text-xs font-cairo text-muted hover:bg-surface hover:text-[#1a2744] transition-colors cursor-pointer"
        onClick={() => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }}>
          خروج
        </button>
      </div>
    </header>
  );
}