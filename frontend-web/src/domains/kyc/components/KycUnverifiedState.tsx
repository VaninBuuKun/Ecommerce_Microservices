import React from "react";
import { ShieldAlert, ArrowLeft, CreditCard, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWalletQuery } from "@/domains/wallet";

interface Props {
  onBack: () => void;
  onProceed: () => void;
}

export const KycUnverifiedState: React.FC<Props> = ({ onBack, onProceed }) => {
  const navigate = useNavigate();
  const {
    data: wallet,
    isLoading: walletLoading,
    error: walletError,
  } = useWalletQuery();

  const hasWallet = !!wallet && !walletError;

  return (
    <div className="text-center py-4">
      {walletLoading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">Đang kiểm tra thông tin ví...</p>
        </div>
      ) : !hasWallet ? (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-4 animate-bounce">
            <Wallet className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Chưa kích hoạt ví điện tử</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            Bạn cần tạo và kích hoạt ví điện tử trước để nhận doanh thu bán hàng từ BuuStore.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2 border border-input rounded-md text-sm font-medium hover:bg-accent transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Quay lại
            </button>
            <button
              onClick={() => navigate("/profile?tab=wallet")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm"
            >
              <CreditCard className="h-4 w-4" /> Đến trang tạo ví
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Yêu cầu xác minh định danh (KYC)</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            Để đăng ký mở cửa hàng và bắt đầu bán hàng trên BuuStore, vui lòng hoàn tất xác minh định danh cá nhân.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2 border border-input rounded-md text-sm font-medium hover:bg-accent transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Quay lại
            </button>
            <button
              onClick={onProceed}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              Tiến hành xác minh ngay
            </button>
          </div>
        </>
      )}
    </div>
  );
};
