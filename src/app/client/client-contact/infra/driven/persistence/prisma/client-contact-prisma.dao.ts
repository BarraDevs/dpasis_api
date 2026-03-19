import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientContactDto } from 'src/app/client/client-contact/application/dtos/client-contact.dto';
import { IClientContactDao } from 'src/app/client/client-contact/application/persistence/dao/client-contact-dao.interface';
import { FindAllClientContactQueryDto } from 'src/app/client/client-contact/application/usecases/find-all-client-contact/dtos/find-all-client-contact.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientContactSelect = {
  id: true,
  clientId: true,
  name: true,
  department: {
    select: {
      id: true,
      name: true,
    },
  },
  email: true,
  phone: true,
  whatsapp: true,
  observations: true,
  receiveNF: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientContactSelect;

@Injectable()
export class ClientContactDaoAdapterPrisma implements IClientContactDao {
  constructor(private readonly prisma: PrismaService) {}


  public async findAll(queries: FindAllClientContactQueryDto): Promise<[ClientContactDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ClientContactWhereInput[] = [
      { clientId: { equals: queries.clientId } },
    ];

    if (queries.search?.trim()) {
      conditions.push({
        OR: [
          { name: { contains: queries.search.trim(), mode: 'insensitive' } },
          { email: { contains: queries.search.trim(), mode: 'insensitive' } },
        ],
      });
    }

    if (queries.departmentId != null && queries.departmentId !== undefined) {
      conditions.push({ departmentId: { equals: queries.departmentId } });
    }

    if (queries.receiveNF != null && queries.receiveNF !== undefined) {
      conditions.push({ receiveNF: { equals: queries.receiveNF } });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.ClientContactWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [clientContacts, total] = await this.prisma.$transaction([
      this.prisma.clientContact.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ClientContactSelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.clientContact.count({ where }),
    ]);

    return [clientContacts, total];
  }

  public async findById(id: number): Promise<ClientContactDto | null> {
    return this.prisma.clientContact.findUnique({
      where: { id },
      select: ClientContactSelect,
    });
  }

  public async findByClientIdAndEmail(clientId: number, email: string): Promise<ClientContactDto | null> {
    return this.prisma.clientContact.findUnique({
      where: {
        // eslint-disable-next-line camelcase
        clientId_email: {
          clientId,
          email: email.toLowerCase(),
        },
      },
      select: ClientContactSelect,
    });
  }
}
