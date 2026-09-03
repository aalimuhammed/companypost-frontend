// New dashboard page

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {  Spinner } from '../components/UI';
import { API_BASE_URL } from '../config/constants';
import type { PostsStatistics } from '../config/PostsStatistics';


function StatCard({ label, value, variant, details = [] }: {
  label: string;
  value: number;
  variant: 'blue' | 'gold' | 'green' | 'red' | 'purple' | 'teal';
  details?: { label: string; value: number }[];
}) {
  const topColors: Record<string, string> = {
    blue: 'bg-navy-mid',
    gold: 'bg-gold',
    green: 'bg-success',
    red: 'bg-danger',
    purple: 'bg-purple-500',
    teal: 'bg-teal-500',
  };
  const valColors: Record<string, string> = {
    blue: 'text-navy-mid',
    gold: 'text-amber-700',
    green: 'text-success',
    red: 'text-danger',
    purple: 'text-purple-600',
    teal: 'text-teal-600',
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
      <div className={`absolute top-0 right-0 left-0 h-0.5 ${topColors[variant]}`} />
      <div className="text-xs font-bold text-muted mb-2">{label}</div>
      <div className={`text-4xl font-black leading-none mb-3 font-mono ${valColors[variant]}`}>
        {value.toLocaleString('ar')}
      </div>
      {details.length > 0 && (
        <div className="border-t border-border pt-2.5 flex flex-col gap-1.5">
          {details.map(d => (
            <div key={d.label} className="flex justify-between items-center text-xs">
              <span className="text-muted">{d.label}</span>
              <span className="font-bold font-mono text-navy-dark">{d.value.toLocaleString('ar')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PostsStatistics | null>(null);
  //const [recent, setRecent] = useState<RecentDoc[]>(MOCK_DOCS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const h = { Authorization: `Bearer ${token}` };
        const [sRes] = await Promise.all([
          fetch(`${API_BASE_URL}/PostsStatistics/get-statistics`, { headers: h }),
         // fetch(`${API_BASE_URL}/Dashboard/recent`, { headers: h }),
        ]);
        if (sRes.ok) setStats(await sRes.json());
       // if (rRes.ok) setRecent(await rRes.json());
      } catch {
        // use mock data silently
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="mb-1 text-xl font-bold text-navy-dark">لوحة التحكم</div>
      <div className="mb-6 text-sm text-muted">نظرة عامة على حركة المستندات والعقود</div>

      {loading && (
        <div className="flex justify-center py-8"><Spinner size="lg" /></div>
      )}

      {/* Row 1 — 4 simple cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard
          label="صادر داخلي"
          value={stats?.postInternal ?? 0}
          variant="blue"
        />
        <StatCard
          label="صادر خارجي"
          value={stats?.postExternal ?? 0}
          variant="gold"
        />
        <StatCard
          label="صادر محول"
          value={stats?.postTransformer ?? 0}
          variant="purple"
        />
        <StatCard
          label="وارد"
          value={stats?.inComing ?? 0}
          variant="teal"
        />
      </div>

      {/* Row 2 — 2 detailed cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatCard
          label="العقود"
          value={stats?.contract ?? 0}
          variant="green"
          details={[
            { label: 'الإجمالي بالجنيه المصري', value: stats?.contractSumEgp ?? 0 },
            { label: 'الإجمالي بالدولار الأمريكي', value: stats?.contractSumUsd ?? 0 },
            { label: 'الإجمالي بالريال السعودي', value: stats?.contractSumSar ?? 0 },
            { label: 'الإجمالي باليورو', value: stats?.contractSumEur ?? 0 },
          ]}
        />
        {/* <StatCard
          label="أوامر التوريد"
          value={stats?.purchaseOrder ?? 0}
          variant="red"
          details={[
            { label: 'الإجمالي بالجنيه المصري', value: stats?.purchaseOrderEgp ?? 0 },
            { label: 'الإجمالي بالدولار الأمريكي', value: stats?.purchaseOrderUsd ?? 0 },
            { label: 'الإجمالي بالريال السعودي', value: stats?.purchaseOrderSar ?? 0 },
            { label: 'الإجمالي باليورو', value: stats?.purchaseOrderEur ?? 0 },
          ]}
        /> */}
      </div>

      {/* Recent documents table */}
      {/* <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-navy-dark">آخر المستندات الواردة</span>
            <Badge variant="blue">{recent.length} مستند</Badge>
          </div>
          <button
            onClick={() => navigate('/documents/view')}
            className="h-8 px-3 rounded-lg border border-border bg-transparent text-muted font-cairo text-xs cursor-pointer transition-colors hover:text-navy-dark hover:bg-surface"
          >
            عرض الكل
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="py-2.5 px-4 bg-surface text-muted font-bold text-xs border-b border-border text-right">الرقم التسلسلي</th>
                <th className="py-2.5 px-4 bg-surface text-muted font-bold text-xs border-b border-border text-right">رقم المستند</th>
                <th className="py-2.5 px-4 bg-surface text-muted font-bold text-xs border-b border-border text-right">الموضوع</th>
                <th className="py-2.5 px-4 bg-surface text-muted font-bold text-xs border-b border-border text-right">الشركة</th>
                <th className="py-2.5 px-4 bg-surface text-muted font-bold text-xs border-b border-border text-right">تاريخ التسليم</th>
                <th className="py-2.5 px-4 bg-surface text-muted font-bold text-xs border-b border-border text-right">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((doc) => {
                const sb = statusBadge(doc.statusMethod);
                return (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 border-b border-border font-mono font-bold text-navy-mid text-xs">
                      {doc.serialNumber}
                    </td>
                    <td className="py-2.5 px-4 border-b border-border text-navy-dark">{doc.documentNumber}</td>
                    <td className="py-2.5 px-4 border-b border-border text-navy-dark max-w-xs truncate">{doc.subject}</td>
                    <td className="py-2.5 px-4 border-b border-border text-muted">{doc.companyName}</td>
                    <td className="py-2.5 px-4 border-b border-border font-mono text-muted">{doc.deliveryDate}</td>
                    <td className="py-2.5 px-4 border-b border-border">
                      <Badge variant={sb.variant}>{sb.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div> */}

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '+ وارد جديد', path: '/incoming', color: 'bg-navy-mid text-white hover:bg-navy-dark' },
          { label: '+ صادر خارجي', path: '/outgoing/external', color: 'bg-gold text-navy-dark hover:bg-yellow-400' },
          { label: '+ عقد جديد', path: '/contracts', color: 'bg-green-600 text-white hover:bg-green-700' },
        //  { label: '+ أمر توريد', path: '/purchase-orders', color: 'bg-slate-700 text-white hover:bg-slate-800' },
        ].map(a => (
          <button
            key={a.path}
            onClick={() => navigate(a.path)}
            className={`h-11 rounded-xl font-bold text-sm font-cairo cursor-pointer transition-colors ${a.color}`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}