import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientAddressDto } from 'src/app/client/client-address/application/dtos/client-address.dto';
import { IClientAddressDao } from 'src/app/client/client-address/application/persistence/dao/client-address-dao.interface';
import { FindAllClientAddressQueryDto } from 'src/app/client/client-address/application/usecases/find-all-client-address/dtos/find-all-client-address.dto';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientAddressSelect = {
  id: true,
  clientId: true,
  type: true,
  zipCode: true,
  street: true,
  number: true,
  complement: true,
  neighborhood: true,
  city: true,
  state: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientAddressSelect;

@Injectable()
export class ClientAddressDaoAdapterPrisma implements IClientAddressDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllClientAddressQueryDto): Promise<[ClientAddressDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ClientAddressWhereInput[] = [
      { clientId: { equals: queries.clientId } },
    ];

    if (queries.type) {
      conditions.push({ type: { equals: queries.type } });
    }

    if (queries.search?.trim()) {
      conditions.push({
        OR: [
          { zipCode: { contains: queries.search.trim(), mode: 'insensitive' } },
          { street: { contains: queries.search.trim(), mode: 'insensitive' } },
          { number: { contains: queries.search.trim(), mode: 'insensitive' } },
          { complement: { contains: queries.search.trim(), mode: 'insensitive' } },
          { neighborhood: { contains: queries.search.trim(), mode: 'insensitive' } },
          { city: { contains: queries.search.trim(), mode: 'insensitive' } },
          { state: { contains: queries.search.trim(), mode: 'insensitive' } },
        ],
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ClientAddressWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    return this.prisma.$transaction([
      this.prisma.clientAddress.findMany({
        where,
        select: ClientAddressSelect,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { id: 'asc' },
      }),
      this.prisma.clientAddress.count({ where }),
    ]);
  }

  public async findById(id: number): Promise<ClientAddressDto | null> {
    return this.prisma.clientAddress.findUnique({
      where: { id },
      select: ClientAddressSelect,
    });
  }

  public async findByClientIdAndType(clientId: number, type: ClientAddressType): Promise<ClientAddressDto | null> {
    return this.prisma.clientAddress.findFirst({
      where: { clientId, type },
      select: ClientAddressSelect,
    });
  }
}
