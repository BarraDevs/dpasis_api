import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ServiceDto } from 'src/app/service/application/dtos/service.dto';
import { IServiceDao } from 'src/app/service/application/persistence/dao/service-dao.interface';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const serviceSelect = {
  id: true,
  name: true,
  nickname: true,
  companyId: true,
  deadline: true,
  shippingValueInCents: true,
  warrant: true,
  weight: true,
  maxVolume: true,
  dimensions: true,
  commission: true,
  valueInCents: true,
  active: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  products: {
    select: {
      product: {
        select: {
          id: true,
          description: true,
        },
      },
    },
  },
} satisfies Prisma.ServiceSelect;

@Injectable()
export class ServiceDaoAdapterPrisma implements IServiceDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findById(id: string): Promise<ServiceDto | null> {
    const service = await this.prisma.service.findUnique({
      where: { id },
      select: serviceSelect,
    });

    if (!service) {
      return null;
    }

    const { products, ...data } = service;
    return {
      ...data,
      products: products.map((product) => product.product),
    };
  }
}
