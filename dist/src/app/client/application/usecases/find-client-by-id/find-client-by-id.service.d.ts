import { ClientDto } from '../../dtos/client.dto';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
export declare class FindClientById {
    private clientDao;
    constructor(clientDao: IClientDao);
    execute(id: string): Promise<ClientDto | null>;
}
