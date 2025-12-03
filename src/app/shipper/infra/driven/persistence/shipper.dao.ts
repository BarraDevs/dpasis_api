import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ShipperDto } from 'src/app/shipper/application/dtos/shipper.dto';
import { IShipperDao } from 'src/app/shipper/application/persistence/dao/shipper-dao.interface';
import { FindAllShipperQueryDto } from 'src/app/shipper/application/usecases/find-all-shipper/dtos/find-all-shipper.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const shipperSelect = {
  id: true,
  companyName: true,
  fantasyName: true,
  cnpj: true,
  contact: true,
  representative: true,
  zipCode: true,
  street: true,
  number: true,
  complement: true,
  reference: true,
  neighborhood: true,
  city: true,
  state: true,
  active: true,
  createdAt: true,
  updatedAt: true,
  companies: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.ShipperSelect;

@Injectable()
export class ShipperDaoAdapterPrisma implements IShipperDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllShipperQueryDto): Promise<[ShipperDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.ShipperWhereInput = {
      AND: [
        { companyName: queries.companyName ? { contains: queries.companyName, mode: 'insensitive' } : undefined },
        { fantasyName: queries.fantasyName ? { contains: queries.fantasyName, mode: 'insensitive' } : undefined },
        { cnpj: queries.cnpj ? { contains: queries.cnpj } : undefined },
        { contact: queries.contact ? { contains: queries.contact, mode: 'insensitive' } : undefined },
        { representative: queries.representative ? { contains: queries.representative, mode: 'insensitive' } : undefined },
        { active: queries.active !== undefined ? queries.active : undefined },
        { companies: queries.companyIds?.length ? { some: { id: { in: queries.companyIds } } } : undefined },
        {
          OR: [
            { zipCode: queries.address ? { contains: queries.address, mode: 'insensitive' } : undefined },
            { street: queries.address ? { contains: queries.address, mode: 'insensitive' } : undefined },
            { number: queries.address ? { contains: queries.address, mode: 'insensitive' } : undefined },
            { neighborhood: queries.address ? { contains: queries.address, mode: 'insensitive' } : undefined },
            { city: queries.address ? { contains: queries.address, mode: 'insensitive' } : undefined },
            { state: queries.address ? { contains: queries.address, mode: 'insensitive' } : undefined },
          ],
        },
      ],
    };

    return this.prisma.$transaction([
      this.prisma.shipper.findMany({
        where,
        select: shipperSelect,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.shipper.count({ where }),
    ]);
  }

  public async findById(id: string): Promise<ShipperDto | null> {
    return this.prisma.shipper.findUnique({
      where: { id },
      select: shipperSelect,
    });
  }

  public async findByCnpj(cnpj: string): Promise<ShipperDto | null> {
    return this.prisma.shipper.findUnique({
      where: { cnpj },
      select: shipperSelect,
    });
  }
}
