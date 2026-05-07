import { ResaleContactDto } from '../../dtos/resale-contact.dto';
import { FindAllResaleContactExecuteQuery } from '../../usecases/find-all-resale-contact/dtos/find-all-resale-contact.dto';

export interface IResaleContactDao {
  findAll(queries: FindAllResaleContactExecuteQuery): Promise<[ResaleContactDto[], number]>;
  findById(id: number): Promise<ResaleContactDto | null>;
  findByResaleIdAndEmail(resaleId: number, email: string): Promise<ResaleContactDto | null>;
}
