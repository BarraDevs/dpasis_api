import { Injectable } from '@nestjs/common';
import { IBilledRepository } from 'src/app/service/billed/application/persistence/repository/billed-repository.interface';
import { Billed } from 'src/app/service/billed/domain/entities/billed.entity';
import { BilledFactory } from 'src/app/service/billed/domain/factories/billed.factory';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class BilledRepositoryAdapterPrisma implements IBilledRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: Billed): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...props } = entity.props;

    const created = await this.prisma.billed.create({
      data: { ...props },
    });

    return created.id;
  }

  public async edit(entity: Billed): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...props } = entity.props;

    await this.prisma.billed.update({
      where: { id: id! },
      data: { ...props },
    });
  }

  public async findById(id: number): Promise<Billed | null> {
    const data = await this.prisma.billed.findUnique({
      where: { id },
    });
    if (!data) return null;

    return BilledFactory.load({
      ...data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.billed.delete({
      where: { id },
    });
  }
}
