import { Injectable } from '@nestjs/common';
import { IClientContactRepository } from 'src/app/client/client-contact/application/persistence/repository/client-contact-repository.interface';
import { ClientContact } from 'src/app/client/client-contact/domain/entities/client-contact.entity';
import { ClientContactFactory } from 'src/app/client/client-contact/domain/factories/client-contact.factory';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ClientContactRepositoryAdapterPrisma implements IClientContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: ClientContact): Promise<number> {
    const props = entity.props;

    const result = await this.prisma.clientContact.create({
      data: {
        clientId: props.clientId,
        departmentId: props.departmentId,
        name: props.name,
        email: props.email,
        phone: props.phone,
        whatsapp: props.whatsapp,
        observations: props.observations,
        receiveNF: props.receiveNF,
      },
    });

    return result.id;
  }

  public async edit(entity: ClientContact): Promise<void> {
    const props = entity.props;

    await this.prisma.clientContact.update({
      where: { id: props.id! },
      data: {
        clientId: props.clientId,
        departmentId: props.departmentId,
        name: props.name,
        email: props.email,
        phone: props.phone,
        whatsapp: props.whatsapp,
        observations: props.observations,
        receiveNF: props.receiveNF,
      },
    });
  }

  public async findById(id: number): Promise<ClientContact | null> {
    const data = await this.prisma.clientContact.findUnique({
      where: { id },
    });

    if (!data) return null;

    return ClientContactFactory.load({
      id: data.id,
      clientId: data.clientId,
      departmentId: data.departmentId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp,
      observations: data.observations,
      receiveNF: data.receiveNF,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.clientContact.delete({
      where: { id },
    });
  }
}
