import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ServiceBilledDto } from 'src/app/service/service-billed/application/dtos/service-billed.dto';
import { IServiceBilledDao } from 'src/app/service/service-billed/application/persistence/dao/service-billed-dao.interface';
import { FindAllServiceBilledQueryDto } from 'src/app/service/service-billed/application/usecases/find-all-service-billed/dtos/find-all-service-billed.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ServiceBilledSelect = {
  id: true,
  description: true,
  isJunction: true,
  installmentDays: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceBilledSelect;

@Injectable()
export class ServiceBilledDaoAdapterPrisma implements IServiceBilledDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllServiceBilledQueryDto): Promise<[ServiceBilledDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ServiceBilledWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        description: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ServiceBilledWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [serviceBilleds, total] = await this.prisma.$transaction([
      this.prisma.serviceBilled.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ServiceBilledSelect,
        orderBy: { id: 'asc' },
      }),
      this.prisma.serviceBilled.count({ where }),
    ]);

    return [serviceBilleds, total];
  }

  public async findById(id: number): Promise<ServiceBilledDto | null> {
    return this.prisma.serviceBilled.findUnique({
      where: { id },
      select: ServiceBilledSelect,
    });
  }
}
