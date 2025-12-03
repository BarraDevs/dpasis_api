import { Client } from 'src/app/client/domain/entities/client.entity';

export interface IClientRepository {
  findById(id: string): Promise<Client | null>;
  save(client: Client): Promise<void>;
  edit(client: Client): Promise<void>;
}
