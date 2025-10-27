import { IClientRepository } from 'src/app/client/application/persistence/repository/client-repository.interface';
import { Client } from 'src/app/client/domain/entities/client.entity';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
export declare class ClientRepositoryAdapterPrisma implements IClientRepository {
    private prisma;
    constructor(prisma: PrismaService);
    save(client: Client): Promise<string>;
    edit(client: Client): Promise<void>;
}
