import { Injectable } from '@nestjs/common';
import { ICarrierRepository } from 'src/app/carrier/application/persistence/repository/carrier-repository.interface';
import { Carrier } from 'src/app/carrier/domain/entities/carrier.entity';
import { CarrierFactory } from 'src/app/carrier/domain/factories/carrier.factory';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class CarrierRepositoryAdapterPrisma implements ICarrierRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: Carrier): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...props } = entity.props;

    const created = await this.prisma.carrier.create({
      data: { ...props },
    });
    return created.id;
  }

  public async edit(entity: Carrier): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...props } = entity.props;

    await this.prisma.carrier.update({
      where: { id: id! },
      data: { ...props },
    });
  }

  public async findById(id: number): Promise<Carrier | null> {
    const data = await this.prisma.carrier.findUnique({
      where: { id },
    });
    if (!data) return null;

    return CarrierFactory.load({
      ...data,
      complement: data.complement ?? null,
    });
  }
}
