import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import { ChatBubbleButton } from "@/shared/components";

export default function MainLayout() {
  const location = useLocation();
  const isChatRoute = location.pathname.startsWith('/chat');

  return (
    <div className={`flex flex-col bg-brand-light ${isChatRoute ? "h-screen overflow-hidden" : "min-h-screen"}`}>
      <Header />

      {/* Nội dung trang */}
      <main className={`flex-1 ${isChatRoute ? "min-h-0 overflow-hidden flex flex-col" : ""}`}>
        <Outlet />
      </main>

      {/* Floating Chat Bubble + Mini Modal: ẩn khi đang ở trang /chat */}
      {!isChatRoute && <ChatBubbleButton />}
    </div>
  );
}

