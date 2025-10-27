import { Client } from 'src/app/client/domain/entities/client.entity';
export interface IClientRepository {
    save(client: Client): Promise<string>;
    edit(client: Client): Promise<void>;
}
