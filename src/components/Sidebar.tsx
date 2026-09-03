import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavLeaf { label: string; path: string; }
interface NavGroup { label: string; icon: React.FC<{ className?: string }>; children: NavLeaf[]; }
interface NavLink  { label: string; icon: React.FC<{ className?: string }>; path: string; }
type NavEntry = NavLink | NavGroup;
const isGroup = (e: NavEntry): e is NavGroup => 'children' in e;

// ── Icons ─────────────────────────────────────────────────────────────────────
const IcoDash: React.FC<{className?:string}> = ({className=''}) => (
  <svg className={className} viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/>
    <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5"/>
    <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5"/>
    <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7"/>
  </svg>
);
const IcoDoc: React.FC<{className?:string}> = ({className=''}) => (
  <svg className={className} viewBox="0 0 16 16" fill="none">
    <path d="M3 2h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);
const IcoTable: React.FC<{className?:string}> = ({className=''}) => (
  <svg className={className} viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M1 5h14M5 5v9" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);
const IcoContract: React.FC<{className?:string}> = ({className=''}) => (
  <svg className={className} viewBox="0 0 16 16" fill="none">
    <path d="M9 1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5L9 1z" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M9 1v4h4M5 9l1.5 1.5L9 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
// const IcoPO: React.FC<{className?:string}> = ({className=''}) => (
//   <svg className={className} viewBox="0 0 16 16" fill="none">
//     <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
//     <path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
//   </svg>
// );
const IcoChevron: React.FC<{open:boolean}> = ({open}) => (
  <svg className={`w-3 h-3 flex-shrink-0 mr-auto transition-transform duration-200 ${open?'rotate-90':''}`}
    viewBox="0 0 12 12" fill="none">
    <path d="M4 3l4 3-4 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const sections: { title: string; entries: NavEntry[] }[] = [
  {
    title: 'القوائم الرئيسية',
    entries: [
      { label: 'الرئيسية',        icon: IcoDash,     path: '/'                 },
      { label: 'المستندات الصادرة', icon: IcoDoc,
        children: [
          { label: 'صادر خارجي', path: '/outgoing/external' },
          { label: 'صادر داخلي', path: '/outgoing/internal' },
          { label: 'صادر محول', path: '/outgoing/transform' }
        ],
      },
      { label: 'وارد',             icon: IcoDoc,      path: '/incoming'         },
      { label: 'العقود',            icon: IcoContract, path: '/contracts'        },
     // { label: 'أوامر التوريد',     icon: IcoPO,       path: '/purchase-orders'  },
    ],
  },
  {
    title: 'التقارير والبحث',
    entries: [
      { label: 'عرض المستندات',      icon: IcoTable, path: '/documents/view'        },
      { label: 'عرض العقود',          icon: IcoTable, path: '/contracts/view'        },
      //{ label: 'عرض أوامر التوريد',   icon: IcoTable, path: '/purchase-orders/view'  },
    ],
  },
];

interface SidebarProps { onClose?: () => void; }

export default function Sidebar({ onClose }: SidebarProps) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

const isActive = (path: string) => {
  if (path === '/') return location.pathname === '/';

  if (path === '/contracts') {
    return (
      location.pathname === '/contracts' ||
      location.pathname.startsWith('/contracts/') &&
      !location.pathname.startsWith('/contracts/view')
    );
  }

  return location.pathname === path;
};

  const go = (path: string) => { navigate(path); onClose?.(); };

  return (
    <aside className="flex flex-col h-full" style={{ background: '#001f45', minWidth: 0 }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 sm:px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {onClose && (
          <button onClick={onClose} className="lg:hidden w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-md text-white/50 hover:text-white hover:bg-white/10 cursor-pointer border-none bg-transparent mr-auto">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#e8d08a,#c9a84c)', color: '#001f45' }}>S</div>
        <div className="min-w-0">
          <div className="font-bold text-sm text-white leading-tight truncate">SIAC Holding</div>
          <div className="text-[10px] mt-0.5 font-normal" style={{ color: 'rgba(255,255,255,0.35)' }}>نظام إدارة المستندات</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {sections.map(sec => (
          <div key={sec.title}>
            <div className="px-4 sm:px-5 pt-5 pb-1.5 text-[9px] font-bold uppercase tracking-[2px]"
              style={{ color: 'rgba(255,255,255,0.25)' }}>{sec.title}</div>

            {sec.entries.map(entry => {
              if (isGroup(entry)) {
                const open = openGroups[entry.label] ?? false;
                const anyActive = entry.children.some(c => location.pathname.startsWith(c.path));
                return (
                  <div key={entry.label}>
                    <button onClick={() => setOpenGroups(p => ({ ...p, [entry.label]: !p[entry.label] }))}
                      className={`nav-item ${anyActive && !open ? 'active' : ''}`}>
                      <entry.icon className="w-4 h-4 flex-shrink-0 opacity-70" />
                      <span className="flex-1 text-right">{entry.label}</span>
                      <IcoChevron open={open} />
                    </button>
                    {open && (
                      <div className="border-r border-white/10 mr-[18px] mb-1 anim-fade-in">
                        {entry.children.map(child => (
                          <button key={child.path} onClick={() => go(child.path)}
                            className={`flex w-full items-center gap-2 px-4 py-2 text-xs font-cairo border-none bg-transparent cursor-pointer transition-colors ${location.pathname === child.path ? 'text-amber-300 font-bold' : 'text-white/45 hover:text-white/75'}`}>
                            <span className="w-1 h-1 rounded-full flex-shrink-0"
                              style={{ background: location.pathname === child.path ? '#c9a84c' : 'rgba(255,255,255,0.2)' }} />
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <button key={entry.path} onClick={() => go(entry.path)}
                  className={`nav-item ${isActive(entry.path) ? 'active' : ''}`}>
                  <entry.icon className="w-4 h-4 flex-shrink-0 opacity-70" />
                  <span className="flex-1 text-right">{entry.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 sm:px-5 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>v2.1.0 · SIAC IT Team</div>
      </div>
    </aside>
  );
}