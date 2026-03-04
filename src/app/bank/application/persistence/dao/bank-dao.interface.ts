import { BankDto } from '../../dtos/bank.dto';
import { CreateBankInputDto } from '../../usecases/create-bank/dtos/create-bank.dto';
import { EditBankInputDto } from '../../usecases/edit-bank/dtos/edit-bank.dto';
import { FindAllBankQueryDto } from '../../usecases/find-all-bank/dtos/find-all-bank.dto';

export interface IBankDao {
  findAll(queries: FindAllBankQueryDto): Promise<[BankDto[], number]>;
  findById(id: number): Promise<BankDto | null>;
  findByBankCodeAgencyAccount(bankCode: string, agency: string, account: string): Promise<BankDto | null>;
  save(data: CreateBankInputDto): Promise<number>;
  edit(id: number, data: EditBankInputDto): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
}
