import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Dashboard from '../pages/Dashboard';
import IncomingPage from '../pages/IncomingPage';
import { OutgoingExternalPage, OutgoingInternalPage , OutgoingTransformPage} from '../pages/OutgoingPages';
import ContractsPage from '../pages/ContractPage';
import DocumentsViewPage from '../pages/DocumentViewPage';
import ContractsViewPage from '../pages/ContractsViewPage';
import { AuthProvider } from '../context/Authcontext';
import Login from '../components/Login';
import CompanyUsersRegistration from '../components/CompanyUsersRegistration';

// Close drawer on route change
function RouteWatcher({ onRouteChange }: { onRouteChange: () => void }) {
  const loc = useLocation();
  useEffect(() => { onRouteChange(); }, [loc.pathname]);
  return null;
}

function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close on ESC
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, []);

  return (
    <div className="flex h-dvh overflow-hidden" style={{ maxHeight: '100svh' }}>
      {/* ── Desktop sidebar ──────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-64 flex-shrink-0 h-full">
        <Sidebar />
      </div>

      {/* ── Mobile sidebar overlay ───────────────────────────────────── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex" onClick={() => setSidebarOpen(false)}>
          {/* Scrim */}
          <div className="absolute inset-0 bg-black/50 anim-fade-in" />
          {/* Drawer — slides in from right (RTL) */}
          <div className="relative mr-auto w-64 h-full anim-slide-in" onClick={e => e.stopPropagation()}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-surface p-3 sm:p-4 md:p-6">
          <RouteWatcher onRouteChange={() => setSidebarOpen(false)} />
          {children}
        </main>

        <footer className="hidden sm:flex flex-shrink-0 items-center justify-between px-5 sm:px-6 py-2.5 bg-white"
          style={{ borderTop: '1px solid #e2e8f0' }}>
          <span className="text-[11px] text-muted font-cairo">© 2026 SIAC Holding — Software Team</span>
          <div className="flex gap-4">
            <a href="#" className="text-[11px] text-muted hover:text-navy-mid font-cairo transition-colors">سياسة الخصوصية</a>
            <a href="#" className="text-[11px] text-muted hover:text-navy-mid font-cairo transition-colors">شروط الاستخدام</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* Auth pages WITHOUT layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<CompanyUsersRegistration />} />

        {/* Pages WITH layout */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/incoming" element={<IncomingPage />} />
                <Route path="/outgoing/external" element={<OutgoingExternalPage />} />
                <Route path="/outgoing/internal" element={<OutgoingInternalPage />} />
                <Route path="/outgoing/transform" element={<OutgoingTransformPage />} />
                <Route path="/contracts" element={<ContractsPage />} />
                {/* <Route path="/purchase-orders" element={<PurchaseOrderPage />} /> */}
                <Route path="/documents/view" element={<DocumentsViewPage />} />
                <Route path="/contracts/view" element={<ContractsViewPage />} />
                {/* <Route path="/purchase-orders/view" element={<PurchaseOrdersViewPage />} /> */}

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </AuthProvider>
  );
}