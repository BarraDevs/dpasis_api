import { Injectable } from '@nestjs/common';
import { ISupplierRepository } from 'src/app/supplier/application/persistence/repository/supplier-repository.interface';
import { Supplier } from 'src/app/supplier/domain/entities/supplier.entity';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class SupplierRepositoryAdapterPrisma implements ISupplierRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findById(id: string): Promise<Supplier | null> {
    const supplierRecord = await this.prisma.supplier.findUnique({
      where: { id },
      include: { companies: true },
    });

    if (!supplierRecord) {
      return null;
    }

    return Supplier.load({
      ...supplierRecord,
      companyIds: supplierRecord.companies.map((company) => company.id),
    });
  }

  public async save(supplier: Supplier): Promise<void> {
    const { companyIds, ...data } = supplier.props;

    await this.prisma.supplier.create({
      data: {
        ...data,
        companies: {
          connect: companyIds.map((companyId) => ({ id: companyId })),
        },
        resource: {
          create: {
            // make sure to create a new resource with same supplier id
            id: data.id,
            active: data.active,
          },
        },
      },
    });
  }

  public async edit(supplier: Supplier): Promise<void> {
    const { id, companyIds, ...data } = supplier.props;

    await this.prisma.supplier.update({
      where: { id },
      data: {
        ...data,
        companies: {
          set: companyIds.map((companyId) => ({ id: companyId })),
        },
        resource: {
          update: {
            active: data.active,
          },
        },
      },
    });
  }
}
