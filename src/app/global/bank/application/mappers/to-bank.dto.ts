import { BankCertFormat } from '../../domain/enums/bank-cert-format.enum';
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
  apiUrl: string | null;
  clientIdHint: string | null;
  hasClientSecret: boolean;
  hasCertificate: boolean;
  certFormat: string | null;
  certificateNotAfter: Date | null;
  hasWebhookToken: boolean;
  integrationConfigured: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BankPersistenceRow = {
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
  apiUrl?: string | null;
  clientIdHint?: string | null;
  clientIdCiphertext?: string | null;
  clientSecretCiphertext?: string | null;
  webhookTokenHash?: string | null;
  certFormat?: string | null;
  certFilePath?: string | null;
  certificateNotAfter?: Date | null;
};

export function toBankDtoFromPersistence(row: BankPersistenceRow): BankDto {
  const hasClientId = row.clientIdCiphertext != null;
  const hasClientSecret = row.clientSecretCiphertext != null;
  const hasCertificate = row.certFilePath != null;

  return toBankDto({
    id: row.id,
    drawer: row.drawer,
    wallet: row.wallet,
    account: row.account,
    agency: row.agency,
    bankCode: row.bankCode,
    bankName: row.bankName,
    paymentLocation: row.paymentLocation,
    fineRate: row.fineRate,
    moraRate: row.moraRate,
    apiUrl: row.apiUrl ?? null,
    clientIdHint: row.clientIdHint ?? null,
    hasClientSecret,
    hasCertificate,
    certFormat: row.certFormat ?? null,
    certificateNotAfter: row.certificateNotAfter ?? null,
    hasWebhookToken: row.webhookTokenHash != null,
    integrationConfigured: Boolean(row.apiUrl && hasClientId && hasClientSecret && hasCertificate),
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

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
    apiUrl: row.apiUrl,
    clientIdHint: row.clientIdHint,
    hasClientSecret: row.hasClientSecret,
    hasCertificate: row.hasCertificate,
    certFormat: toCertFormat(row.certFormat),
    certificateNotAfter: row.certificateNotAfter,
    hasWebhookToken: row.hasWebhookToken,
    integrationConfigured: row.integrationConfigured,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toCertFormat(value: string | null): BankCertFormat | null {
  if (value === BankCertFormat.Pfx || value === BankCertFormat.PemPair) {
    return value;
  }

  return null;
}

function toNullableNumber(value: unknown): number | null {
  if (value == null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
