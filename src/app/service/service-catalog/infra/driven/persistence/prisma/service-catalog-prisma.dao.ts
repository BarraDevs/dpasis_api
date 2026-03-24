import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ServiceCatalogDto } from 'src/app/service/service-catalog/application/dtos/service-catalog.dto';
import { IServiceCatalogDao } from 'src/app/service/service-catalog/application/persistence/dao/service-catalog-dao.interface';
import { FindAllServiceCatalogQueryDto } from 'src/app/service/service-catalog/application/usecases/find-all-service-catalog/dtos/find-all-service-catalog.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

export const ServiceCatalogSelect = {
  id: true,
  name: true,
  unitPriceInCents: true,
  description: true,
  isCommercial: true,
  active: true,
  cnaeNbsIndop: {
    select: {
      id: true,
      active: true,
      cnae: {
        select: {
          id: true,
          code: true,
          description: true,
        },
      },
      nbs: {
        select: {
          id: true,
          code: true,
          description: true,
        },
      },
      indop: {
        select: {
          id: true,
          code: true,
          description: true,
        },
      },
    },
  },
  serviceBilled: {
    select: {
      id: true,
      description: true,
    },
  },
  serviceCategory: {
    select: {
      id: true,
      name: true,
    },
  },
  serviceDeliveryTerm: {
    select: {
      id: true,
      name: true,
    },
  },
  serviceFreight: {
    select: {
      id: true,
      name: true,
    },
  },
  serviceProposalValidity: {
    select: {
      id: true,
      name: true,
    },
  },
  serviceWarranty: {
    select: {
      id: true,
      name: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceSelect;

@Injectable()
export class ServiceCatalogDaoAdapterPrisma implements IServiceCatalogDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllServiceCatalogQueryDto): Promise<[ServiceCatalogDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ServiceWhereInput[] = [];

    if (queries.cnaeNbsIndopId != null) {
      conditions.push({ cnaeNbsIndopId: { equals: queries.cnaeNbsIndopId } });
    }

    if (queries.search?.trim()) {
      conditions.push({
        OR: [
          { name: { contains: queries.search.trim(), mode: 'insensitive' } },
          { description: { contains: queries.search.trim(), mode: 'insensitive' } },
        ],
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ServiceWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ServiceCatalogSelect,
        orderBy: { id: 'asc' },
      }),
      this.prisma.service.count({ where }),
    ]);

    return [rows, total];
  }

  public async findById(id: number): Promise<ServiceCatalogDto | null> {
    const row = await this.prisma.service.findUnique({
      where: { id },
      select: ServiceCatalogSelect,
    });
    return row ?? null;
  }
}
