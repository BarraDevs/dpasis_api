import { Injectable } from '@nestjs/common';
import { IProductRepository } from 'src/app/product/application/persistence/repository/product-repository.interface';
import { Product } from 'src/app/product/domain/entities/product.entity';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ProductRepositoryAdapterPrisma implements IProductRepository {
  constructor(private prisma: PrismaService) {}

  public async save(product: Product): Promise<void> {
    const { supplierIds, ...data } = product.props;

    await this.prisma.product.create({
      data: {
        ...data,
        suppliers: {
          connect: supplierIds.map((id) => ({ id })),
        },
      },
    });
  }

  public async edit(product: Product): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, supplierIds, currentStock, ...data } = product.props;

    await this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        suppliers: {
          set: supplierIds.map((id) => ({ id })),
        },
      },
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    });
  }
}
