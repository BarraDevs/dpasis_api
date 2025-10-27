import { ClientDto } from 'src/app/client/application/dtos/client.dto';
import { IClientDao } from 'src/app/client/application/persistence/dao/client-dao.interface';
import { FindAllClientQueryDto } from 'src/app/client/application/usecases/find-all-client/dtos/find-all-client.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
export declare class ClientDaoAdapterPrisma implements IClientDao {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(queries: FindAllClientQueryDto): Promise<[ClientDto[], number]>;
    findById(id: string): Promise<ClientDto | null>;
    findByCnpj(cnpj: string): Promise<ClientDto | null>;
    findByIe(ie: string): Promise<ClientDto | null>;
}
