export interface WalletDto {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  status: string;
  bankAccounts?: BankAccountDto[];
}

export interface BankAccountDto {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  isDefault: boolean;
}

export interface WalletTransactionDto {
  id: string;
  walletId: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export interface WithdrawalRequestDto {
  id: string;
  walletId: string;
  amount: number;
  status: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  createdAt: string;
}
