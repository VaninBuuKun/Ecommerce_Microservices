import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, ShoppingBag, Star, Loader2, ArrowLeft, ChevronRight } from "lucide-react";
import api from "@/core/api/axiosInstance";
import { toast } from "react-toastify";

interface ShopDetail {
  id: number;
  ownerUserId: number;
  name: string;
  description: string;
  logoUrl: string | null;
  status: string;
  pickUpAddressProvince: string | null;
  pickUpAddressDistrict: string | null;
  pickUpAddressWard: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice: number;
  thumbnailUrl: string | null;
  averageRating: number;
  reviewCount: number;
  shopId: number;
}

export default function ShopProfilePublicPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  
  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loadingShop, setLoadingShop] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    const fetchShopInfo = async () => {
      setLoadingShop(true);
      try {
        const res = await api.get(`/shop/${shopId}/public`);
        setShop(res.data);
      } catch (err: any) {
        console.error(err);
        toast.error("Không thể tải thông tin cửa hàng công khai.");
      } finally {
        setLoadingShop(false);
      }
    };

    if (shopId) {
      fetchShopInfo();
      fetchProducts(null);
    }
  }, [shopId]);

  const fetchProducts = async (cursor: string | null = null, append = false) => {
    setLoadingProducts(true);
    try {
      const res = await api.get("/products", {
        params: {
          shopId,
          limit: 8,
          cursor
        }
      });
      const data = res.data;
      if (append) {
        setProducts(prev => [...prev, ...data.items]);
      } else {
        setProducts(data.items);
      }
      setNextCursor(data.nextCursor);
      setHasNext(data.hasNext);
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể tải danh sách sản phẩm.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleLoadMore = () => {
    if (hasNext && nextCursor) {
      fetchProducts(nextCursor, true);
    }
  };

  if (loadingShop) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh] gap-3 text-xs font-bold text-brand-muted">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
        Đang tải thông tin cửa hàng...
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4 font-sans text-xs">
        <p className="text-sm font-bold text-brand-muted">Không tìm thấy thông tin cửa hàng này.</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-brand-dark text-white rounded-xl font-black"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 text-left font-sans text-xs">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-brand-muted hover:text-brand-dark font-black tracking-wide uppercase transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại
      </button>

      <div className="bg-white border border-brand-border rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-sm">
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 border border-brand-border shrink-0 flex items-center justify-center text-3xl font-black text-brand-muted uppercase">
          {shop.logoUrl ? (
            <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
          ) : (
            shop.name.charAt(0)
          )}
        </div>

        <div className="flex-1 space-y-3 text-center md:text-left">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-brand-dark flex items-center justify-center md:justify-start gap-2">
              {shop.name}
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-wider">Đối tác</span>
            </h1>
            <p className="text-brand-muted font-medium text-[11px] leading-relaxed max-w-2xl">
              {shop.description || "Cửa hàng hiện chưa có mô tả thông tin chi tiết."}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center md:justify-start text-brand-muted text-[11px] font-semibold pt-1">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-primary" />
              <span>
                {shop.pickUpAddressWard 
                  ? `${shop.pickUpAddressWard}, ${shop.pickUpAddressDistrict}, ${shop.pickUpAddressProvince}`
                  : "Chưa cập nhật địa chỉ"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-border" />
              <span>Chủ sở hữu: </span>
              <button 
                onClick={() => navigate(`/users/${shop.ownerUserId}`)}
                className="text-brand-primary hover:underline font-extrabold"
              >
                Hồ sơ User #{shop.ownerUserId}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-sm font-black text-brand-dark uppercase tracking-wider border-b border-brand-border pb-2 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-brand-primary" />
          Sản phẩm của cửa hàng
        </h2>

        {products.length === 0 && !loadingProducts ? (
          <div className="p-12 border border-dashed border-brand-border rounded-2xl bg-slate-50/50 text-center">
            <p className="text-brand-muted font-bold">Cửa hàng này hiện chưa đăng bán sản phẩm nào.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map((prod) => (
                <div 
                  key={prod.id}
                  onClick={() => navigate(`/products/${prod.id}`)}
                  className="bg-white border border-brand-border rounded-2xl overflow-hidden hover:border-brand-dark/25 hover:shadow-xs transition-all cursor-pointer flex flex-col group"
                >
                  <div className="aspect-square bg-slate-50 overflow-hidden relative border-b border-brand-border">
                    {prod.thumbnailUrl ? (
                      <img 
                        src={prod.thumbnailUrl} 
                        alt={prod.name} 
                        className="w-full h-full object-cover group-hover:scale-103 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-brand-muted">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2 text-left">
                    <h3 className="font-extrabold text-[11px] text-brand-dark line-clamp-2 leading-relaxed group-hover:text-brand-primary transition-colors">
                      {prod.name}
                    </h3>
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-black text-xs text-brand-dark font-mono">
                          {(prod.discountPrice > 0 ? prod.discountPrice : prod.price).toLocaleString("vi-VN")}đ
                        </span>
                        {prod.discountPrice > 0 && (
                          <span className="text-[10px] text-brand-muted line-through font-medium font-mono">
                            {prod.price.toLocaleString("vi-VN")}đ
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 text-[10px] text-brand-muted font-bold font-mono">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{prod.averageRating.toFixed(1)}</span>
                        <span>({prod.reviewCount})</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasNext && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingProducts}
                  className="px-6 py-2.5 bg-brand-dark text-white rounded-xl hover:bg-black font-black text-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {loadingProducts && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Xem thêm sản phẩm
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
