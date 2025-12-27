import { Injectable } from '@nestjs/common';
import { IProductStockMovementRepository } from 'src/app/product-stock-movement/application/persistence/repository/product-stock-movement-repository.interface';
import { ProductStockMovement } from 'src/app/product-stock-movement/domain/entities/product-stock-movement.entity';
import { Product } from 'src/app/product/domain/entities/product.entity';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ProductStockMovementRepositoryAdapterPrisma implements IProductStockMovementRepository {
  constructor(private prisma: PrismaService) {}

  public async createMovementAndUpdateProduct(movement: ProductStockMovement, product: Product): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.productStockMovement.create({
        data: {
          id: movement.props.id,
          productId: movement.props.productId,
          type: movement.props.type,
          quantity: movement.props.quantity,
          unitPriceInCents: movement.props.unitPriceInCents,
          createdAt: movement.props.createdAt,
        },
      }),
      this.prisma.product.update({
        where: {
          id: product.props.id,
        },
        data: {
          currentStock: product.props.currentStock,
          updatedAt: product.props.updatedAt,
        },
      }),
    ]);
  }
}
