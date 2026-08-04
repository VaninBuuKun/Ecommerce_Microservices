import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSellerStore } from "../../../shared/store/sellerStore";
import Header from "../../../components/Header";
import { Info, ShieldAlert, ArrowLeft, ArrowRight, Save, Upload } from "lucide-react";

export default function RegisterShopPage() {
  const navigate = useNavigate();
  const { addShop } = useSellerStore();
  const [step, setStep] = useState(1);

  // Form states
  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=200");
  
  const [identityName, setIdentityName] = useState("");
  const [identityFront, setIdentityFront] = useState("");
  const [identityBack, setIdentityBack] = useState("");

  // Handler for image uploads (generating placeholder / object URLs)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!shopName.trim()) {
        alert("Vui lòng điền tên shop!");
        return;
      }
      setStep(2);
    }
  };

  const handleSave = () => {
    if (!identityName.trim()) {
      alert("Vui lòng điền tên định danh!");
      return;
    }
    
    // Add shop to store
    const createdShop = addShop({
      name: shopName,
      description: description,
      avatarUrl: avatarUrl,
      identityName: identityName,
      identityFrontUrl: identityFront,
      identityBackUrl: identityBack,
    });

    // Navigate to dashboard for that shop
    navigate("/seller/dashboard");
  };

  return (
    <div className="min-h-screen bg-brand-light-soft flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col items-center">
        {/* Stepper Header */}
        <div className="w-full bg-white border border-brand-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6 mb-6">
          <div className="flex items-center justify-center gap-12 md:gap-24 mb-6">
            {/* Step 1 Indicator */}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 1 ? "bg-brand-primary text-brand-dark" : "bg-brand-border text-brand-muted"}`}>
                1
              </div>
              <span className={`text-[11px] font-bold ${step >= 1 ? "text-brand-dark" : "text-brand-muted"}`}>Thông tin Shop</span>
            </div>

            {/* Connecting line */}
            <div className="flex-1 h-0.5 max-w-[120px] bg-brand-border" />

            {/* Step 2 Indicator */}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 2 ? "bg-brand-primary text-brand-dark" : "bg-brand-border text-brand-muted"}`}>
                2
              </div>
              <span className={`text-[11px] font-bold ${step >= 2 ? "text-brand-dark" : "text-brand-muted"}`}>Thông tin định danh</span>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-3 text-xs text-blue-800 flex gap-2.5 items-start">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Việc thu thập Thông tin Shop và Thông tin Định danh là bắt buộc theo quy định pháp luật. Thông tin của bạn được bảo mật tuyệt đối. Người bán chịu trách nhiệm hoàn toàn về tính chính xác của các thông tin khai báo.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="w-full bg-white border border-brand-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6 flex-1 max-w-2xl">
          {step === 1 ? (
            <div className="space-y-5 text-left">
              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5 uppercase tracking-wide">
                  Tên Shop <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên shop bán hàng..."
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full h-9 px-3 bg-brand-light-soft border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary text-brand-dark"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5 uppercase tracking-wide">Mô tả Shop</label>
                <textarea
                  placeholder="Mô tả ngành hàng, sản phẩm chủ yếu của shop..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-brand-light-soft border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary text-brand-dark resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-dark mb-2.5 uppercase tracking-wide">Ảnh đại diện Shop</label>
                <div className="flex items-center gap-4">
                  <img
                    src={avatarUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover border border-brand-border"
                  />
                  <label className="px-4 py-2 border border-brand-border rounded text-xs font-semibold text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-brand-muted" />
                    Tải ảnh lên
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setAvatarUrl)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 text-left">
              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5 uppercase tracking-wide">
                  Tên Định Danh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập họ và tên trên CMND/CCCD..."
                  value={identityName}
                  onChange={(e) => setIdentityName(e.target.value)}
                  className="w-full h-9 px-3 bg-brand-light-soft border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary text-brand-dark"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-2.5 uppercase tracking-wide">CMND/CCCD Mặt trước</label>
                  <div className="border border-dashed border-brand-border rounded-lg p-4 flex flex-col items-center justify-center min-h-[140px] bg-brand-light-soft">
                    {identityFront ? (
                      <img src={identityFront} alt="Mặt trước" className="max-h-[120px] object-contain rounded" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-brand-muted mx-auto mb-2" />
                        <span className="text-[10px] text-brand-muted">Bấm để tải ảnh mặt trước CMND</span>
                      </div>
                    )}
                    <label className="mt-3 px-3 py-1 bg-white border border-brand-border rounded text-[10px] font-semibold text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer block">
                      Chọn tệp
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setIdentityFront)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-2.5 uppercase tracking-wide">CMND/CCCD Mặt sau</label>
                  <div className="border border-dashed border-brand-border rounded-lg p-4 flex flex-col items-center justify-center min-h-[140px] bg-brand-light-soft">
                    {identityBack ? (
                      <img src={identityBack} alt="Mặt sau" className="max-h-[120px] object-contain rounded" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-brand-muted mx-auto mb-2" />
                        <span className="text-[10px] text-brand-muted">Bấm để tải ảnh mặt sau CMND</span>
                      </div>
                    )}
                    <label className="mt-3 px-3 py-1 bg-white border border-brand-border rounded text-[10px] font-semibold text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer block">
                      Chọn tệp
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setIdentityBack)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Footer Controls */}
          <div className="flex justify-between items-center border-t border-brand-border mt-8 pt-4">
            <button
              onClick={() => {
                if (step === 1) {
                  navigate("/seller");
                } else {
                  setStep(1);
                }
              }}
              className="px-4 py-2 border border-brand-border rounded text-xs font-semibold text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Quay lại
            </button>

            {step === 1 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-brand-primary text-brand-dark font-black text-xs rounded hover:bg-brand-primary-deep transition-colors cursor-pointer flex items-center gap-1"
              >
                Tiếp theo
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-brand-primary text-brand-dark font-black text-xs rounded hover:bg-brand-primary-deep transition-colors cursor-pointer flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                Hoàn thành
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
