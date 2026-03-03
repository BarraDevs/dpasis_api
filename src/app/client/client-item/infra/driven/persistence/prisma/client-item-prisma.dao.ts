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
  cnae: true,
  nbs: true,
  indop: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientItemSelect;

type ClientItemRow = Prisma.ClientItemGetPayload<{ select: typeof ClientItemSelect }>;

@Injectable()
export class ClientItemDaoAdapterPrisma implements IClientItemDao {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(row: ClientItemRow): ClientItemDto {
    return {
      ...row,
      totalValueInCents: Math.ceil(row.quantity * row.unitValueInCents),
    };
  }

  public async findAll(queries: FindAllClientItemQueryDto): Promise<[ClientItemDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const andConditions: Prisma.ClientItemWhereInput[] = [
      { clientId: { equals: queries.clientId } },
    ];

    if (queries.search?.trim()) {
      andConditions.push({
        OR: [
          { description: { contains: queries.search, mode: 'insensitive' } },
          { cnae: { contains: queries.search, mode: 'insensitive' } },
          { nbs: { contains: queries.search, mode: 'insensitive' } },
          { indop: { contains: queries.search, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.ClientItemWhereInput = {
      AND: andConditions,
    };

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
