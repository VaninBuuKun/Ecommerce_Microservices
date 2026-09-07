import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Upload, Loader2, Play, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import { useAddProductReviewMutation } from "../../hooks/useCatalog";
import { api } from "@/core";
import axios from "axios";

export interface ProductReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | number;
  productName: string;
  variantName?: string;
  thumbnailUrl?: string;
  onSuccess?: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "Rất tệ",
  2: "Chưa hài lòng",
  3: "Bình thường",
  4: "Hài lòng",
  5: "Tuyệt vời",
};

export const ProductReviewModal: React.FC<ProductReviewModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  variantName,
  thumbnailUrl,
  onSuccess,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [mediaList, setMediaList] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addReviewMutation = useAddProductReviewMutation();

  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setHoverRating(null);
      setComment("");
      setMediaList([]);
    }
  }, [isOpen]);

  if (typeof document === "undefined") return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
          toast.error(`File "${file.name}" không hợp lệ.`);
          continue;
        }

        const res = await api.get("medias/upload-url", {
          params: { fileName: file.name, contentType: file.type },
        });

        const { uploadUrl, publicUrl } = res.data;

        await axios.put(uploadUrl, file, {
          headers: { "Content-Type": file.type },
        });

        setMediaList((prev) => [...prev, publicUrl]);
      }
      toast.success("Tải tệp thành công!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Không thể tải tệp lên.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes("video") || url.includes("stream");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Vui lòng nhập nhận xét!");
      return;
    }

    addReviewMutation.mutate(
      {
        productId: String(productId),
        rating,
        comment: comment.trim(),
        mediaList,
      },
      {
        onSuccess: () => {
          toast.success("Đánh giá thành công!");
          onClose();
          if (onSuccess) onSuccess();
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || err?.response?.data || "Đánh giá thất bại.";
          toast.error(msg);
        },
      }
    );
  };

  const currentDisplayRating = hoverRating ?? rating;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-full max-w-md bg-white rounded-2xl p-5 shadow-xl border border-slate-100 overflow-hidden text-left z-10 font-sans flex flex-col"
          >
            {/* Header Compact */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800 tracking-tight">
                Đánh giá sản phẩm
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none"
                aria-label="Đóng"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="pt-3.5 space-y-4">
              {/* Product Info + Inline Rating Stars */}
              <div className="flex items-center gap-3 p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                <img
                  src={
                    thumbnailUrl ||
                    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=150"
                  }
                  alt={productName}
                  className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0 bg-white"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="font-bold text-xs text-slate-800 truncate leading-tight">
                    {productName}
                  </h4>
                  {variantName && (
                    <p className="text-[11px] text-slate-400 font-medium truncate">
                      Phân loại: <span className="text-slate-600">{variantName}</span>
                    </p>
                  )}

                  <div className="flex items-center gap-1 pt-0.5">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          type="button"
                          key={s}
                          onMouseEnter={() => setHoverRating(s)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setRating(s)}
                          className="focus:outline-none transition-transform hover:scale-110 cursor-pointer p-0.5 border-none bg-transparent"
                        >
                          <Star
                            className={`w-4 h-4 transition-all ${
                              s <= currentDisplayRating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200 fill-slate-200"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-amber-600 ml-1.5">
                      {RATING_LABELS[currentDisplayRating]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comment Textarea */}
              <div className="space-y-1">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Viết đánh giá của bạn về sản phẩm..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 placeholder:text-slate-400 font-medium leading-relaxed bg-slate-50/30 resize-none"
                />
              </div>

              {/* Upload & Media List Below */}
              <div className="space-y-2.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                />

                {/* Upload Button First */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full h-10 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-semibold text-xs border border-dashed border-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Tải ảnh / video thực tế</span>
                    </>
                  )}
                </button>

                {/* Media Preview Grid Show Below */}
                {mediaList.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {mediaList.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 group"
                      >
                        {isVideo(url) ? (
                          <div className="w-full h-full relative bg-slate-900 flex items-center justify-center">
                            <video src={url} className="w-full h-full object-cover opacity-60" />
                            <Play className="w-3.5 h-3.5 fill-white text-white absolute" />
                          </div>
                        ) : (
                          <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(idx)}
                          className="absolute top-0.5 right-0.5 bg-slate-900/70 hover:bg-red-500 text-white rounded-full p-0.5 transition-colors cursor-pointer border-none"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-9 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold text-xs transition-colors cursor-pointer border-none"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={addReviewMutation.isPending}
                  className="flex-1 h-9 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-xs font-black text-amber-800 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  {addReviewMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                  ) : (
                    <>
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      Gửi đánh giá
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ProductReviewModal;