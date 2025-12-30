import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ServiceCategoryDto } from 'src/app/service-category/application/dtos/service-category.dto';
import { IServiceCategoryDao } from 'src/app/service-category/application/persistence/dao/service-category-dao.interface';
import { CreateServiceCategoryInputDto } from 'src/app/service-category/application/usecases/create-service-category/dtos/create-service-category.dto';
import { EditServiceCategoryInputDto } from 'src/app/service-category/application/usecases/edit-service-category/dtos/edit-service-category.dto';
import { FindAllServiceCategoryQueryDto } from 'src/app/service-category/application/usecases/find-all-service-category/dtos/find-all-service-category.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ServiceCategoryDaoAdapterPrisma implements IServiceCategoryDao {
  constructor(private readonly prisma: PrismaService) {}

  public async save(data: CreateServiceCategoryInputDto): Promise<string> {
    const result = await this.prisma.serviceCategory.create({
      data,
    });

    return result.id;
  }

  public async findAll(queries: FindAllServiceCategoryQueryDto): Promise<[ServiceCategoryDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.ServiceCategoryWhereInput = {
      AND: [
        {
          OR: [
            { name: { contains: queries.search, mode: 'insensitive' } },
          ],
        },
      ],
    };

    return this.prisma.$transaction([
      this.prisma.serviceCategory.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { name: 'asc' },
      }),
      this.prisma.serviceCategory.count({ where }),
    ]);
  }

  public async findById(id: string): Promise<ServiceCategoryDto | null> {
    return this.prisma.serviceCategory.findUnique({
      where: { id },
    });
  }

  public async findByName(name: string): Promise<ServiceCategoryDto | null> {
    return this.prisma.serviceCategory.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
  }

  public async edit(id: string, data: EditServiceCategoryInputDto): Promise<void> {
    await this.prisma.serviceCategory.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.serviceCategory.delete({
      where: { id },
    });
  }

  public async updateStatus(id: string, active: true): Promise<void> {
    await this.prisma.serviceCategory.update({
      where: { id },
      data: { active },
    });
  }
}
