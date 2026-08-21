import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ShoppingBag, Star, Loader2, ArrowLeft, ChevronRight, Store } from "lucide-react";
import { toast } from "react-toastify";
import { FollowShopButton } from "@/domains/seller";
import { api } from "@/core";

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
          limit: 10,
          cursor
        }
      });
      const data = res.data;
      if (append) {
        setProducts(prev => [...prev, ...(data.items || [])]);
      } else {
        setProducts(data.items || []);
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
          className="px-4 py-2 bg-brand-dark text-white rounded-xl font-black cursor-pointer"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 text-left font-sans text-xs">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-brand-muted hover:text-brand-dark font-black tracking-wide uppercase transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại
      </button>

      {/* CARD 1: THÔNG TIN HEADER CHÍNH CỦA SHOP (LOGO, TÊN, NÚT THEO DÕI, ĐỊA CHỈ) */}
      <div className="bg-white border border-brand-border rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left flex-1">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 border border-brand-border shrink-0 flex items-center justify-center text-3xl font-black text-brand-muted uppercase shadow-xs">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              shop.name.charAt(0)
            )}
          </div>

          <div className="space-y-3 flex-1">
            <div className="space-y-1">
              <h1 className="text-xl font-black text-brand-dark flex items-center justify-center md:justify-start gap-2">
                {shop.name}
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-200 rounded-full text-[9px] font-black uppercase tracking-wider">Đối tác</span>
              </h1>
            </div>

            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-brand-muted text-[11px] font-semibold">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                <span>
                  {shop.pickUpAddressWard
                    ? `${shop.pickUpAddressWard}, ${shop.pickUpAddressDistrict}, ${shop.pickUpAddressProvince}`
                    : "Chưa cập nhật địa chỉ"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-border" />
                <span>Chủ sở hữu: </span>
                <button
                  onClick={() => navigate(`/users/${shop.ownerUserId}`)}
                  className="text-brand-primary hover:underline font-extrabold cursor-pointer border-none bg-transparent"
                >
                  Hồ sơ User #{shop.ownerUserId}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* NÚT THEO DÕI SHOP */}
        <div className="shrink-0">
          <FollowShopButton shopId={shop.id} variant="primary" />
        </div>
      </div>

      {/* CARD 2 (Ở GIỮA): MÔ TẢ CHI TIẾT SHOP */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-xs space-y-2 text-left">
        <h3 className="text-xs font-black text-brand-dark uppercase tracking-wider flex items-center gap-2">
          <Store className="w-4 h-4 text-brand-primary" />
          Giới thiệu cửa hàng
        </h3>
        <p className="text-brand-muted text-xs leading-relaxed font-medium">
          {shop.description || "Cửa hàng hiện chưa cập nhật mô tả chi tiết."}
        </p>
      </div>

      {/* CARD 3: DANH SÁCH SẢN PHẨM (CARD STYLE BẮT CHƯỚC LANDINGPAGE) */}
      <div className="space-y-6 pt-2">
        <h2 className="text-sm font-black text-brand-dark uppercase tracking-wider border-b border-brand-border pb-3 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-brand-primary" />
          Sản phẩm của cửa hàng ({products.length})
        </h2>

        {products.length === 0 && !loadingProducts ? (
          <div className="p-12 border border-dashed border-brand-border rounded-2xl bg-white text-center">
            <p className="text-brand-muted font-bold text-xs">Cửa hàng này hiện chưa đăng bán sản phẩm nào.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {products.map((prod) => (
                <motion.div
                  whileHover={{ y: -4 }}
                  key={prod.id}
                  onClick={() => navigate(`/products/${prod.id}`)}
                  className="group flex flex-col bg-white rounded-lg overflow-hidden border border-brand-border hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all duration-200 relative cursor-pointer"
                >
                  <div className="aspect-square w-full overflow-hidden relative bg-brand-light border-b border-brand-border">
                    <img
                      src={prod.thumbnailUrl || "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=300"}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 bg-brand-primary text-brand-dark text-[8px] font-bold uppercase px-2 py-0.5 rounded-sm tracking-wider">
                      Best seller
                    </span>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col text-left justify-between space-y-2.5">
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-brand-muted font-bold uppercase tracking-wider">
                        {shop.name || "BUU STORE"}
                      </span>
                      <h3 className="font-bold text-brand-dark text-xs group-hover:text-brand-primary transition-colors line-clamp-1">
                        {prod.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-brand-primary stroke-brand-primary" />
                      <span className="text-[11px] font-bold text-brand-dark">
                        {prod.averageRating ? prod.averageRating.toFixed(1) : "5.0"}
                      </span>
                      <span className="text-[9px] text-brand-muted">
                        ({prod.reviewCount || 0})
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-brand-border">
                      <div className="flex flex-col">
                        <span className="font-bold text-brand-dark text-xs">
                          {(prod.discountPrice && prod.discountPrice > 0 ? prod.discountPrice : prod.price).toLocaleString("vi-VN")}đ
                        </span>
                        {prod.discountPrice > 0 && prod.discountPrice < prod.price && (
                          <span className="text-[9px] text-brand-muted line-through font-mono">
                            {prod.price.toLocaleString("vi-VN")}đ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
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
