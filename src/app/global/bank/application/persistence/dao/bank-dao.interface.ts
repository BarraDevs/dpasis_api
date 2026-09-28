import { BankDto } from '../../dtos/bank.dto';
import { CreateBankInputDto } from '../../usecases/create-bank/dtos/create-bank.dto';
import { FindAllBankQueryDto } from '../../usecases/find-all-bank/dtos/find-all-bank.dto';

export type BankPublicFields = Pick<
  CreateBankInputDto,
  'drawer' | 'wallet' | 'account' | 'agency' | 'bankCode' | 'bankName' | 'paymentLocation' | 'fineRate' | 'moraRate'
>;

export type BankIntegrationPersistence = {
  apiUrl?: string | null;
  clientIdCiphertext?: string | null;
  clientIdHint?: string | null;
  clientSecretCiphertext?: string | null;
  webhookTokenHash?: string | null;
  certFormat?: string | null;
  certFilePath?: string | null;
  keyFilePath?: string | null;
  certPasswordCiphertext?: string | null;
  certificateNotAfter?: Date | null;
};

export type SaveBankData = BankPublicFields & BankIntegrationPersistence;
export type EditBankData = BankPublicFields & BankIntegrationPersistence;

export type BankIntegrationRecord = {
  id: number;
  drawer: string;
  bankName: string;
  apiUrl: string | null;
  clientIdCiphertext: string | null;
  clientSecretCiphertext: string | null;
  webhookTokenHash: string | null;
  certFormat: string | null;
  certFilePath: string | null;
  keyFilePath: string | null;
  certPasswordCiphertext: string | null;
  certificateNotAfter: Date | null;
};

export interface IBankDao {
  findAll(queries: FindAllBankQueryDto): Promise<[BankDto[], number]>;
  findById(id: number): Promise<BankDto | null>;
  findByBankCodeAgencyAccount(bankCode: string, agency: string, account: string): Promise<BankDto | null>;
  findIntegrationById(id: number): Promise<BankIntegrationRecord | null>;
  findByWebhookTokenHash(hash: string): Promise<BankIntegrationRecord | null>;
  findAllWithCertificate(): Promise<BankIntegrationRecord[]>;
  save(data: SaveBankData): Promise<number>;
  edit(id: number, data: EditBankData): Promise<void>;
  updateIntegration(id: number, data: BankIntegrationPersistence): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
  delete(id: number): Promise<void>;
  countClientInvoiceConfigsByBankId(bankId: number): Promise<number>;
}
