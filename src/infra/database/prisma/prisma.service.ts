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
      await tx.clientAddress.deleteMany();
      await tx.clientContact.deleteMany();
      await tx.client.deleteMany();
      await tx.account.deleteMany();
      await tx.admin.deleteMany();
      await tx.clientDepartment.deleteMany();
      await tx.clientGroup.deleteMany();
      await tx.clientOwner.deleteMany();
      await tx.faq.deleteMany();
    });
  }
}
