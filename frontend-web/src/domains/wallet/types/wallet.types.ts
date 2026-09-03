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
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  isDefault: boolean;
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
  accountNumber: string;
  accountHolderName: string;
  createdAt: string;
}
