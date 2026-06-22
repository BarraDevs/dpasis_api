import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CarrierDto } from 'src/app/carrier/application/dtos/carrier.dto';
import { ICarrierDao } from 'src/app/carrier/application/persistence/dao/carrier-dao.interface';
import { FindAllCarrierQueryDto } from 'src/app/carrier/application/usecases/find-all-carrier/dtos/find-all-carrier.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const CarrierSelect = {
  id: true,
  name: true,
  fantasyName: true,
  representative: true,
  document: true,
  contact: true,
  active: true,
  zipCode: true,
  street: true,
  number: true,
  complement: true,
  neighborhood: true,
  city: true,
  state: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CarrierSelect;

@Injectable()
export class CarrierDaoAdapterPrisma implements ICarrierDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllCarrierQueryDto): Promise<[CarrierDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.CarrierWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        OR: [
          { name: { contains: queries.search.trim(), mode: 'insensitive' } },
          { fantasyName: { contains: queries.search.trim(), mode: 'insensitive' } },
          { document: { contains: queries.search.trim(), mode: 'insensitive' } },
          { representative: { contains: queries.search.trim(), mode: 'insensitive' } },
        ],
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.CarrierWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    return this.prisma.$transaction([
      this.prisma.carrier.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        select: CarrierSelect,
        orderBy: { id: 'asc' },
      }),
      this.prisma.carrier.count({ where }),
    ]);
  }

  public async findById(id: number): Promise<CarrierDto | null> {
    return this.prisma.carrier.findUnique({
      where: { id },
      select: CarrierSelect,
    });
  }

  public async findByDocument(document: string): Promise<CarrierDto | null> {
    return this.prisma.carrier.findFirst({
      where: { document: { equals: document, mode: 'insensitive' } },
      select: CarrierSelect,
    });
  }
}
