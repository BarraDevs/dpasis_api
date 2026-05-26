import { Injectable } from '@nestjs/common';
import { IResaleRepository } from 'src/app/resale/resale/application/persistence/repository/resale-repository.interface';
import { Resale } from 'src/app/resale/resale/domain/entities/resale.entity';
import { ResaleType } from 'src/app/resale/resale/domain/enums/resale-type.enum';
import { ResaleFactory } from 'src/app/resale/resale/domain/factories/resale.factory';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ResaleRepositoryAdapterPrisma implements IResaleRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: Resale): Promise<number> {
    const { id, ...props } = entity.props;

    const created = await this.prisma.resale.create({
      data: {
        id,
        ...props,
      },
    });
    return created.id;
  }

  public async edit(entity: Resale): Promise<void> {
    const { id, ...props } = entity.props;

    await this.prisma.resale.update({
      where: { id: id! },
      data: { ...props },
    });
  }

  public async findById(id: number): Promise<Resale | null> {
    const data = await this.prisma.resale.findUnique({
      where: { id },
    });
    if (!data) return null;

    return ResaleFactory.load({
      ...data,
      type: data.type as ResaleType,
      honorificId: data.honorificId ?? null,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.resale.delete({
      where: { id },
    });
  }
}
