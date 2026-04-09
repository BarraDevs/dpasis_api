import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CategoryDto } from 'src/app/service/category/application/dtos/category.dto';
import { ICategoryDao } from 'src/app/service/category/application/persistence/dao/category-dao.interface';
import { CreateCategoryInputDto } from 'src/app/service/category/application/usecases/create-category/dtos/create-category.dto';
import { EditCategoryInputDto } from 'src/app/service/category/application/usecases/edit-category/dtos/edit-category.dto';
import { FindAllCategoryQueryDto } from 'src/app/service/category/application/usecases/find-all-category/dtos/find-all-category.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const CategorySelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

@Injectable()
export class CategoryDaoAdapterPrisma implements ICategoryDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllCategoryQueryDto): Promise<[CategoryDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.CategoryWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        name: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.CategoryWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [categories, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: CategorySelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.category.count({ where }),
    ]);

    return [categories, total];
  }

  public async findById(id: number): Promise<CategoryDto | null> {
    return this.prisma.category.findUnique({
      where: { id },
      select: CategorySelect,
    });
  }

  public async findByName(name: string): Promise<CategoryDto | null> {
    return this.prisma.category.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: CategorySelect,
    });
  }

  public async save(data: CreateCategoryInputDto): Promise<number> {
    const result = await this.prisma.category.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditCategoryInputDto): Promise<void> {
    await this.prisma.category.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.category.delete({
      where: { id },
    });
  }

  public async countServicesByCategoryId(categoryId: number): Promise<number> {
    return this.prisma.service.count({
      where: { categoryId: categoryId },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.category.update({
      where: { id },
      data: { active },
    });
  }
}
