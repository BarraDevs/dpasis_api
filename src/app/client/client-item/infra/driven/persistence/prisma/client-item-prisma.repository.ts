import { Injectable } from '@nestjs/common';
import { IClientItemRepository } from 'src/app/client/client-item/application/persistence/repository/client-item-repository.interface';
import { ClientItem } from 'src/app/client/client-item/domain/entities/client-item.entity';
import { ClientItemFactory } from 'src/app/client/client-item/domain/factories/client-item.factory';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ClientItemRepositoryAdapterPrisma implements IClientItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: ClientItem): Promise<number> {
    const props = entity.props;

    const result = await this.prisma.clientItem.create({
      data: {
        clientId: props.clientId,
        description: props.description,
        quantity: props.quantity,
        unitValueInCents: props.unitValueInCents,
        cnaeNbsIndopId: props.cnaeNbsIndopId,
        active: true,
      },
    });

    return result.id;
  }

  public async edit(entity: ClientItem): Promise<void> {
    const props = entity.props;

    await this.prisma.clientItem.update({
      where: { id: props.id! },
      data: {
        description: props.description,
        quantity: props.quantity,
        unitValueInCents: props.unitValueInCents,
        cnaeNbsIndopId: props.cnaeNbsIndopId,
      },
    });
  }

  public async findById(id: number): Promise<ClientItem | null> {
    const data = await this.prisma.clientItem.findUnique({
      where: { id },
    });

    if (!data) return null;

    return ClientItemFactory.load({
      id: data.id,
      clientId: data.clientId,
      description: data.description,
      quantity: data.quantity,
      unitValueInCents: data.unitValueInCents,
      cnaeNbsIndopId: data.cnaeNbsIndopId,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.clientItem.delete({
      where: { id },
    });
  }
}
