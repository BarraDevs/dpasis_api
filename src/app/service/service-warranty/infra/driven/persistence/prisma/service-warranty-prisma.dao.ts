import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ServiceWarrantyDto } from 'src/app/service/service-warranty/application/dtos/service-warranty.dto';
import { IServiceWarrantyDao } from 'src/app/service/service-warranty/application/persistence/dao/service-warranty-dao.interface';
import { CreateServiceWarrantyInputDto } from 'src/app/service/service-warranty/application/usecases/create-service-warranty/dtos/create-service-warranty.dto';
import { EditServiceWarrantyInputDto } from 'src/app/service/service-warranty/application/usecases/edit-service-warranty/dtos/edit-service-warranty.dto';
import { FindAllServiceWarrantyQueryDto } from 'src/app/service/service-warranty/application/usecases/find-all-service-warranty/dtos/find-all-service-warranty.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ServiceWarrantySelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceWarrantySelect;

@Injectable()
export class ServiceWarrantyDaoAdapterPrisma implements IServiceWarrantyDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllServiceWarrantyQueryDto): Promise<[ServiceWarrantyDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ServiceWarrantyWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        name: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ServiceWarrantyWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [serviceWarranties, total] = await this.prisma.$transaction([
      this.prisma.serviceWarranty.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ServiceWarrantySelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.serviceWarranty.count({ where }),
    ]);

    return [serviceWarranties, total];
  }

  public async findById(id: number): Promise<ServiceWarrantyDto | null> {
    return this.prisma.serviceWarranty.findUnique({
      where: { id },
      select: ServiceWarrantySelect,
    });
  }

  public async findByName(name: string): Promise<ServiceWarrantyDto | null> {
    return this.prisma.serviceWarranty.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: ServiceWarrantySelect,
    });
  }

  public async save(data: CreateServiceWarrantyInputDto): Promise<number> {
    const result = await this.prisma.serviceWarranty.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditServiceWarrantyInputDto): Promise<void> {
    await this.prisma.serviceWarranty.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.serviceWarranty.delete({
      where: { id },
    });
  }

  public async countServicesByWarrantyId(warrantyId: number): Promise<number> {
    return this.prisma.service.count({
      where: { serviceWarrantyId: warrantyId },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.serviceWarranty.update({
      where: { id },
      data: { active },
    });
  }
}
