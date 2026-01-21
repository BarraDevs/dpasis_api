import { Injectable } from '@nestjs/common';
import { IServiceRepository } from 'src/app/service/application/persistence/repository/service-repository.interface';
import { Service } from 'src/app/service/domain/entities/service.entity';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ServiceRepositoryAdapterPrisma implements IServiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(service: Service): Promise<void> {
    const { productIds, ...data } = service.props;

    await this.prisma.service.create({
      data: {
        ...data,
        products: {
          create: productIds.map((productId) => ({ productId })),
        },
      },
    });
  }

  public async edit(service: Service): Promise<void> {
    const { id, productIds, ...data } = service.props;

    await this.prisma.service.update({
      where: { id },
      data: {
        ...data,
        products: {
          deleteMany: {},
          create: productIds.map((productId) => ({ productId })),
        },
      },
    });
  }
}
