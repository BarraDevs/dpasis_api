import { Client } from 'src/app/client/client/domain/entities/client.entity';

export interface IClientRepository {
  save(entity: Client): Promise<void>;
  edit(entity: Client): Promise<void>;
  findById(id: number): Promise<Client | null>;
  delete(id: number): Promise<void>;
}
