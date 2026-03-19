import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientItemDto } from 'src/app/client/client-item/application/dtos/client-item.dto';
import { IClientItemDao } from 'src/app/client/client-item/application/persistence/dao/client-item-dao.interface';
import { FindAllClientItemQueryDto } from 'src/app/client/client-item/application/usecases/find-all-client-item/dtos/find-all-client-item.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientItemSelect = {
  id: true,
  clientId: true,
  description: true,
  quantity: true,
  unitValueInCents: true,
  active: true,
  createdAt: true,
  updatedAt: true,
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
} satisfies Prisma.ClientItemSelect;

type ClientItemRow = Prisma.ClientItemGetPayload<{ select: typeof ClientItemSelect }>;

@Injectable()
export class ClientItemDaoAdapterPrisma implements IClientItemDao {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(row: ClientItemRow): ClientItemDto {
    return {
      id: row.id,
      clientId: row.clientId,
      description: row.description,
      quantity: row.quantity,
      unitValueInCents: row.unitValueInCents,
      totalValueInCents: Math.ceil(row.quantity * row.unitValueInCents),
      active: row.active,
      cnaeNbsIndop: {
        id: row.cnaeNbsIndop.id,
        active: row.cnaeNbsIndop.active,
        cnae: row.cnaeNbsIndop.cnae,
        nbs: row.cnaeNbsIndop.nbs,
        indop: row.cnaeNbsIndop.indop,
      },
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  public async findAll(queries: FindAllClientItemQueryDto): Promise<[ClientItemDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ClientItemWhereInput[] = [
      { clientId: { equals: queries.clientId } },
    ];

    if (queries.cnaeId != null) {
      conditions.push({
        cnaeNbsIndop: { cnaeId: { equals: queries.cnaeId } },
      });
    }
    if (queries.nbsId != null) {
      conditions.push({
        cnaeNbsIndop: { nbsId: { equals: queries.nbsId } },
      });
    }
    if (queries.indopId != null) {
      conditions.push({
        cnaeNbsIndop: { indopId: { equals: queries.indopId } },
      });
    }

    if (queries.search?.trim()) {
      conditions.push({
        OR: [
          { description: { contains: queries.search.trim(), mode: 'insensitive' } },
          {
            cnaeNbsIndop: {
              cnae: { code: { contains: queries.search.trim(), mode: 'insensitive' } },
            },
          },
          {
            cnaeNbsIndop: {
              nbs: { code: { contains: queries.search.trim(), mode: 'insensitive' } },
            },
          },
          {
            cnaeNbsIndop: {
              indop: { code: { contains: queries.search.trim(), mode: 'insensitive' } },
            },
          },
        ],
      });
    }

    const where: Prisma.ClientItemWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [clientItems, total] = await this.prisma.$transaction([
      this.prisma.clientItem.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ClientItemSelect,
        orderBy: { id: 'asc' },
      }),
      this.prisma.clientItem.count({ where }),
    ]);

    return [clientItems.map(this.toDto), total];
  }

  public async findById(id: number): Promise<ClientItemDto | null> {
    const row = await this.prisma.clientItem.findUnique({
      where: { id },
      select: ClientItemSelect,
    });

    if (!row) return null;

    return this.toDto(row);
  }
}
