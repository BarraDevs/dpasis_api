import { ClientContactDto } from '../../dtos/client-contact.dto';
import { FindAllClientContactQueryDto } from '../../usecases/find-all-client-contact/dtos/find-all-client-contact.dto';

export interface IClientContactDao {
  findAll(queries: FindAllClientContactQueryDto): Promise<[ClientContactDto[], number]>;
  findById(id: number): Promise<ClientContactDto | null>;
  findByClientIdAndEmail(clientId: number, email: string): Promise<ClientContactDto | null>;
}
