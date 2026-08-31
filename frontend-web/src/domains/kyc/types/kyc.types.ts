export interface SellerKycDto {
  id: number;
  userId: number;
  idCardNumber?: string;
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  identityCardNumber?: string;
  identityCardFrontUrl?: string;
  identityCardBackUrl?: string;
  status: "Draft" | "Submitted" | "Verified" | "Rejected";
  rejectionReason?: string;
  rejectReason?: string;
  createdAt?: string;
}
