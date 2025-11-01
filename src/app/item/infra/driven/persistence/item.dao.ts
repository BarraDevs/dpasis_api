import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ItemDto } from 'src/app/item/application/dtos/item.dto';
import { IItemDao } from 'src/app/item/application/persistence/dao/item-dao.interface';
import { FindAllItemQueryDto } from 'src/app/item/application/usecases/find-all-item/dtos/find-all-item.dto'; // (Precisamos criar este DTO)
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ItemDaoAdapterPrisma implements IItemDao {
  constructor(private prisma: PrismaService) {}

  public async findAll(queries: FindAllItemQueryDto): Promise<[ItemDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.ItemWhereInput = {
      ownerId: queries.ownerId,
      description: queries.search
        ? { contains: queries.search, mode: 'insensitive' }
        : undefined,
      serviceCode: queries.search
        ? { contains: queries.search, mode: 'insensitive' }
        : undefined,
    };

    return this.prisma.$transaction([
      this.prisma.item.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.item.count({ where }),
    ]);
  }

  public async findById(id: string): Promise<ItemDto | null> {
    return this.prisma.item.findUnique({
      where: { id },
    });
  }
}
