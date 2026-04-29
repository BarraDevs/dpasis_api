import { Injectable } from '@nestjs/common';
import { IResaleContactRepository } from 'src/app/resale/resale-contact/application/persistence/repository/resale-contact-repository.interface';
import { ResaleContact } from 'src/app/resale/resale-contact/domain/entities/resale-contact.entity';
import { ResaleContactFactory } from 'src/app/resale/resale-contact/domain/factories/resale-contact.factory';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ResaleContactRepositoryAdapterPrisma implements IResaleContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: ResaleContact): Promise<number> {
    const props = entity.props;

    const result = await this.prisma.resaleContact.create({
      data: {
        resaleId: props.resaleId,
        departmentId: props.departmentId,
        name: props.name,
        email: props.email,
        phone: props.phone,
        whatsapp: props.whatsapp,
        observations: props.observations,
        receiveNF: props.receiveNF,
        active: props.active,
      },
    });

    return result.id;
  }

  public async edit(entity: ResaleContact): Promise<void> {
    const props = entity.props;

    await this.prisma.resaleContact.update({
      where: { id: props.id! },
      data: {
        departmentId: props.departmentId,
        name: props.name,
        email: props.email,
        phone: props.phone,
        whatsapp: props.whatsapp,
        observations: props.observations,
        receiveNF: props.receiveNF,
        active: props.active,
      },
    });
  }

  public async findById(id: number): Promise<ResaleContact | null> {
    const data = await this.prisma.resaleContact.findUnique({
      where: { id },
    });

    if (!data) return null;

    return ResaleContactFactory.load({
      id: data.id,
      resaleId: data.resaleId,
      departmentId: data.departmentId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp,
      observations: data.observations,
      receiveNF: data.receiveNF,
      active: data.active,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.resaleContact.delete({
      where: { id },
    });
  }
}
