import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientAttendanceTypeDto } from 'src/app/client/client-type/client-attendance-type/application/dtos/client-attendance-type.dto';
import { IClientAttendanceTypeDao } from 'src/app/client/client-type/client-attendance-type/application/persistence/dao/client-attendance-type-dao.interface';
import { CreateClientAttendanceTypeInputDto } from 'src/app/client/client-type/client-attendance-type/application/usecases/create-client-attendance-type/dtos/create-client-attendance-type.dto';
import { EditClientAttendanceTypeInputDto } from 'src/app/client/client-type/client-attendance-type/application/usecases/edit-client-attendance-type/dtos/edit-client-attendance-type.dto';
import { FindAllClientAttendanceTypeQueryDto } from 'src/app/client/client-type/client-attendance-type/application/usecases/find-all-client-attendance-type/dtos/find-all-client-attendance-type.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientAttendanceTypeSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientAttendanceTypeSelect;

@Injectable()
export class ClientAttendanceTypeDaoAdapterPrisma implements IClientAttendanceTypeDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllClientAttendanceTypeQueryDto): Promise<[ClientAttendanceTypeDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ClientAttendanceTypeWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        name: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ClientAttendanceTypeWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [clientAttendanceTypes, total] = await this.prisma.$transaction([
      this.prisma.clientAttendanceType.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ClientAttendanceTypeSelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.clientAttendanceType.count({ where }),
    ]);

    return [clientAttendanceTypes, total];
  }

  public async findById(id: number): Promise<ClientAttendanceTypeDto | null> {
    return this.prisma.clientAttendanceType.findUnique({
      where: { id },
      select: ClientAttendanceTypeSelect,
    });
  }

  public async findByName(name: string): Promise<ClientAttendanceTypeDto | null> {
    return this.prisma.clientAttendanceType.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: ClientAttendanceTypeSelect,
    });
  }

  public async save(data: CreateClientAttendanceTypeInputDto): Promise<number> {
    const result = await this.prisma.clientAttendanceType.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditClientAttendanceTypeInputDto): Promise<void> {
    await this.prisma.clientAttendanceType.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.clientAttendanceType.delete({
      where: { id },
    });
  }

  public async countClientTypesByAttendanceTypeId(attendanceTypeId: number): Promise<number> {
    return this.prisma.clientType.count({
      where: { clientAttendanceTypeId: attendanceTypeId },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.clientAttendanceType.update({
      where: { id },
      data: { active },
    });
  }
}
