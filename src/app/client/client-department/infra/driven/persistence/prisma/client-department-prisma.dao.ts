import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientDepartmentDto } from 'src/app/client/client-department/application/dtos/client-department.dto';
import { IClientDepartmentDao } from 'src/app/client/client-department/application/persistence/dao/client-department-dao.interface';
import { CreateClientDepartmentInputDto } from 'src/app/client/client-department/application/usecases/create-client-department/dtos/create-client-department.dto';
import { EditClientDepartmentInputDto } from 'src/app/client/client-department/application/usecases/edit-client-department/dtos/edit-client-department.dto';
import { FindAllClientDepartmentQueryDto } from 'src/app/client/client-department/application/usecases/find-all-client-department/dtos/find-all-client-department.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientDepartmentSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientDepartmentSelect;

@Injectable()
export class ClientDepartmentDaoAdapterPrisma implements IClientDepartmentDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllClientDepartmentQueryDto): Promise<[ClientDepartmentDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.ClientDepartmentWhereInput = queries.search
      ? { name: { contains: queries.search, mode: 'insensitive' } }
      : {};

    const [clientDepartments, total] = await this.prisma.$transaction([
      this.prisma.clientDepartment.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ClientDepartmentSelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.clientDepartment.count({ where }),
    ]);

    return [clientDepartments, total];
  }

  public async findById(id: number): Promise<ClientDepartmentDto | null> {
    return this.prisma.clientDepartment.findUnique({
      where: { id },
      select: ClientDepartmentSelect,
    });
  }

  public async findByName(name: string): Promise<ClientDepartmentDto | null> {
    return this.prisma.clientDepartment.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: ClientDepartmentSelect,
    });
  }

  public async save(data: CreateClientDepartmentInputDto): Promise<number> {
    const result = await this.prisma.clientDepartment.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditClientDepartmentInputDto): Promise<void> {
    await this.prisma.clientDepartment.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.clientDepartment.delete({
      where: { id },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.clientDepartment.update({
      where: { id },
      data: { active },
    });
  }

  public async countContactsByDepartmentId(departmentId: number): Promise<number> {
    return this.prisma.clientContact.count({
      where: { departmentId },
    });
  }
}
