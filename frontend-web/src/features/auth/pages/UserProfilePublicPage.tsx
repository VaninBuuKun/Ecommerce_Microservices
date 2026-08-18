import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Store, Loader2, ArrowLeft } from "lucide-react";
import api from "../../../shared/lib/axios";
import { toast } from "react-toastify";

interface PublicUser {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
}

interface ShopDto {
  id: number;
  name: string;
  description: string;
  logoUrl: string;
}

export default function UserProfilePublicPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [shops, setShops] = useState<ShopDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // 1. Fetch public profile
        const userRes = await api.get(`/users/${userId}/public`);
        setUser(userRes.data);

        // 2. Fetch public shops owned by this user
        const shopsRes = await api.get(`/shop/owner/${userId}`);
        setShops(shopsRes.data);
      } catch (err: any) {
        console.error(err);
        toast.error("Không thể tải thông tin người dùng công khai.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh] gap-3 text-xs font-bold text-brand-muted">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
        Đang tải thông tin hồ sơ...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <p className="text-sm font-bold text-brand-muted">Không tìm thấy thông tin người dùng này.</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-brand-dark text-white rounded-xl text-xs font-black"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-left font-sans text-xs">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-brand-muted hover:text-brand-dark font-black tracking-wide uppercase transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại
      </button>

      {/* Hero Profile Block */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-white border border-brand-border rounded-3xl shadow-sm">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-brand-primary/10 border-2 border-brand-border shrink-0 flex items-center justify-center font-black text-3xl text-brand-primary uppercase">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
          ) : (
            user.fullName.charAt(0)
          )}
        </div>
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-lg font-black text-brand-dark flex items-center justify-center md:justify-start gap-1.5">
            {user.fullName}
            <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full text-[9px] font-black uppercase tracking-wider">Thành viên</span>
          </h1>
          <p className="text-brand-muted font-medium text-[11px]">ID Người dùng: #{user.id}</p>
        </div>
      </div>

      {/* Managed Shops List */}
      <div className="space-y-4">
        <h2 className="text-sm font-black text-brand-dark uppercase tracking-wider border-b border-brand-border pb-2 flex items-center gap-2">
          <Store className="w-4 h-4 text-brand-primary" />
          Cửa hàng đang quản lý ({shops.length})
        </h2>

        {shops.length === 0 ? (
          <div className="p-8 border border-dashed border-brand-border rounded-2xl bg-slate-50/50 text-center">
            <p className="text-brand-muted font-bold">Người dùng này hiện không quản lý cửa hàng nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shops.map((shop) => (
              <div 
                key={shop.id}
                onClick={() => navigate(`/shops/${shop.id}`)}
                className="flex items-center gap-4 p-4 bg-white border border-brand-border rounded-2xl hover:border-brand-dark/30 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-brand-border bg-slate-50 shrink-0 flex items-center justify-center text-lg font-black text-brand-muted uppercase">
                  {shop.logoUrl ? (
                    <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    shop.name.charAt(0)
                  )}
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <h3 className="font-extrabold text-[12px] text-brand-dark group-hover:text-brand-primary transition-colors truncate">{shop.name}</h3>
                  <p className="text-brand-muted font-medium text-[11px] line-clamp-2 leading-relaxed">{shop.description || "Chưa có mô tả chi tiết."}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
