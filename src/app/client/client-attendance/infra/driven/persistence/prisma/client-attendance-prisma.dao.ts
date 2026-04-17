import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientAttendanceDto } from 'src/app/client/client-attendance/application/dtos/client-attendance.dto';
import { IClientAttendanceDao } from 'src/app/client/client-attendance/application/persistence/dao/client-attendance-dao.interface';
import { CreateClientAttendanceInputDto } from 'src/app/client/client-attendance/application/usecases/create-client-attendance/dtos/create-client-attendance.dto';
import { EditClientAttendanceInputDto } from 'src/app/client/client-attendance/application/usecases/edit-client-attendance/dtos/edit-client-attendance.dto';
import { FindAllClientAttendanceQueryDto } from 'src/app/client/client-attendance/application/usecases/find-all-client-attendance/dtos/find-all-client-attendance.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientAttendanceSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientAttendanceSelect;

@Injectable()
export class ClientAttendanceDaoAdapterPrisma implements IClientAttendanceDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllClientAttendanceQueryDto): Promise<[ClientAttendanceDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ClientAttendanceWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        name: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ClientAttendanceWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [clientAttendances, total] = await this.prisma.$transaction([
      this.prisma.clientAttendance.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ClientAttendanceSelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.clientAttendance.count({ where }),
    ]);

    return [clientAttendances, total];
  }

  public async findById(id: number): Promise<ClientAttendanceDto | null> {
    return this.prisma.clientAttendance.findUnique({
      where: { id },
      select: ClientAttendanceSelect,
    });
  }

  public async findByName(name: string): Promise<ClientAttendanceDto | null> {
    return this.prisma.clientAttendance.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: ClientAttendanceSelect,
    });
  }

  public async save(data: CreateClientAttendanceInputDto): Promise<number> {
    const result = await this.prisma.clientAttendance.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditClientAttendanceInputDto): Promise<void> {
    await this.prisma.clientAttendance.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.clientAttendance.delete({
      where: { id },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.clientAttendance.update({
      where: { id },
      data: { active },
    });
  }
}
