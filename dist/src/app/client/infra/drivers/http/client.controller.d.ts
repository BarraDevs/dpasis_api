import { ClientDto } from 'src/app/client/application/dtos/client.dto';
import { CreateClient } from 'src/app/client/application/usecases/create-client/create-client.service';
import { CreateClientInputDto, CreateClientOutputDto } from 'src/app/client/application/usecases/create-client/dtos/create-client.dto';
import { EditClientInputDto } from 'src/app/client/application/usecases/edit-client/dtos/edit-client.dto';
import { EditClient } from 'src/app/client/application/usecases/edit-client/edit-client.service';
import { FindAllClientQueryDto } from 'src/app/client/application/usecases/find-all-client/dtos/find-all-client.dto';
import { FindAllClient } from 'src/app/client/application/usecases/find-all-client/find-all-client.service';
import { FindClientById } from 'src/app/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class-*/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
export declare class ClientController {
    private readonly createClientService;
    private readonly findAllClientService;
    private readonly findClientByIdService;
    private readonly editClientService;
    constructor(createClientService: CreateClient, findAllClientService: FindAllClient, findClientByIdService: FindClientById, editClientService: EditClient);
    create(body: CreateClientInputDto): Promise<CreateClientOutputDto>;
    findAll(queries: FindAllClientQueryDto): Promise<IPagination<ClientDto>>;
    findOne(params: Params): Promise<ClientDto | null>;
    update(params: Params, body: EditClientInputDto): Promise<SuccessMessage>;
}
