export interface SellerKycDto {
  id: string;
  userId: string;
  idCardNumber?: string;
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  identityCardNumber?: string;
  identityCardFrontUrl?: string;
  identityCardBackUrl?: string;
  status: "Draft" | "Submitted" | "Verified" | "Approved" | "Rejected";
  rejectionReason?: string;
  rejectReason?: string;
  createdAt?: string;
}
