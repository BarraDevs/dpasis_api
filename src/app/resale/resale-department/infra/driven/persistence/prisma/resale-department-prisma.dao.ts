import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ResaleDepartmentDto } from 'src/app/resale/resale-department/application/dtos/resale-department.dto';
import { IResaleDepartmentDao } from 'src/app/resale/resale-department/application/persistence/dao/resale-department-dao.interface';
import { CreateResaleDepartmentInputDto } from 'src/app/resale/resale-department/application/usecases/create-resale-department/dtos/create-resale-department.dto';
import { EditResaleDepartmentInputDto } from 'src/app/resale/resale-department/application/usecases/edit-resale-department/dtos/edit-resale-department.dto';
import { FindAllResaleDepartmentQueryDto } from 'src/app/resale/resale-department/application/usecases/find-all-resale-department/dtos/find-all-resale-department.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ResaleDepartmentSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ResaleDepartmentSelect;

@Injectable()
export class ResaleDepartmentDaoAdapterPrisma implements IResaleDepartmentDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllResaleDepartmentQueryDto): Promise<[ResaleDepartmentDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ResaleDepartmentWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        name: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ResaleDepartmentWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [resaleDepartments, total] = await this.prisma.$transaction([
      this.prisma.resaleDepartment.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ResaleDepartmentSelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.resaleDepartment.count({ where }),
    ]);

    return [resaleDepartments, total];
  }

  public async findById(id: number): Promise<ResaleDepartmentDto | null> {
    return this.prisma.resaleDepartment.findUnique({
      where: { id },
      select: ResaleDepartmentSelect,
    });
  }

  public async findByName(name: string): Promise<ResaleDepartmentDto | null> {
    return this.prisma.resaleDepartment.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: ResaleDepartmentSelect,
    });
  }

  public async save(data: CreateResaleDepartmentInputDto): Promise<number> {
    const result = await this.prisma.resaleDepartment.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditResaleDepartmentInputDto): Promise<void> {
    await this.prisma.resaleDepartment.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.resaleDepartment.delete({
      where: { id },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.resaleDepartment.update({
      where: { id },
      data: { active },
    });
  }

  public async countContactsByDepartmentId(departmentId: number): Promise<number> {
    return this.prisma.resaleContact.count({
      where: { departmentId },
    });
  }
}
