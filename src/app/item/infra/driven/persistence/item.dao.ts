import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ItemDto } from 'src/app/item/application/dtos/item.dto';
import { IItemDao } from 'src/app/item/application/persistence/dao/item-dao.interface';
import { CreateItemInputDto } from 'src/app/item/application/usecases/create-item/dtos/create-item.dto';
import { EditItemInputDto } from 'src/app/item/application/usecases/edit-item/dtos/edit-item.dto';
import { FindAllItemQueryDto } from 'src/app/item/application/usecases/find-all-item/dtos/find-all-item.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ItemDaoAdapterPrisma implements IItemDao {
  constructor(private prisma: PrismaService) {}

  public async save(data: CreateItemInputDto): Promise<string> {
    const result = await this.prisma.item.create({
      data,
    });

    return result.id;
  }

  public async findAll(queries: FindAllItemQueryDto): Promise<[ItemDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.ItemWhereInput = {
      AND: [
        {
          OR: [
            { field: { contains: queries.search } },
          ],
        },
      ],
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

  public async edit(id: string, data: EditItemInputDto): Promise<void> {
    await this.prisma.item.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.item.delete({
      where: { id },
    });
  }
}
