import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CompanyDto } from 'src/app/company/application/dtos/company.dto';
import { ICompanyDao } from 'src/app/company/application/persistence/dao/company-dao.interface';
import { CreateCompanyInputDto } from 'src/app/company/application/usecases/create-company/dtos/create-company.dto';
import { EditCompanyInputDto } from 'src/app/company/application/usecases/edit-company/dtos/edit-company.dto';
import { FindAllCompanyQueryDto } from 'src/app/company/application/usecases/find-all-company/dtos/find-all-company.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class CompanyDaoAdapterPrisma implements ICompanyDao {
  constructor(private prisma: PrismaService) {}

  public async save(data: CreateCompanyInputDto): Promise<string> {
    const result = await this.prisma.company.create({
      data,
    });

    return result.id;
  }

  public async findAll(queries: FindAllCompanyQueryDto): Promise<[CompanyDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.CompanyWhereInput = {
      AND: [
        { name: queries.name ? { contains: queries.name } : undefined },
        { fantasyName: queries.fantasyName ? { contains: queries.fantasyName } : undefined },
        { document: queries.document ? { contains: queries.document } : undefined },
        { ie: queries.ie ? { contains: queries.ie } : undefined },
        { OR:
          [
            { phone01: queries.phone ? { contains: queries.phone } : undefined },
            { phone02: queries.phone ? { contains: queries.phone } : undefined },
          ],
        },
        { OR:
          [
            { email01: queries.email ? { contains: queries.email } : undefined },
            { email02: queries.email ? { contains: queries.email } : undefined },
          ],
        },
        {
          OR: [
            { zipCode: queries.address ? { contains: queries.address } : undefined },
            { street: queries.address ? { contains: queries.address } : undefined },
            { number: queries.address ? { contains: queries.address } : undefined },
            { neighborhood: queries.address ? { contains: queries.address } : undefined },
            { city: queries.address ? { contains: queries.address } : undefined },
            { state: queries.address ? { contains: queries.address } : undefined },
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

  public async edit(id: string, data: EditCompanyInputDto): Promise<void> {
    await this.prisma.company.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.company.delete({
      where: { id },
    });
  }
}
