export class BankDto {
  id: number;
  drawer: string;
  wallet: string;
  account: string;
  agency: string;
  bankCode: string;
  bankName: string;
  paymentLocation: string | null;
  fineRate: number | null;
  moraRate: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
