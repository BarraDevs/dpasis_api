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
}
