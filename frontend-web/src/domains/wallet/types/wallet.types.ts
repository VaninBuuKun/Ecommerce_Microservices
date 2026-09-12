export interface WalletDto {
  id: number;
  userId: number;
  balance: number;
  currency: string;
  status: string;
  bankAccounts?: BankAccountDto[];
}

export interface BankAccountDto {
  id: number;
  walletId?: number;
  bankName: string;
  accountNumber?: string;
  bankAccountNumber?: string;
  accountHolderName?: string;
  bankAccountHolder?: string;
  isDefault: boolean;
  iconUrl?: string;
}

export interface WalletTransactionDto {
  id: number;
  walletId: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export interface WithdrawalRequestDto {
  id: number;
  walletId: number;
  amount: number;
  status: string;
  bankName: string;
  accountNumber?: string;
  bankAccountNumber?: string;
  accountHolderName?: string;
  bankAccountHolder?: string;
  createdAt: string;
  iconUrl?: string;
}
