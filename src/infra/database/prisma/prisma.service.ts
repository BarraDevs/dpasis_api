import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({ errorFormat: 'minimal' });
  }

  public async onModuleInit() {
    await this.$connect();
  }

  public paginationFactory(page?: number, size?: number) {
    return {
      skip: (page && size) ? ((page - 1) * size) : undefined,
      take: (page && size) ? size : undefined,
    };
  }

  public async truncate() {
    await this.$transaction(async(tx) => {
      await tx.order.deleteMany();
      await tx.budget.deleteMany();
      await tx.budgetItem.deleteMany();
      await tx.account.deleteMany();
      await tx.role.deleteMany();
      await tx.admin.deleteMany();
      await tx.company.deleteMany();
      await tx.client.deleteMany();
      await tx.supplier.deleteMany();
      await tx.address.deleteMany();
      await tx.contact.deleteMany();
      await tx.license.deleteMany();
      await tx.attachment.deleteMany();
      await tx.item.deleteMany();
      await tx.owner.deleteMany();
      await tx.shipper.deleteMany();
      await tx.provider.deleteMany();
      await tx.seller.deleteMany();
      await tx.product.deleteMany();
      await tx.productStockMovement.deleteMany();
      await tx.serviceCategory.deleteMany();
      await tx.service.deleteMany();
      await tx.serviceProduct.deleteMany();
    });
  }
}
