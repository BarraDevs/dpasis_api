import { Injectable } from '@nestjs/common';
import { IItemRepository } from 'src/app/item/application/persistence/repository/item-repository.interface';
import { Item } from 'src/app/item/domain/entities/item.entity';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ItemRepositoryAdapterPrisma implements IItemRepository {
  constructor(private prisma: PrismaService) {}

  public async createMany(items: Item[]): Promise<void> {
    // O Prisma 'createMany' é otimizado para inserção em lote.
    // Mapeamos nossas entidades (que já têm UUIDs gerados) para os dados crus.
    const dataToCreate = items.map((item) => item.props);

    await this.prisma.item.createMany({
      data: dataToCreate,
      skipDuplicates: false, // Falha se houver duplicatas (o que não deve acontecer com UUIDs)
    });
  }

  public async edit(item: Item): Promise<void> {
    const { id, ...data } = item.props;

    await this.prisma.item.update({
      where: { id },
      data,
    });
  }
}
