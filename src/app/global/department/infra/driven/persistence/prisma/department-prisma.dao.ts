import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DepartmentDto } from 'src/app/global/department/application/dtos/department.dto';
import { IDepartmentDao } from 'src/app/global/department/application/persistence/dao/department-dao.interface';
import { CreateDepartmentInputDto } from 'src/app/global/department/application/usecases/create-department/dtos/create-department.dto';
import { EditDepartmentInputDto } from 'src/app/global/department/application/usecases/edit-department/dtos/edit-department.dto';
import { FindAllDepartmentQueryDto } from 'src/app/global/department/application/usecases/find-all-department/dtos/find-all-department.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const DepartmentSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DepartmentSelect;

@Injectable()
export class DepartmentDaoAdapterPrisma implements IDepartmentDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllDepartmentQueryDto): Promise<[DepartmentDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.DepartmentWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        name: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.DepartmentWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [departments, total] = await this.prisma.$transaction([
      this.prisma.department.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: DepartmentSelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.department.count({ where }),
    ]);

    return [departments, total];
  }

  public async findById(id: number): Promise<DepartmentDto | null> {
    return this.prisma.department.findUnique({
      where: { id },
      select: DepartmentSelect,
    });
  }

  public async findByName(name: string): Promise<DepartmentDto | null> {
    return this.prisma.department.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: DepartmentSelect,
    });
  }

  public async save(data: CreateDepartmentInputDto): Promise<number> {
    const result = await this.prisma.department.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditDepartmentInputDto): Promise<void> {
    await this.prisma.department.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.department.delete({
      where: { id },
    });
  }

  public async countClientContactsByDepartmentId(departmentId: number): Promise<number> {
    return this.prisma.clientContact.count({
      where: { departmentId },
    });
  }

  public async countResaleContactsByDepartmentId(departmentId: number): Promise<number> {
    return this.prisma.resaleContact.count({
      where: { departmentId },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.department.update({
      where: { id },
      data: { active },
    });
  }
}
