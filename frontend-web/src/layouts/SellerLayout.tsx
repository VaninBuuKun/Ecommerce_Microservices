import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSellerStore } from "../shared/store/sellerStore";
import { useAuthStore } from "../features/auth";
import Breadcrumb, { type BreadcrumbItem } from "../components/Breadcrumb";
import {
  Bell, ChevronDown, ChevronRight, Store, LayoutDashboard,
  ShoppingBag, Percent, Users, Wallet, BarChart3, Settings,
  Package, Database, CheckSquare, RefreshCw, Star, HelpCircle,
  TrendingUp, Landmark, Plus, Home
} from "lucide-react";

export default function SellerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { shops, activeShop, setActiveShop } = useSellerStore();

  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    product: true,
    order: true,
    discount: false,
    customer: false,
    wallet: false,
    report: false,
    settings: false,
  });

  // Chặn nếu người dùng chưa chọn shop, đưa về trang chọn shop
  useEffect(() => {
    if (!activeShop) {
      if (shops.length > 0) {
        setActiveShop(shops[0]);
      } else {
        navigate("/seller");
      }
    }
  }, [activeShop, shops, navigate, setActiveShop]);

  const toggleExpand = (menuKey: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const handleSwitchShop = (shop: any) => {
    setActiveShop(shop);
    setShowShopDropdown(false);
  };

  // Mock Notifications
  const mockNotifications = [
    { id: 1, title: 'Đơn hàng mới', content: 'Shop của bạn nhận được đơn hàng mới #129384', time: '10 phút trước', read: false },
    { id: 2, title: 'Khuyến mãi cực hot', content: 'Ví Shopee đang có chương trình hoàn xu đến 50%', time: '2 giờ trước', read: false },
    { id: 3, title: 'Cập nhật tài khoản', content: 'Thông tin tài khoản định danh của bạn đã được duyệt thành công', time: '1 ngày trước', read: true }
  ];

  // Dynamic Breadcrumb generation based on active pathname
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const paths = location.pathname.split("/").filter(Boolean);
    const items: BreadcrumbItem[] = [{ label: "Người bán", path: "/seller/dashboard" }];

    if (paths.includes("dashboard")) {
      items.push({ label: "Tổng quan" });
    } else if (paths.includes("products")) {
      items.push({ label: "Quản lý sản phẩm" });
      if (paths.includes("list")) items.push({ label: "Danh sách sản phẩm" });
      else if (paths.includes("category")) items.push({ label: "Danh mục sản phẩm" });
    } else if (paths.includes("orders")) {
      items.push({ label: "Quản lý đơn hàng" });
    } else {
      items.push({ label: "Tổng quan" });
    }

    return items;
  };

  if (!activeShop) return null;

  return (
    <div className="min-h-screen bg-brand-light-soft flex flex-col font-sans">

      {/* HEADER NGƯỜI BÁN (Seller Header) */}
      <header className="sticky top-0 z-50 w-full h-14 bg-white border-b border-brand-border px-6 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">

        {/* Khối bên trái: Chỉ giữ lại logo icon, bỏ chữ BUUSTORE, thêm Breadcrumb bên phải logo */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center h-8 shrink-0">
            <img
              src="/ecommerce-icon.png"
              alt="Logo"
              className="w-7 h-7 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/3081/3081986.png';
              }}
            />
          </Link>
          <div className="h-4 w-px bg-brand-border" />
          <Breadcrumb items={getBreadcrumbItems()} />
        </div>

        {/* Khối bên phải: Quả chuông thông báo bên trái, Shop Switcher nằm bên phải cùng */}
        <div className="flex items-center gap-3">
          {/* Quả chuông thông báo */}
          <div
            className="relative flex items-center"
            onMouseEnter={() => setShowNotificationDropdown(true)}
            onMouseLeave={() => setShowNotificationDropdown(false)}
          >
            <button
              className="relative w-8 h-8 text-brand-dark hover:bg-brand-primary/10 rounded transition-colors flex items-center justify-center cursor-pointer"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-0 right-0 bg-red-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {showNotificationDropdown && (
              <div className="absolute right-0 top-full pt-1.5 w-80 z-50">
                <div className="bg-white border border-brand-border rounded shadow-xl p-3 text-left">
                  <span className="block text-xs font-bold text-brand-dark border-b border-brand-border pb-2 mb-2">Thông báo mới nhận</span>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {mockNotifications.map((notif) => (
                      <div key={notif.id} className={`p-2 rounded text-xs transition-colors ${notif.read ? 'bg-transparent' : 'bg-brand-light-soft border-l-2 border-brand-primary'}`}>
                        <div className="flex justify-between items-start mb-0.5">
                          <h4 className="font-bold text-brand-dark">{notif.title}</h4>
                          <span className="text-[9px] text-brand-muted shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-brand-muted text-[11px] leading-snug">{notif.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-brand-border" />

          {/* Shop Switcher Dropdown nằm bên phải cùng */}
          <div
            className="relative"
            onMouseEnter={() => setShowShopDropdown(true)}
            onMouseLeave={() => setShowShopDropdown(false)}
          >
            <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-brand-light-soft transition-colors cursor-pointer text-left">
              <img
                src={activeShop.avatarUrl}
                alt={activeShop.name}
                className="w-6 h-6 rounded-full object-cover border border-brand-border"
              />
              <span className="text-xs font-bold text-brand-dark max-w-[120px] truncate">{activeShop.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-brand-muted shrink-0" />
            </button>

            {showShopDropdown && (
              <div className="absolute right-0 top-full pt-1.5 w-60 z-50">
                <div className="bg-white border border-brand-border rounded-xl shadow-xl p-2 text-left">
                  <div className="text-[10px] font-bold text-brand-muted uppercase tracking-wider px-2.5 py-1 mb-1 border-b border-brand-border pb-1.5">
                    Cửa hàng của tôi
                  </div>

                  <div className="space-y-0.5 max-h-48 overflow-y-auto mb-1">
                    {shops.map((shop) => (
                      <button
                        key={shop.id}
                        onClick={() => handleSwitchShop(shop)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs text-left cursor-pointer transition-colors ${activeShop.id === shop.id ? "bg-brand-primary/10 text-brand-primary-deep font-bold" : "hover:bg-brand-light-soft text-brand-dark"}`}
                      >
                        <img
                          src={shop.avatarUrl}
                          alt={shop.name}
                          className="w-5 h-5 rounded-full object-cover border border-brand-border"
                        />
                        <span className="truncate flex-1">{shop.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-brand-border pt-1.5">
                    <button
                      onClick={() => {
                        setShowShopDropdown(false);
                        navigate("/seller/register");
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-bold text-brand-primary-deep hover:bg-brand-primary/10 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tạo shop mới
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CONTAINER BODY CHỨA SIDEBAR & CONTENT */}
      <div className="flex-1 flex overflow-hidden">

        {/* SIDEBAR NGƯỜI BÁN (Cấu trúc 2 level cây như hình) */}
        <aside className="w-64 bg-white border-r border-brand-border flex flex-col shrink-0 overflow-y-auto p-4 select-none">
          <nav className="space-y-1.5">

            {/* Quản lý sản phẩm */}
            <div>
              <button
                onClick={() => toggleExpand("product")}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-bold text-brand-dark hover:bg-brand-light-soft cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-brand-muted" />
                  <span>Quản lý sản phẩm</span>
                </div>
                {expandedMenus.product ? <ChevronDown className="w-3.5 h-3.5 text-brand-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-brand-muted" />}
              </button>
              {expandedMenus.product && (
                <div className="pl-9 mt-1 space-y-1 border-l border-brand-border ml-5">
                  <Link to="/seller/dashboard/products/list" className="block py-1 px-2 rounded text-[11px] text-brand-muted hover:text-brand-primary-deep hover:bg-brand-primary/5 transition-colors font-medium">Sản phẩm</Link>
                  <Link to="/seller/dashboard/products/category" className="block py-1 px-2 rounded text-[11px] text-brand-muted hover:text-brand-primary-deep hover:bg-brand-primary/5 transition-colors font-medium">Danh mục</Link>
                  <Link to="/seller/dashboard/products/bulk" className="block py-1 px-2 rounded text-[11px] text-brand-muted hover:text-brand-primary-deep hover:bg-brand-primary/5 transition-colors font-medium">Hàng loạt (Import/Export)</Link>
                </div>
              )}
            </div>

            {/* Quản lý Đơn hàng */}
            <div>
              <button
                onClick={() => toggleExpand("order")}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-bold text-brand-dark hover:bg-brand-light-soft cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-brand-muted" />
                  <span>Quản lý Đơn hàng</span>
                </div>
                {expandedMenus.order ? <ChevronDown className="w-3.5 h-3.5 text-brand-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-brand-muted" />}
              </button>
              {expandedMenus.order && (
                <div className="pl-9 mt-1 space-y-1 border-l border-brand-border ml-5">
                  <Link to="/seller/dashboard/orders" className="block py-1 px-2 rounded text-[11px] text-brand-muted hover:text-brand-primary-deep hover:bg-brand-primary/5 transition-colors font-medium">Đơn hàng</Link>
                  <Link to="/seller/dashboard/refunds" className="block py-1 px-2 rounded text-[11px] text-brand-muted hover:text-brand-primary-deep hover:bg-brand-primary/5 transition-colors font-medium">Các yêu cầu hoàn tiền</Link>
                </div>
              )}
            </div>

            {/* Khuyến mãi */}
            <div>
              <button
                onClick={() => toggleExpand("discount")}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-bold text-brand-dark hover:bg-brand-light-soft cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Percent className="w-4 h-4 text-brand-muted" />
                  <span>Khuyến mãi</span>
                </div>
                {expandedMenus.discount ? <ChevronDown className="w-3.5 h-3.5 text-brand-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-brand-muted" />}
              </button>
              {expandedMenus.discount && (
                <div className="pl-9 mt-1 space-y-1 border-l border-brand-border ml-5">
                  <Link to="/seller/dashboard/coupons" className="block py-1 px-2 rounded text-[11px] text-brand-muted hover:text-brand-primary-deep hover:bg-brand-primary/5 transition-colors font-medium">Mã giảm giá</Link>
                  <Link to="/seller/dashboard/flashsale" className="block py-1 px-2 rounded text-[11px] text-brand-muted hover:text-brand-primary-deep hover:bg-brand-primary/5 transition-colors font-medium">Flash Sale</Link>
                </div>
              )}
            </div>

            {/* Khách hàng */}
            <div>
              <button
                onClick={() => toggleExpand("customer")}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-bold text-brand-dark hover:bg-brand-light-soft cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-brand-muted" />
                  <span>Khách hàng</span>
                </div>
                {expandedMenus.customer ? <ChevronDown className="w-3.5 h-3.5 text-brand-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-brand-muted" />}
              </button>
              {expandedMenus.customer && (
                <div className="pl-9 mt-1 space-y-1 border-l border-brand-border ml-5">
                  <Link to="/seller/dashboard/reviews" className="block py-1 px-2 rounded text-[11px] text-brand-muted hover:text-brand-primary-deep hover:bg-brand-primary/5 transition-colors font-medium">Đánh giá sản phẩm</Link>
                  <Link to="/seller/dashboard/qa" className="block py-1 px-2 rounded text-[11px] text-brand-muted hover:text-brand-primary-deep hover:bg-brand-primary/5 transition-colors font-medium">Hỏi đáp sản phẩm</Link>
                  <Link to="/seller/dashboard/followers" className="block py-1 px-2 rounded text-[11px] text-brand-muted hover:text-brand-primary-deep hover:bg-brand-primary/5 transition-colors font-medium">Người theo dõi</Link>
                </div>
              )}
            </div>

            {/* Ví Người Bán */}
            <div>
              <button
                onClick={() => toggleExpand("wallet")}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-bold text-brand-dark hover:bg-brand-light-soft cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-brand-muted" />
                  <span>Ví Người Bán</span>
                </div>
                {expandedMenus.wallet ? <ChevronDown className="w-3.5 h-3.5 text-brand-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-brand-muted" />}
              </button>
              {expandedMenus.wallet && (
                <div className="pl-9 mt-1 space-y-1 border-l border-brand-border ml-5">
                  <Link to="/seller/dashboard/balance" className="block py-1 px-2 rounded text-[11px] text-brand-muted hover:text-brand-primary-deep hover:bg-brand-primary/5 transition-colors font-medium">Số dư</Link>
                  <Link to="/seller/dashboard/transactions" className="block py-1 px-2 rounded text-[11px] text-brand-muted hover:text-brand-primary-deep hover:bg-brand-primary/5 transition-colors font-medium">Lịch sử giao dịch</Link>
                  <Link to="/seller/dashboard/withdrawals" className="block py-1 px-2 rounded text-[11px] text-brand-muted hover:text-brand-primary-deep hover:bg-brand-primary/5 transition-colors font-medium">Yêu cầu rút tiền</Link>
                </div>
              )}
            </div>

            {/* Báo cáo */}
            <div>
              <button
                onClick={() => toggleExpand("report")}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-bold text-brand-dark hover:bg-brand-light-soft cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-brand-muted" />
                  <span>Báo cáo</span>
                </div>
                {expandedMenus.report ? <ChevronDown className="w-3.5 h-3.5 text-brand-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-brand-muted" />}
              </button>
              {expandedMenus.report && (
                <div className="pl-9 mt-1 space-y-1 border-l border-brand-border ml-5">
                  <Link to="/seller/dashboard/revenue" className="block py-1 px-2 rounded text-[11px] text-brand-muted hover:text-brand-primary-deep hover:bg-brand-primary/5 transition-colors font-medium">Doanh thu</Link>
                  <Link to="/seller/dashboard/top-products" className="block py-1 px-2 rounded text-[11px] text-brand-muted hover:text-brand-primary-deep hover:bg-brand-primary/5 transition-colors font-medium">Sản phẩm bán chạy</Link>
                  <Link to="/seller/dashboard/sales-perf" className="block py-1 px-2 rounded text-[11px] text-brand-muted hover:text-brand-primary-deep hover:bg-brand-primary/5 transition-colors font-medium">Hiệu suất bán hàng</Link>
                  <Link to="/seller/dashboard/customer-stats" className="block py-1 px-2 rounded text-[11px] text-brand-muted hover:text-brand-primary-deep hover:bg-brand-primary/5 transition-colors font-medium">Thống kê khách hàng</Link>
                </div>
              )}
            </div>

            {/* Cài đặt Shop */}
            <div>
              <button
                onClick={() => toggleExpand("settings")}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-bold text-brand-dark hover:bg-brand-light-soft cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-brand-muted" />
                  <span>Cài đặt Shop</span>
                </div>
                {expandedMenus.settings ? <ChevronDown className="w-3.5 h-3.5 text-brand-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-brand-muted" />}
              </button>
              {expandedMenus.settings && (
                <div className="pl-9 mt-1 space-y-1 border-l border-brand-border ml-5">
                  <Link to="/seller/dashboard/settings" className="block py-1 px-2 rounded text-[11px] text-brand-muted hover:text-brand-primary-deep hover:bg-brand-primary/5 transition-colors font-medium">Thông tin shop</Link>
                </div>
              )}
            </div>

          </nav>
        </aside>

        {/* NỘI DUNG CHÍNH (Content area) */}
        <main className="flex-1 overflow-y-auto p-6 flex flex-col">
          <div className="flex-1 bg-white border border-brand-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
}
