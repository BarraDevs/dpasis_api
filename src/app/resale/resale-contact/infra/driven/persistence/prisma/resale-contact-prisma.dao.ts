import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ResaleContactDto } from 'src/app/resale/resale-contact/application/dtos/resale-contact.dto';
import { IResaleContactDao } from 'src/app/resale/resale-contact/application/persistence/dao/resale-contact-dao.interface';
import { FindAllResaleContactExecuteQuery } from 'src/app/resale/resale-contact/application/usecases/find-all-resale-contact/dtos/find-all-resale-contact.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ResaleContactSelect = {
  id: true,
  resaleId: true,
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
} satisfies Prisma.ResaleContactSelect;

@Injectable()
export class ResaleContactDaoAdapterPrisma implements IResaleContactDao {
  constructor(private readonly prisma: PrismaService) {}


  public async findAll(queries: FindAllResaleContactExecuteQuery): Promise<[ResaleContactDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ResaleContactWhereInput[] = [
      { resaleId: { equals: queries.resaleId } },
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

    const where: Prisma.ResaleContactWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [resaleContacts, total] = await this.prisma.$transaction([
      this.prisma.resaleContact.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: ResaleContactSelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.resaleContact.count({ where }),
    ]);

    return [resaleContacts, total];
  }

  public async findById(id: number): Promise<ResaleContactDto | null> {
    return this.prisma.resaleContact.findUnique({
      where: { id },
      select: ResaleContactSelect,
    });
  }

  public async findByResaleIdAndEmail(resaleId: number, email: string): Promise<ResaleContactDto | null> {
    return this.prisma.resaleContact.findUnique({
      where: {
        // eslint-disable-next-line camelcase
        resaleId_email: {
          resaleId,
          email: email.toLowerCase(),
        },
      },
      select: ResaleContactSelect,
    });
  }
}
