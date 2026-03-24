import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IServiceAttendanceValueRepository } from 'src/app/service/service-attendance-value/application/persistence/repository/service-attendance-value-repository.interface';
import { ServiceAttendanceValue } from 'src/app/service/service-attendance-value/domain/entities/service-attendance-value.entity';
import { ServiceAttendanceValueFactory } from 'src/app/service/service-attendance-value/domain/factories/service-attendance-value.factory';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ServiceAttendanceValueRepositoryAdapterPrisma implements IServiceAttendanceValueRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: ServiceAttendanceValue): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...props } = entity.props;

    const created = await this.prisma.serviceAttendanceValue.create({
      data: {
        serviceId: props.serviceId,
        values: props.values as Prisma.InputJsonValue,
        totalValueInCents: props.totalValueInCents,
      },
    });
    return created.id;
  }

  public async edit(entity: ServiceAttendanceValue): Promise<void> {
    const { id, ...props } = entity.props;

    await this.prisma.serviceAttendanceValue.update({
      where: { id: id! },
      data: {
        values: props.values as Prisma.InputJsonValue,
        totalValueInCents: props.totalValueInCents,
      },
    });
  }

  public async findById(id: number): Promise<ServiceAttendanceValue | null> {
    const data = await this.prisma.serviceAttendanceValue.findUnique({
      where: { id },
    });
    if (!data) return null;

    return ServiceAttendanceValueFactory.load({
      id: data.id,
      serviceId: data.serviceId,
      values: data.values,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.serviceAttendanceValue.delete({
      where: { id },
    });
  }
}
