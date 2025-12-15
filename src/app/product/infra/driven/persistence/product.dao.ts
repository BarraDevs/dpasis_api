import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductDto } from 'src/app/product/application/dtos/product.dto';
import { IProductDao } from 'src/app/product/application/persistence/dao/product-dao.interface';
import { CreateProductInputDto } from 'src/app/product/application/usecases/create-product/dtos/create-product.dto';
import { EditProductInputDto } from 'src/app/product/application/usecases/edit-product/dtos/edit-product.dto';
import { FindAllProductQueryDto } from 'src/app/product/application/usecases/find-all-product/dtos/find-all-product.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ProductDaoAdapterPrisma implements IProductDao {
  constructor(private readonly prisma: PrismaService) {}

  public async save(data: CreateProductInputDto): Promise<string> {
    const result = await this.prisma.product.create({
      data,
    });

    return result.id;
  }

  public async findAll(queries: FindAllProductQueryDto): Promise<[ProductDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.ProductWhereInput = {
      AND: [
        {
          OR: [
            { field: { contains: queries.search } },
          ],
        },
      ],
    };

    return this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);
  }

  public async findById(id: string): Promise<ProductDto | null> {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  public async edit(id: string, data: EditProductInputDto): Promise<void> {
    await this.prisma.product.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    });
  }
}
