import { CashFlowEntryDto } from '../../dtos/cash-flow-entry.dto';
import { FindAllCashFlowEntryQueryDto } from '../../usecases/find-all-cash-flow-entry/dtos/find-all-cash-flow-entry.dto';

export type CashFlowEntrySaveData = {
  companyId: number;
  type: string;
  origin: string;
  amountInCents: number;
  occurredAt: Date;
  description: string;
  nfseId?: number | null;
  bankPaymentRequestCode?: string | null;
};

export type CashFlowEntryEditData = {
  companyId?: number;
  type?: string;
  amountInCents?: number;
  occurredAt?: Date;
  description?: string;
};

export interface ICashFlowEntryDao {
  findAll(queries: FindAllCashFlowEntryQueryDto): Promise<[CashFlowEntryDto[], number]>;
  findById(id: number): Promise<CashFlowEntryDto | null>;
  findByNfseId(nfseId: number): Promise<CashFlowEntryDto | null>;
  save(data: CashFlowEntrySaveData): Promise<number>;
  edit(id: number, data: CashFlowEntryEditData): Promise<void>;
  delete(id: number): Promise<void>;
}
