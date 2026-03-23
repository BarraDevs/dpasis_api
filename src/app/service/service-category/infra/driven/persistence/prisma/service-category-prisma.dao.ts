import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ServiceCategoryDto } from 'src/app/service/service-category/application/dtos/service-category.dto';
import { IServiceCategoryDao } from 'src/app/service/service-category/application/persistence/dao/service-category-dao.interface';
import { CreateServiceCategoryInputDto } from 'src/app/service/service-category/application/usecases/create-service-category/dtos/create-service-category.dto';
import { EditServiceCategoryInputDto } from 'src/app/service/service-category/application/usecases/edit-service-category/dtos/edit-service-category.dto';
import { FindAllServiceCategoryQueryDto } from 'src/app/service/service-category/application/usecases/find-all-service-category/dtos/find-all-service-category.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ServiceCategorySelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceCategorySelect;

@Injectable()
export class ServiceCategoryDaoAdapterPrisma implements IServiceCategoryDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllServiceCategoryQueryDto): Promise<[ServiceCategoryDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ServiceCategoryWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        name: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ServiceCategoryWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [serviceCategories, total] = await this.prisma.$transaction([
      this.prisma.serviceCategory.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ServiceCategorySelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.serviceCategory.count({ where }),
    ]);

    return [serviceCategories, total];
  }

  public async findById(id: number): Promise<ServiceCategoryDto | null> {
    return this.prisma.serviceCategory.findUnique({
      where: { id },
      select: ServiceCategorySelect,
    });
  }

  public async findByName(name: string): Promise<ServiceCategoryDto | null> {
    return this.prisma.serviceCategory.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: ServiceCategorySelect,
    });
  }

  public async save(data: CreateServiceCategoryInputDto): Promise<number> {
    const result = await this.prisma.serviceCategory.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditServiceCategoryInputDto): Promise<void> {
    await this.prisma.serviceCategory.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.serviceCategory.delete({
      where: { id },
    });
  }

  public async countServicesByCategoryId(categoryId: number): Promise<number> {
    return this.prisma.service.count({
      where: { serviceCategoryId: categoryId },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.serviceCategory.update({
      where: { id },
      data: { active },
    });
  }
}
