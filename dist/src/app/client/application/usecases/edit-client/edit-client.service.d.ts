import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import type { IClientRepository } from '../../persistence/repository/client-repository.interface';
import { EditClientInputDto } from './dtos/edit-client.dto';
export declare class EditClient {
    private readonly clientDao;
    private readonly clientRepository;
    constructor(clientDao: IClientDao, clientRepository: IClientRepository);
    execute(id: string, data: EditClientInputDto): Promise<SuccessMessage>;
}
