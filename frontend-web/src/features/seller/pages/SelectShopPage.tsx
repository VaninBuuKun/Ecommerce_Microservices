import React from "react";
import { useNavigate } from "react-router-dom";
import { useSellerStore } from "../../../shared/store/sellerStore";
import Header from "../../../components/Header";
import { Store, Plus, ArrowLeft } from "lucide-react";

export default function SelectShopPage() {
  const navigate = useNavigate();
  const { shops, setActiveShop } = useSellerStore();

  const handleSelectShop = (shop: any) => {
    setActiveShop(shop);
    navigate("/seller/dashboard");
  };

  return (
    <div className="min-h-screen bg-brand-light-soft flex flex-col">
      {/* Vẫn còn Header ở đây */}
      <Header />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-brand-border rounded-xl shadow-sm p-6">
          {shops.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <Store className="w-6 h-6 text-amber-500" />
              </div>
              <h2 className="text-base font-bold text-brand-dark mb-2">Chưa có cửa hàng</h2>
              <p className="text-xs text-brand-muted mb-6 leading-relaxed">
                Hiện tại chưa có shop nào cả, hãy thực hiện thủ tục đăng ký shop để trở thành người bán.
              </p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => navigate("/")}
                  className="px-4 py-2 border border-brand-border rounded text-xs font-semibold text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Quay lại
                </button>
                <button
                  onClick={() => navigate("/seller/register")}
                  className="px-4 py-2 bg-brand-primary text-brand-dark font-black text-xs rounded hover:bg-brand-primary-deep transition-colors cursor-pointer"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-brand-border mb-4">
                <h2 className="text-sm font-bold text-brand-dark">Chọn cửa hàng bán hàng</h2>
                <button
                  onClick={() => navigate("/seller/register")}
                  className="p-1.5 hover:bg-brand-primary/10 rounded text-brand-primary-deep transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tạo shop mới
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {shops.map((shop) => (
                  <button
                    key={shop.id}
                    onClick={() => handleSelectShop(shop)}
                    className="w-full flex items-center gap-3 p-3 border border-brand-border rounded-lg hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-left group cursor-pointer"
                  >
                    <img
                      src={shop.avatarUrl}
                      alt={shop.name}
                      className="w-10 h-10 object-cover rounded-full border border-brand-border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/3081/3081986.png";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-brand-dark truncate group-hover:text-brand-primary-deep transition-colors">
                        {shop.name}
                      </h4>
                      <p className="text-[10px] text-brand-muted truncate">
                        {shop.description || "Chưa có mô tả cửa hàng"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
