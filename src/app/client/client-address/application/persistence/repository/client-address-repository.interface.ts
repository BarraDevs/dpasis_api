import { ClientAddress } from 'src/app/client/client-address/domain/entities/client-address.entity';

export interface IClientAddressRepository {
  save(entity: ClientAddress): Promise<number>;
  edit(entity: ClientAddress): Promise<void>;
  findById(id: number): Promise<ClientAddress | null>;
  delete(id: number): Promise<void>;
}
