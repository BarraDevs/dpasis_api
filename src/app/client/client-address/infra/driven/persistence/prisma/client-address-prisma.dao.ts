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

    const andConditions: Prisma.ClientAddressWhereInput[] = [
      { clientId: { equals: queries.clientId } },
    ];

    if (queries.type) {
      andConditions.push({ type: { equals: queries.type } });
    }

    if (queries.search?.trim()) {
      andConditions.push({
        OR: [
          { zipCode: { contains: queries.search, mode: 'insensitive' } },
          { street: { contains: queries.search, mode: 'insensitive' } },
          { number: { contains: queries.search, mode: 'insensitive' } },
          { complement: { contains: queries.search, mode: 'insensitive' } },
          { neighborhood: { contains: queries.search, mode: 'insensitive' } },
          { city: { contains: queries.search, mode: 'insensitive' } },
          { state: { contains: queries.search, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.ClientAddressWhereInput = {
      AND: andConditions,
    };

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
