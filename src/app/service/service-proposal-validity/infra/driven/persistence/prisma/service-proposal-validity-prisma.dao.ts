import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ServiceProposalValidityDto } from 'src/app/service/service-proposal-validity/application/dtos/service-proposal-validity.dto';
import { IServiceProposalValidityDao } from 'src/app/service/service-proposal-validity/application/persistence/dao/service-proposal-validity-dao.interface';
import { CreateServiceProposalValidityInputDto } from 'src/app/service/service-proposal-validity/application/usecases/create-service-proposal-validity/dtos/create-service-proposal-validity.dto';
import { EditServiceProposalValidityInputDto } from 'src/app/service/service-proposal-validity/application/usecases/edit-service-proposal-validity/dtos/edit-service-proposal-validity.dto';
import { FindAllServiceProposalValidityQueryDto } from 'src/app/service/service-proposal-validity/application/usecases/find-all-service-proposal-validity/dtos/find-all-service-proposal-validity.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ServiceProposalValiditySelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceProposalValiditySelect;

@Injectable()
export class ServiceProposalValidityDaoAdapterPrisma implements IServiceProposalValidityDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllServiceProposalValidityQueryDto): Promise<[ServiceProposalValidityDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ServiceProposalValidityWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        name: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ServiceProposalValidityWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [serviceProposalValidities, total] = await this.prisma.$transaction([
      this.prisma.serviceProposalValidity.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ServiceProposalValiditySelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.serviceProposalValidity.count({ where }),
    ]);

    return [serviceProposalValidities, total];
  }

  public async findById(id: number): Promise<ServiceProposalValidityDto | null> {
    return this.prisma.serviceProposalValidity.findUnique({
      where: { id },
      select: ServiceProposalValiditySelect,
    });
  }

  public async findByName(name: string): Promise<ServiceProposalValidityDto | null> {
    return this.prisma.serviceProposalValidity.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: ServiceProposalValiditySelect,
    });
  }

  public async save(data: CreateServiceProposalValidityInputDto): Promise<number> {
    const result = await this.prisma.serviceProposalValidity.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditServiceProposalValidityInputDto): Promise<void> {
    await this.prisma.serviceProposalValidity.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.serviceProposalValidity.delete({
      where: { id },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.serviceProposalValidity.update({
      where: { id },
      data: { active },
    });
  }
}
