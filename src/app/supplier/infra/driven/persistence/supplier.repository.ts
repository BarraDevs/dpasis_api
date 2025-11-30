import { Injectable } from '@nestjs/common';
import { ISupplierRepository } from 'src/app/supplier/application/persistence/repository/supplier-repository.interface';
import { Supplier } from 'src/app/supplier/domain/entities/supplier.entity';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class SupplierRepositoryAdapterPrisma implements ISupplierRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(supplier: Supplier): Promise<void> {
    await this.prisma.supplier.create({
      data: {
        ...supplier.props,
        resource: {
          create: {
            // make sure to create a new resource with same supplier id
            id: supplier.props.id,
          },
        },
      },
    });
  }

  public async edit(supplier: Supplier): Promise<void> {
    const { id, ...data } = supplier.props;

    await this.prisma.supplier.update({
      where: { id },
      data,
    });
  }
}
