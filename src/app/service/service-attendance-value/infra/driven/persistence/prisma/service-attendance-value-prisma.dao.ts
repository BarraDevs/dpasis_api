import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ServiceAttendanceValueDto } from 'src/app/service/service-attendance-value/application/dtos/service-attendance-value.dto';
import { IServiceAttendanceValueDao } from 'src/app/service/service-attendance-value/application/persistence/dao/service-attendance-value-dao.interface';
import { FindAllServiceAttendanceValueQueryDto } from 'src/app/service/service-attendance-value/application/usecases/find-all-service-attendance-value/dtos/find-all-service-attendance-value.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ServiceAttendanceValueSelect = {
  id: true,
  serviceId: true,
  values: true,
  totalValueInCents: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceAttendanceValueSelect;

type ServiceAttendanceValueRow = Prisma.ServiceAttendanceValueGetPayload<{
  select: typeof ServiceAttendanceValueSelect;
}>;

@Injectable()
export class ServiceAttendanceValueDaoAdapterPrisma implements IServiceAttendanceValueDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllServiceAttendanceValueQueryDto): Promise<[ServiceAttendanceValueDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ServiceAttendanceValueWhereInput[] = [
      { serviceId: { equals: queries.serviceId } },
    ];

    const where: Prisma.ServiceAttendanceValueWhereInput = { AND: conditions };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.serviceAttendanceValue.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ServiceAttendanceValueSelect,
        orderBy: { id: 'asc' },
      }),
      this.prisma.serviceAttendanceValue.count({ where }),
    ]);

    return [rows.map(this.toDto), total];
  }

  public async findById(id: number): Promise<ServiceAttendanceValueDto | null> {
    const row = await this.prisma.serviceAttendanceValue.findUnique({
      where: { id },
      select: ServiceAttendanceValueSelect,
    });
    return row ? this.toDto(row) : null;
  }

  private toDto(row: ServiceAttendanceValueRow): ServiceAttendanceValueDto {
    return {
      ...row,
      values: row.values as Record<string, number>,
    };
  }
}
