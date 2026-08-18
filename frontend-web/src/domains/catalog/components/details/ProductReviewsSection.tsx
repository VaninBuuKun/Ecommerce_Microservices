import { useState, useRef } from "react";
import { Star, MessageSquare, X, Play, Loader2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  useProductReviewsQuery, 
  useProductReviewsSummaryQuery, 
  useAddProductReviewMutation 
} from "@/domains/catalog";
import { toast } from "react-toastify";
import api from "@/core/api/axiosInstance";
import axios from "axios";

interface ProductReviewsSectionProps {
  productId: string;
}

export function ProductReviewsSection({ productId }: ProductReviewsSectionProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [mediaList, setMediaList] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<number | "all">("all");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: reviewsData, isLoading: isReviewsLoading } = useProductReviewsQuery(productId);
  const { data: summary, isLoading: isSummaryLoading } = useProductReviewsSummaryQuery(productId);
  const addReviewMutation = useAddProductReviewMutation();

  const [lightboxMedia, setLightboxMedia] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
          toast.error(`File "${file.name}" không hợp lệ. Chỉ chấp nhận hình ảnh hoặc video!`);
          continue;
        }

        const res = await api.get("medias/upload-url", {
          params: {
            fileName: file.name,
            contentType: file.type
          }
        });

        const { uploadUrl, publicUrl } = res.data;

        await axios.put(uploadUrl, file, {
          headers: {
            "Content-Type": file.type
          }
        });

        setMediaList(prev => [...prev, publicUrl]);
      }
      toast.success("Tải tệp tin lên thành công!");
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể tải tệp tin lên. Vui lòng thử lại!");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaList(mediaList.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Vui lòng nhập bình luận đánh giá");
      return;
    }

    addReviewMutation.mutate(
      {
        rating,
        comment: comment.trim(),
        imageUrls: mediaList
      },
      {
        onSuccess: () => {
          toast.success("Đăng đánh giá thành công!");
          setComment("");
          setMediaList([]);
          setRating(5);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Đăng đánh giá thất bại.");
        }
      }
    );
  };

  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes("video") || url.includes("stream");
  };

  if (isSummaryLoading) {
    return (
      <div className="flex justify-center items-center py-10 gap-2 text-xs font-bold text-brand-muted">
        <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
        Đang tải đánh giá sản phẩm...
      </div>
    );
  }

  const ratingsSummary = summary || {
    averageRating: 0,
    totalReviews: 0,
    oneStarCount: 0,
    twoStarCount: 0,
    threeStarCount: 0,
    fourStarCount: 0,
    fiveStarCount: 0
  };

  const getPercentage = (count: number) => {
    if (ratingsSummary.totalReviews === 0) return 0;
    return Math.round((count / ratingsSummary.totalReviews) * 100);
  };

  const starsBreakdown = [
    { star: 5, count: ratingsSummary.fiveStarCount },
    { star: 4, count: ratingsSummary.fourStarCount },
    { star: 3, count: ratingsSummary.threeStarCount },
    { star: 2, count: ratingsSummary.twoStarCount },
    { star: 1, count: ratingsSummary.oneStarCount }
  ];

  const filteredReviews = reviewsData?.items || [];

  return (
    <div className="space-y-8 py-8 border-t border-brand-border text-xs font-sans text-brand-dark animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-brand-light-soft/20 border border-brand-border rounded-2xl shadow-xs text-center space-y-3">
          <h3 className="font-extrabold text-[11px] text-brand-muted uppercase tracking-wider">Đánh giá trung bình</h3>
          <div className="text-4xl font-black text-brand-dark font-mono flex items-baseline gap-1">
            {ratingsSummary.averageRating.toFixed(1)}
            <span className="text-sm font-bold text-brand-muted">/5</span>
          </div>
          <div className="flex gap-1.5 justify-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star 
                key={s} 
                className={`w-4 h-4 ${s <= Math.round(ratingsSummary.averageRating) ? "text-amber-400 fill-amber-400" : "text-brand-border"}`} 
              />
            ))}
          </div>
          <p className="text-[10px] text-brand-muted font-extrabold">({ratingsSummary.totalReviews.toLocaleString("vi-VN")} lượt đánh giá)</p>
        </div>

        <div className="md:col-span-8 space-y-2.5">
          <h3 className="font-black text-brand-dark text-xs uppercase tracking-wide pb-1 border-b border-brand-border">Biểu đồ phân tích rating</h3>
          <div className="space-y-2">
            {starsBreakdown.map(({ star, count }) => {
              const pct = getPercentage(count);
              return (
                <div key={star} className="flex items-center gap-3 text-[11px] font-bold text-brand-muted">
                  <span className="w-10 text-right flex items-center justify-end gap-1 font-mono">
                    {star} <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </span>
                  <div className="flex-1 h-2.5 bg-brand-light-soft/50 rounded-full overflow-hidden border border-brand-border/40">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-300 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 text-left text-brand-dark font-black font-mono">{pct}% ({count})</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 border border-brand-border bg-white rounded-2xl shadow-sm space-y-4 text-left">
        <h4 className="font-black text-brand-dark text-xs uppercase flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-primary" />
          Viết nhận xét & đánh giá sản phẩm
        </h4>

        <div className="space-y-1">
          <label className="font-extrabold text-[10px] text-brand-muted uppercase">Chọn mức sao đánh giá:</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                type="button"
                key={s}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => setRating(s)}
                className="focus:outline-none transition-transform hover:scale-110 cursor-pointer"
              >
                <Star
                  className={`w-6 h-6 transition-all ${
                    s <= (hoverRating ?? rating) 
                      ? "text-amber-400 fill-amber-400 drop-shadow-sm" 
                      : "text-brand-border"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-extrabold text-[10px] text-brand-muted uppercase">Nhận xét chi tiết:</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Hãy chia sẻ trải nghiệm về sản phẩm, dịch vụ của người bán để cộng đồng tham khảo nhé..."
            rows={4}
            className="w-full border border-brand-border rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary shadow-inner placeholder:text-brand-muted/70 font-medium"
          />
        </div>

        <div className="space-y-2">
          <label className="font-extrabold text-[10px] text-brand-muted uppercase block">Hình ảnh / Video nhận xét:</label>
          <div className="flex flex-wrap gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              multiple 
              accept="image/*,video/*" 
              className="hidden" 
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-5 py-2.5 bg-brand-primary text-white rounded-xl hover:bg-brand-primary/95 font-extrabold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Tải ảnh & Video từ thiết bị
                </>
              )}
            </button>
          </div>

          {mediaList.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-2">
              {mediaList.map((url, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-brand-border bg-slate-50 shrink-0 shadow-xs">
                  {isVideo(url) ? (
                    <div className="w-full h-full relative bg-black">
                      <video src={url} preload="metadata" className="w-full h-full object-cover opacity-60" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-4 h-4 fill-white text-white drop-shadow-sm" />
                      </div>
                    </div>
                  ) : (
                    <img src={url} alt="Attached review media" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(idx)}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow-sm cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={addReviewMutation.isPending}
            className="h-10 px-6 bg-brand-dark text-white rounded-xl hover:bg-black font-black text-xs transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md"
          >
            {addReviewMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Đăng nhận xét ngay
          </button>
        </div>
      </form>

      <div className="space-y-4 text-left">
        <div className="flex justify-between items-center pb-2 border-b border-brand-border">
          <h3 className="font-black text-brand-dark text-xs uppercase tracking-wide">Nhận xét khách hàng ({ratingsSummary.totalReviews})</h3>
          
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => { setActiveTab("all"); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                activeTab === "all" ? "bg-brand-dark text-white" : "bg-brand-light-soft/40 hover:bg-brand-light-soft/80 text-brand-muted"
              }`}
            >
              Tất cả
            </button>
            {[5, 4, 3, 2, 1].map((s) => (
              <button
                key={s}
                onClick={() => { setActiveTab(s); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                  activeTab === s ? "bg-brand-dark text-white" : "bg-brand-light-soft/40 hover:bg-brand-light-soft/80 text-brand-muted"
                }`}
              >
                {s} <Star className="w-2.5 h-2.5 fill-current" />
              </button>
            ))}
          </div>
        </div>

        {isReviewsLoading ? (
          <div className="flex justify-center items-center py-12 gap-2 text-xs font-bold text-brand-muted">
            <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
            Đang tải danh sách nhận xét...
          </div>
        ) : filteredReviews.length === 0 ? (
          <p className="text-center py-10 font-bold text-brand-muted text-[11px]">Chưa có đánh giá nào tương ứng với tiêu chí lọc.</p>
        ) : (
          <div className="divide-y divide-brand-border">
            {filteredReviews.map((rev: any) => (
              <div key={rev.id} className="py-5 space-y-2.5 first:pt-0">
                <div className="flex items-start gap-3">
                  <div 
                    onClick={() => navigate(`/users/${rev.customerId}`)}
                    className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-brand-border shrink-0 cursor-pointer hover:opacity-80 transition-all"
                  >
                    {rev.customerAvatarUrl ? (
                      <img 
                        src={rev.customerAvatarUrl} 
                        alt={rev.customerName} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-black text-sm uppercase">
                        {(rev.customerName || "K").charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span 
                        onClick={() => navigate(`/users/${rev.customerId}`)}
                        className="font-extrabold text-[12px] text-brand-dark cursor-pointer hover:underline"
                      >
                        {rev.customerName}
                      </span>
                      <span className="text-[10px] text-brand-muted font-bold">{new Date(rev.createdDate).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={`w-3.5 h-3.5 ${s <= rev.rating ? "text-amber-400 fill-amber-400" : "text-brand-border"}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-brand-dark leading-relaxed font-medium text-[11.5px] pr-2">
                  {rev.comment}
                </p>

                {rev.media && rev.media.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {rev.media.map((url: string, idx: number) => (
                      <div 
                        key={idx} 
                        onClick={() => setLightboxMedia(url)}
                        className="relative w-20 h-20 rounded-2xl overflow-hidden border border-brand-border bg-slate-50 cursor-zoom-in hover:brightness-95 transition-all shadow-xs shrink-0"
                      >
                        {isVideo(url) ? (
                          <div className="w-full h-full relative bg-black">
                            <video src={url} preload="metadata" className="w-full h-full object-cover opacity-60" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-dark/30 text-white gap-1 text-[8px] font-black uppercase tracking-wider">
                              <Play className="w-5 h-5 fill-white text-white drop-shadow-md shrink-0" />
                              <span>Video</span>
                            </div>
                          </div>
                        ) : (
                          <img src={url} alt="User review asset" className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {reviewsData && reviewsData.totalCount > 5 && (
          <div className="flex justify-between items-center pt-5 border-t border-brand-border">
            <span className="text-[10px] text-brand-muted font-bold">
              Hiển thị {filteredReviews.length} / {reviewsData.totalCount} đánh giá
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-2.5 py-1 text-[10px] font-black bg-white border border-brand-border rounded-lg hover:bg-brand-light-soft disabled:opacity-40 transition-all cursor-pointer"
              >
                Trước
              </button>
              
              {Array.from({ length: Math.ceil(reviewsData.totalCount / 5) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-7 h-7 flex items-center justify-center text-[10px] font-black rounded-lg border transition-all cursor-pointer ${
                      page === pageNum 
                        ? "bg-brand-dark text-white border-brand-dark" 
                        : "bg-white text-brand-muted border-brand-border hover:bg-brand-light-soft"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                disabled={page * 5 >= reviewsData.totalCount}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 text-[10px] font-black bg-white border border-brand-border rounded-lg hover:bg-brand-light-soft disabled:opacity-40 transition-all cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {lightboxMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <button
            onClick={() => setLightboxMedia(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 shadow-md cursor-pointer transition-all"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[85vh] w-full flex items-center justify-center select-none">
            {isVideo(lightboxMedia) ? (
              <video 
                src={lightboxMedia} 
                controls 
                autoPlay 
                className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl"
              />
            ) : (
              <img 
                src={lightboxMedia} 
                alt="Zoomed review asset" 
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" 
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
