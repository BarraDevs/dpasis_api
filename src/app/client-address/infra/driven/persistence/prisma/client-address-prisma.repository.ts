import { Injectable } from '@nestjs/common';
import { IClientAddressRepository } from 'src/app/client-address/application/persistence/repository/client-address-repository.interface';
import { ClientAddress } from 'src/app/client-address/domain/entities/client-address.entity';
import { ClientAddressType } from 'src/app/client-address/domain/enums/client-address-type.enum';
import { ClientAddressFactory } from 'src/app/client-address/domain/factories/client-address.factory';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ClientAddressRepositoryAdapterPrisma implements IClientAddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: ClientAddress): Promise<number> {
    const result = await this.prisma.clientAddress.create({
      data: {
        clientId: entity.props.clientId,
        type: entity.props.type,
        zipCode: entity.props.zipCode,
        street: entity.props.street,
        number: entity.props.number,
        complement: entity.props.complement,
        neighborhood: entity.props.neighborhood,
        city: entity.props.city,
        state: entity.props.state,
      },
    });

    return result.id;
  }

  public async edit(entity: ClientAddress): Promise<void> {
    await this.prisma.clientAddress.update({
      where: {
        id: entity.props.id!,
      },
      data: {
        clientId: entity.props.clientId,
        type: entity.props.type,
        zipCode: entity.props.zipCode,
        street: entity.props.street,
        number: entity.props.number,
        complement: entity.props.complement,
        neighborhood: entity.props.neighborhood,
        city: entity.props.city,
        state: entity.props.state,
      },
    });
  }

  public async findById(id: number): Promise<ClientAddress | null> {
    const data = await this.prisma.clientAddress.findUnique({
      where: { id },
    });
    if (!data) return null;

    return ClientAddressFactory.load({
      id: data.id,
      clientId: data.clientId,
      type: data.type as ClientAddressType,
      zipCode: data.zipCode,
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.clientAddress.delete({
      where: { id },
    });
  }
}
