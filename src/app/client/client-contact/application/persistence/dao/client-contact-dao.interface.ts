import { ClientContactDto } from '../../dtos/client-contact.dto';
import { CreateClientContactInputDto } from '../../usecases/create-client-contact/dtos/create-client-contact.dto';
import { EditClientContactInputDto } from '../../usecases/edit-client-contact/dtos/edit-client-contact.dto';
import { FindAllClientContactQueryDto } from '../../usecases/find-all-client-contact/dtos/find-all-client-contact.dto';

export interface IClientContactDao {
  findAll(queries: FindAllClientContactQueryDto): Promise<[ClientContactDto[], number]>;
  findById(id: number): Promise<ClientContactDto | null>;
  findByClientIdAndEmail(clientId: number, email: string): Promise<ClientContactDto | null>;
  save(data: CreateClientContactInputDto): Promise<number>;
  edit(id: number, data: EditClientContactInputDto): Promise<void>;
  delete(id: number): Promise<void>;
}
