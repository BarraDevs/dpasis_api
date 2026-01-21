import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ServiceDto } from 'src/app/service/application/dtos/service.dto';
import { IServiceDao } from 'src/app/service/application/persistence/dao/service-dao.interface';
import { FindAllServiceQueryDto } from 'src/app/service/application/usecases/find-all-service/dtos/find-all-service.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const serviceSelect = {
  id: true,
  name: true,
  nickname: true,
  companyId: true,
  deadline: true,
  shippingValueInCents: true,
  warrant: true,
  weight: true,
  maxVolume: true,
  dimensions: true,
  commission: true,
  valueInCents: true,
  active: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  products: {
    select: {
      product: {
        select: {
          id: true,
          description: true,
        },
      },
    },
  },
} satisfies Prisma.ServiceSelect;

type ServiceRecord = Prisma.ServiceGetPayload<{ select: typeof serviceSelect }>;

@Injectable()
export class ServiceDaoAdapterPrisma implements IServiceDao {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDto(service: ServiceRecord): ServiceDto {
    return {
      ...service,
      products: service.products.map((product) => product.product),
    };
  }

  public async findAll(queries: FindAllServiceQueryDto): Promise<[ServiceDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.ServiceWhereInput = {
      AND: [
        { companyId: queries.companyId ? { equals: queries.companyId, mode: 'insensitive' } : undefined },
        { categoryId: queries.categoryId ? { equals: queries.categoryId, mode: 'insensitive' } : undefined },
        { name: queries.name ? { contains: queries.name, mode: 'insensitive' } : undefined },
        { active: queries.active !== undefined ? queries.active : undefined },
        { products: queries.productId ? { some: { productId: queries.productId } } : undefined },
        {
          OR: queries.search ? [
            { name: { contains: queries.search, mode: 'insensitive' } },
            { nickname: { contains: queries.search, mode: 'insensitive' } },
            { description: { contains: queries.search, mode: 'insensitive' } },
          ] : undefined,
        },
      ],
    };

    const [services, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        select: serviceSelect,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.service.count({ where }),
    ]);

    return [
      services.map(this.mapToDto),
      total,
    ];
  }

  public async findById(id: string): Promise<ServiceDto | null> {
    const service = await this.prisma.service.findUnique({
      where: { id },
      select: serviceSelect,
    });

    if (!service) {
      return null;
    }

    return this.mapToDto(service);
  }
}
