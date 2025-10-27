import { Injectable } from '@nestjs/common';
import { IClientRepository } from 'src/app/client/application/persistence/repository/client-repository.interface';
import { Client } from 'src/app/client/domain/entities/client.entity';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ClientRepositoryAdapterPrisma implements IClientRepository {
  constructor(private prisma: PrismaService) {}

  public async save(client: Client): Promise<string> {
    const newClient = await this.prisma.client.create({
      data: { ...client.props },
    });

    return newClient.id;
  }

  public async edit(client: Client): Promise<void> {
    await this.prisma.client.update({
      where: { id: client.props.id },
      data: { ...client.props },
    });
  }
}
