import { Injectable } from '@nestjs/common';
import { IResaleRepository } from 'src/app/resale/resale/application/persistence/repository/resale-repository.interface';
import { Resale } from 'src/app/resale/resale/domain/entities/resale.entity';
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
      id: data.id,
      name: data.name,
      identifier: data.identifier,
      zipCode: data.zipCode,
      street: data.street,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      licenseType: data.licenseType,
      document: data.document,
      ie: data.ie,
      phone01: data.phone01,
      phone02: data.phone02,
      voucher: data.voucher,
      email: data.email,
      website: data.website,
      receivesSupportEmail: data.receivesSupportEmail,
      servedByDpa: data.servedByDpa,
      manufacturerReseller: data.manufacturerReseller,
      profilePictureUrl: data.profilePictureUrl,
      active: data.active,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.resale.delete({
      where: { id },
    });
  }
}
