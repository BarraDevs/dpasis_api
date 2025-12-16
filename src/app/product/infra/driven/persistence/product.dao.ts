import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductDto } from 'src/app/product/application/dtos/product.dto';
import { IProductDao } from 'src/app/product/application/persistence/dao/product-dao.interface';
import { FindAllProductQueryDto } from 'src/app/product/application/usecases/find-all-product/dtos/find-all-product.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const productSelect = {
  id: true,
  companyId: true,
  type: true,
  group01: true,
  group02: true,
  description: true,
  complement: true,
  manufacturerCode: true,
  brand: true,
  measureUnit: true,
  ncm: true,
  economicBatch: true,
  minimumStock: true,
  maximumStock: true,
  currentStock: true,
  warrantyDays: true,
  weightInKg: true,
  heightInCm: true,
  lengthInCm: true,
  widthInCm: true,
  markup: true,
  marginB: true,
  currency: true,
  exchangeRate: true,
  unitCostInCents: true,
  unitPriceInCents: true,
  ean: true,
  additionalInfo: true,
  images: true,
  createdAt: true,
  updatedAt: true,
  suppliers: {
    select: {
      id: true,
      companyName: true,
      fantasyName: true,
    },
  },
} satisfies Prisma.ProductSelect;

@Injectable()
export class ProductDaoAdapterPrisma implements IProductDao {
  constructor(private prisma: PrismaService) {}

  public async findAll(queries: FindAllProductQueryDto): Promise<[ProductDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.ProductWhereInput = {
      AND: [
        { companyId: queries.companyId ? { equals: queries.companyId, mode: 'insensitive' } : undefined },
        { type: queries.type ? { contains: queries.type, mode: 'insensitive' } : undefined },
        { group01: queries.group01 ? { contains: queries.group01, mode: 'insensitive' } : undefined },
        { group02: queries.group02 ? { contains: queries.group02, mode: 'insensitive' } : undefined },
        { description: queries.description ? { contains: queries.description, mode: 'insensitive' } : undefined },
        { manufacturerCode: queries.manufacturerCode ? { contains: queries.manufacturerCode, mode: 'insensitive' } : undefined },
        { brand: queries.brand ? { contains: queries.brand, mode: 'insensitive' } : undefined },
        { ncm: queries.ncm ? { contains: queries.ncm, mode: 'insensitive' } : undefined },
        { ean: queries.ean ? { contains: queries.ean, mode: 'insensitive' } : undefined },
      ],
    };

    return this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        select: productSelect,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { description: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);
  }

  public async findById(id: string): Promise<ProductDto | null> {
    return this.prisma.product.findUnique({
      where: { id },
      select: productSelect,
    });
  }

  public async findByEan(ean: string, companyId: string): Promise<ProductDto | null> {
    return this.prisma.product.findFirst({
      where: { ean, companyId },
      select: productSelect,
    });
  }
}
