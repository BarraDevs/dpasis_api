import { Injectable } from '@nestjs/common';
import { IClientRepository } from 'src/app/client/application/persistence/repository/client-repository.interface';
import { Client } from 'src/app/client/domain/entities/client.entity';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ClientRepositoryAdapterPrisma implements IClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findById(id: string): Promise<Client | null> {
    const clientRecord = await this.prisma.client.findUnique({
      where: { id },
      include: { companies: true },
    });

    if (!clientRecord) {
      return null;
    }

    const client = Client.load({
      ...clientRecord,
      companyIds: clientRecord.companies.map((company) => company.id),
    });

    return client;
  }

  public async save(client: Client): Promise<void> {
    const { companyIds, ...data } = client.props;

    await this.prisma.client.create({
      data: {
        ...data,
        companies: {
          connect: companyIds.map((companyId) => ({ id: companyId })),
        },
        resource: {
          create: {
            // make sure to create a new resource with same client id
            id: client.props.id,
          },
        },
      },
    });
  }

  public async edit(client: Client): Promise<void> {
    const { id, companyIds, ...data } = client.props;

    await this.prisma.client.update({
      where: { id },
      data: {
        ...data,
        companies: {
          set: companyIds.map((companyId) => ({ id: companyId })),
        },
      },
    });
  }
}
