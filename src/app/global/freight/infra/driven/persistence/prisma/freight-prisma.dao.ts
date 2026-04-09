import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FreightDto } from 'src/app/global/freight/application/dtos/freight.dto';
import { IFreightDao } from 'src/app/global/freight/application/persistence/dao/freight-dao.interface';
import { CreateFreightInputDto } from 'src/app/global/freight/application/usecases/create-freight/dtos/create-freight.dto';
import { EditFreightInputDto } from 'src/app/global/freight/application/usecases/edit-freight/dtos/edit-freight.dto';
import { FindAllFreightQueryDto } from 'src/app/global/freight/application/usecases/find-all-freight/dtos/find-all-freight.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const FreightSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FreightSelect;

@Injectable()
export class FreightDaoAdapterPrisma implements IFreightDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllFreightQueryDto): Promise<[FreightDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.FreightWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        name: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.FreightWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [freights, total] = await this.prisma.$transaction([
      this.prisma.freight.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: FreightSelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.freight.count({ where }),
    ]);

    return [freights, total];
  }

  public async findById(id: number): Promise<FreightDto | null> {
    return this.prisma.freight.findUnique({
      where: { id },
      select: FreightSelect,
    });
  }

  public async findByName(name: string): Promise<FreightDto | null> {
    return this.prisma.freight.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: FreightSelect,
    });
  }

  public async save(data: CreateFreightInputDto): Promise<number> {
    const result = await this.prisma.freight.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditFreightInputDto): Promise<void> {
    await this.prisma.freight.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.freight.delete({
      where: { id },
    });
  }

  public async countServicesByFreightId(freightId: number): Promise<number> {
    return this.prisma.service.count({
      where: { freightId: freightId },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.freight.update({
      where: { id },
      data: { active },
    });
  }
}
