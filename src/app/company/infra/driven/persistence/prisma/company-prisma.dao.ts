import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CompanyDto } from 'src/app/company/application/dtos/company.dto';
import { ICompanyDao } from 'src/app/company/application/persistence/dao/company-dao.interface';
import { FindAllCompanyQueryDto } from 'src/app/company/application/usecases/find-all-company/dtos/find-all-company.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const CompanySelect = {
  id: true,
  name: true,
  fantasyName: true,
  document: true,
  ie: true,
  active: true,
  zipCode: true,
  street: true,
  number: true,
  complement: true,
  neighborhood: true,
  city: true,
  state: true,
  phone01: true,
  phone02: true,
  cellphone: true,
  email01: true,
  email02: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CompanySelect;

@Injectable()
export class CompanyDaoAdapterPrisma implements ICompanyDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllCompanyQueryDto): Promise<[CompanyDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.CompanyWhereInput = queries.search?.trim()
      ? {
        OR: [
          { name: { contains: queries.search, mode: 'insensitive' } },
          { fantasyName: { contains: queries.search, mode: 'insensitive' } },
          { document: { contains: queries.search, mode: 'insensitive' } },
        ],
      }
      : {};

    return this.prisma.$transaction([
      this.prisma.company.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        select: CompanySelect,
        orderBy: { id: 'asc' },
      }),
      this.prisma.company.count({ where }),
    ]);
  }

  public async findById(id: number): Promise<CompanyDto | null> {
    return this.prisma.company.findUnique({
      where: { id },
      select: CompanySelect,
    });
  }

  public async findByDocument(document: string): Promise<CompanyDto | null> {
    return this.prisma.company.findFirst({
      where: { document: { equals: document, mode: 'insensitive' } },
      select: CompanySelect,
    });
  }
}
