import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import ChatFloatingWidget from '../features/seller/components/ChatFloatingWidget';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-light">
      <Header />

      {/* Nội dung trang */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Floating Chat Tool */}
      <ChatFloatingWidget />

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-brand-border bg-brand-light text-center text-xs text-brand-muted">
        <p>© 2026 Supabaze Store. Powered by OpenTelemetry, NestJS, and EF Core 8.</p>
      </footer>
    </div>
  );
}
