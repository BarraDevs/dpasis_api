import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProviderDto } from 'src/app/provider/application/dtos/provider.dto';
import { IProviderDao } from 'src/app/provider/application/persistence/dao/provider-dao.interface';
import { FindAllProviderQueryDto } from 'src/app/provider/application/usecases/find-all-provider/dtos/find-all-provider.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const providerSelect = {
  id: true,
  name: true,
  type: true,
  valueInCents: true,
  cnpj: true,
  ie: true,
  paymentDay: true,
  paymentExpirationDate: true,
  companyName: true,
  zipCode: true,
  street: true,
  number: true,
  complement: true,
  reference: true,
  neighborhood: true,
  city: true,
  state: true,
  email: true,
  website: true,
  active: true,
  createdAt: true,
  updatedAt: true,
  companies: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.ProviderSelect;

@Injectable()
export class ProviderDaoAdapterPrisma implements IProviderDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllProviderQueryDto): Promise<[ProviderDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.ProviderWhereInput = {
      AND: [
        { name: queries.name ? { contains: queries.name, mode: 'insensitive' } : undefined },
        { type: queries.type ? { contains: queries.type, mode: 'insensitive' } : undefined },
        { cnpj: queries.cnpj ? { contains: queries.cnpj } : undefined },
        { ie: queries.ie ? { contains: queries.ie } : undefined },
        { companyName: queries.companyName ? { contains: queries.companyName, mode: 'insensitive' } : undefined },
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
      this.prisma.provider.findMany({
        where,
        select: providerSelect,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.provider.count({ where }),
    ]);
  }

  public async findById(id: string): Promise<ProviderDto | null> {
    return this.prisma.provider.findUnique({
      where: { id },
      select: providerSelect,
    });
  }

  public async findByCnpj(cnpj: string): Promise<ProviderDto | null> {
    return this.prisma.provider.findUnique({
      where: { cnpj },
      select: providerSelect,
    });
  }
}
