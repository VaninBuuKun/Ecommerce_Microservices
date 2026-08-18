import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KycUnverifiedState, useMyKycQuery } from "@/domains/kyc";

export const KycOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoading } = useMyKycQuery();
  const [step, setStep] = useState<"unverified" | "form">("unverified");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {step === "unverified" ? (
        <KycUnverifiedState
          onBack={() => navigate("/")}
          onProceed={() => setStep("form")}
        />
      ) : (
        <div className="p-6 bg-card border rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-4">Điền thông tin xác minh KYC</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Nhập số CCCD và tải lên ảnh 2 mặt để ban quản trị phê duyệt cửa hàng.
          </p>
          <button
            onClick={() => setStep("unverified")}
            className="px-4 py-2 border rounded-md text-sm hover:bg-accent"
          >
            Quay lại
          </button>
        </div>
      )}
    </div>
  );
};

export default KycOnboardingPage;
