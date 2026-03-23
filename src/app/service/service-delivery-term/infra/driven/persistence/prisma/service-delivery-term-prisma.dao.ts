import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ServiceDeliveryTermDto } from 'src/app/service/service-delivery-term/application/dtos/service-delivery-term.dto';
import { IServiceDeliveryTermDao } from 'src/app/service/service-delivery-term/application/persistence/dao/service-delivery-term-dao.interface';
import { CreateServiceDeliveryTermInputDto } from 'src/app/service/service-delivery-term/application/usecases/create-service-delivery-term/dtos/create-service-delivery-term.dto';
import { EditServiceDeliveryTermInputDto } from 'src/app/service/service-delivery-term/application/usecases/edit-service-delivery-term/dtos/edit-service-delivery-term.dto';
import { FindAllServiceDeliveryTermQueryDto } from 'src/app/service/service-delivery-term/application/usecases/find-all-service-delivery-term/dtos/find-all-service-delivery-term.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ServiceDeliveryTermSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceDeliveryTermSelect;

@Injectable()
export class ServiceDeliveryTermDaoAdapterPrisma implements IServiceDeliveryTermDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllServiceDeliveryTermQueryDto): Promise<[ServiceDeliveryTermDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ServiceDeliveryTermWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        name: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ServiceDeliveryTermWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [serviceDeliveryTerms, total] = await this.prisma.$transaction([
      this.prisma.serviceDeliveryTerm.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ServiceDeliveryTermSelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.serviceDeliveryTerm.count({ where }),
    ]);

    return [serviceDeliveryTerms, total];
  }

  public async findById(id: number): Promise<ServiceDeliveryTermDto | null> {
    return this.prisma.serviceDeliveryTerm.findUnique({
      where: { id },
      select: ServiceDeliveryTermSelect,
    });
  }

  public async findByName(name: string): Promise<ServiceDeliveryTermDto | null> {
    return this.prisma.serviceDeliveryTerm.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: ServiceDeliveryTermSelect,
    });
  }

  public async save(data: CreateServiceDeliveryTermInputDto): Promise<number> {
    const result = await this.prisma.serviceDeliveryTerm.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditServiceDeliveryTermInputDto): Promise<void> {
    await this.prisma.serviceDeliveryTerm.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.serviceDeliveryTerm.delete({
      where: { id },
    });
  }

  public async countServicesByDeliveryTermId(deliveryTermId: number): Promise<number> {
    return this.prisma.service.count({
      where: { serviceDeliveryTermId: deliveryTermId },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.serviceDeliveryTerm.update({
      where: { id },
      data: { active },
    });
  }
}
