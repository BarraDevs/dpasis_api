import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CompanyDto } from 'src/app/company/application/dtos/company.dto';
import { ICompanyDao } from 'src/app/company/application/persistence/dao/company-dao.interface';
import { FindAllCompanyQueryDto } from 'src/app/company/application/usecases/find-all-company/dtos/find-all-company.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class CompanyDaoAdapterPrisma implements ICompanyDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllCompanyQueryDto): Promise<[CompanyDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.CompanyWhereInput = {
      AND: [
        { name: queries.name ? { contains: queries.name, mode: 'insensitive' } : undefined },
        { fantasyName: queries.fantasyName ? { contains: queries.fantasyName, mode: 'insensitive' } : undefined },
        { document: queries.document ? { contains: queries.document, mode: 'insensitive' } : undefined },
        { ie: queries.ie ? { contains: queries.ie, mode: 'insensitive' } : undefined },
        // { active: queries.active !== undefined ? queries.active : undefined },
        { OR:
          [
            { phone01: queries.phone ? { contains: queries.phone, mode: 'insensitive' } : undefined },
            { phone02: queries.phone ? { contains: queries.phone, mode: 'insensitive' } : undefined },
            { cellphone: queries.phone ? { contains: queries.phone, mode: 'insensitive' } : undefined },
          ],
        },
        { OR:
          [
            { email01: queries.email ? { contains: queries.email, mode: 'insensitive' } : undefined },
            { email02: queries.email ? { contains: queries.email, mode: 'insensitive' } : undefined },
          ],
        },
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
      this.prisma.company.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.company.count({ where }),
    ]);
  }

  public async findById(id: string): Promise<CompanyDto | null> {
    return this.prisma.company.findUnique({
      where: { id },
    });
  }

  public async findByDocument(document: string): Promise<CompanyDto | null> {
    return this.prisma.company.findUnique({
      where: { document },
    });
  }

  public async findByIe(ie: string): Promise<CompanyDto | null> {
    return this.prisma.company.findUnique({
      where: { ie },
    });
  }
}
