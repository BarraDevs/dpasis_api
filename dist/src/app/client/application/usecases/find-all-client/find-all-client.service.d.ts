import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientDto } from '../../dtos/client.dto';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import { FindAllClientQueryDto } from './dtos/find-all-client.dto';
export declare class FindAllClient {
    private clientDao;
    constructor(clientDao: IClientDao);
    execute(queries: FindAllClientQueryDto): Promise<IPagination<ClientDto>>;
}
