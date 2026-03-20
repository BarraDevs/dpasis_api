import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ServiceFreightDto } from 'src/app/service/service-freight/application/dtos/service-freight.dto';
import { IServiceFreightDao } from 'src/app/service/service-freight/application/persistence/dao/service-freight-dao.interface';
import { CreateServiceFreightInputDto } from 'src/app/service/service-freight/application/usecases/create-service-freight/dtos/create-service-freight.dto';
import { EditServiceFreightInputDto } from 'src/app/service/service-freight/application/usecases/edit-service-freight/dtos/edit-service-freight.dto';
import { FindAllServiceFreightQueryDto } from 'src/app/service/service-freight/application/usecases/find-all-service-freight/dtos/find-all-service-freight.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ServiceFreightSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceFreightSelect;

@Injectable()
export class ServiceFreightDaoAdapterPrisma implements IServiceFreightDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllServiceFreightQueryDto): Promise<[ServiceFreightDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ServiceFreightWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        name: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ServiceFreightWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [serviceFreights, total] = await this.prisma.$transaction([
      this.prisma.serviceFreight.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ServiceFreightSelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.serviceFreight.count({ where }),
    ]);

    return [serviceFreights, total];
  }

  public async findById(id: number): Promise<ServiceFreightDto | null> {
    return this.prisma.serviceFreight.findUnique({
      where: { id },
      select: ServiceFreightSelect,
    });
  }

  public async findByName(name: string): Promise<ServiceFreightDto | null> {
    return this.prisma.serviceFreight.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: ServiceFreightSelect,
    });
  }

  public async save(data: CreateServiceFreightInputDto): Promise<number> {
    const result = await this.prisma.serviceFreight.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditServiceFreightInputDto): Promise<void> {
    await this.prisma.serviceFreight.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.serviceFreight.delete({
      where: { id },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.serviceFreight.update({
      where: { id },
      data: { active },
    });
  }
}
