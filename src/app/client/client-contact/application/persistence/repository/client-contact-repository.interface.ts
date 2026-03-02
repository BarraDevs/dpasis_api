import { ClientContact } from 'src/app/client/client-contact/domain/entities/client-contact.entity';

export interface IClientContactRepository {
  save(entity: ClientContact): Promise<number>;
  edit(entity: ClientContact): Promise<void>;
  findById(id: number): Promise<ClientContact | null>;
  delete(id: number): Promise<void>;
}
