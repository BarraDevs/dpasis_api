import { Injectable } from '@nestjs/common';
import { IServiceBilledRepository } from 'src/app/service/service-billed/application/persistence/repository/service-billed-repository.interface';
import { ServiceBilled } from 'src/app/service/service-billed/domain/entities/service-billed.entity';
import { ServiceBilledFactory } from 'src/app/service/service-billed/domain/factories/service-billed.factory';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ServiceBilledRepositoryAdapterPrisma implements IServiceBilledRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: ServiceBilled): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...props } = entity.props;

    const created = await this.prisma.serviceBilled.create({
      data: { ...props },
    });

    return created.id;
  }

  public async edit(entity: ServiceBilled): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...props } = entity.props;

    await this.prisma.serviceBilled.update({
      where: { id: id! },
      data: { ...props },
    });
  }

  public async findById(id: number): Promise<ServiceBilled | null> {
    const data = await this.prisma.serviceBilled.findUnique({
      where: { id },
    });
    if (!data) return null;

    return ServiceBilledFactory.load({
      ...data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.serviceBilled.delete({
      where: { id },
    });
  }
}
