import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import { ChatFloatingWidget } from "@/domains/seller";


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
    </div>
  );
}
