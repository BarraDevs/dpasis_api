import { Injectable } from '@nestjs/common';
import { IShipperRepository } from 'src/app/shipper/application/persistence/repository/shipper-repository.interface';
import { Shipper } from 'src/app/shipper/domain/entities/shipper.entity';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ShipperRepositoryAdapterPrisma implements IShipperRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findById(id: string): Promise<Shipper | null> {
    const shipperRecord = await this.prisma.shipper.findUnique({
      where: { id },
      include: { companies: true },
    });

    if (!shipperRecord) {
      return null;
    }

    return Shipper.load({
      ...shipperRecord,
      companyIds: shipperRecord.companies.map((company) => company.id),
    });
  }

  public async save(shipper: Shipper): Promise<void> {
    const { companyIds, ...data } = shipper.props;

    await this.prisma.shipper.create({
      data: {
        ...data,
        companies: {
          connect: companyIds.map((companyId) => ({ id: companyId })),
        },
      },
    });
  }

  public async edit(shipper: Shipper): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, companyIds, updatedAt, ...data } = shipper.props;

    await this.prisma.shipper.update({
      where: { id },
      data: {
        ...data,
        companies: {
          set: companyIds.map((companyId) => ({ id: companyId })),
        },
      },
    });
  }
}
