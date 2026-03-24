import { Injectable } from '@nestjs/common';
import { IServiceCatalogRepository } from 'src/app/service/service-catalog/application/persistence/repository/service-catalog-repository.interface';
import { ServiceCatalog } from 'src/app/service/service-catalog/domain/entities/service-catalog.entity';
import { ServiceCatalogFactory } from 'src/app/service/service-catalog/domain/factories/service-catalog.factory';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ServiceCatalogRepositoryAdapterPrisma implements IServiceCatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: ServiceCatalog): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, companyIds, ...props } = entity.props;

    const created = await this.prisma.service.create({
      data: {
        ...props,
        companies: {
          connect: companyIds.map((companyId) => ({ id: companyId })),
        },
      },
    });
    return created.id;
  }

  public async edit(entity: ServiceCatalog): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, companyIds, ...props } = entity.props;

    await this.prisma.service.update({
      where: { id: id! },
      data: {
        ...props,
        companies: {
          set: companyIds.map((companyId) => ({ id: companyId })),
        },
      },
    });
  }

  public async findById(id: number): Promise<ServiceCatalog | null> {
    const data = await this.prisma.service.findUnique({
      where: { id },
      include: { companies: true },
    });
    if (!data) return null;

    const { companies, ...serviceData } = data;
    const companyIds = companies?.map((c) => c.id) ?? [];

    return ServiceCatalogFactory.load({
      ...serviceData,
      companyIds,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.service.delete({
      where: { id },
    });
  }
}
