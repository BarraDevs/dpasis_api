import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import type { IClientRepository } from '../../persistence/repository/client-repository.interface';
import { CreateClientInputDto, CreateClientOutputDto } from './dtos/create-client.dto';
export declare class CreateClient {
    private readonly clientDao;
    private readonly clientRepository;
    constructor(clientDao: IClientDao, clientRepository: IClientRepository);
    execute(data: CreateClientInputDto): Promise<CreateClientOutputDto>;
}
