import { BankDto } from '../dtos/bank.dto';

export type BankRow = {
  id: number;
  drawer: string;
  wallet: string;
  account: string;
  agency: string;
  bankCode: string;
  bankName: string;
  paymentLocation: string | null;
  fineRate: unknown;
  moraRate: unknown;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function bankChargesFromDto(bank?: Pick<BankDto, 'fineRate' | 'moraRate'> | null): {
  fineRate: number | null;
  moraRate: number | null;
} {
  return {
    fineRate: typeof bank?.fineRate === 'number' ? bank.fineRate : null,
    moraRate: typeof bank?.moraRate === 'number' ? bank.moraRate : null,
  };
}

export function toBankDto(row: BankRow): BankDto {
  return {
    id: row.id,
    drawer: row.drawer,
    wallet: row.wallet,
    account: row.account,
    agency: row.agency,
    bankCode: row.bankCode,
    bankName: row.bankName,
    paymentLocation: row.paymentLocation,
    fineRate: toNullableNumber(row.fineRate),
    moraRate: toNullableNumber(row.moraRate),
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toNullableNumber(value: unknown): number | null {
  if (value == null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
