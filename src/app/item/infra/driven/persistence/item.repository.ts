import { Injectable } from '@nestjs/common';
import { IItemRepository } from 'src/app/item/application/persistence/repository/item-repository.interface';
import { Item } from 'src/app/item/domain/entities/item.entity';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ItemRepositoryAdapterPrisma implements IItemRepository {
  constructor(private prisma: PrismaService) {}

  public async createMany(items: Item[]): Promise<void> {
    const dataToCreate = items.map((item) => item.props);

    await this.prisma.item.createMany({
      data: dataToCreate,
      skipDuplicates: false,
    });
  }

  public async edit(item: Item): Promise<void> {
    const { id, ...data } = item.props;

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
