import { Injectable } from '@nestjs/common';
import { ICompanyRepository } from 'src/app/company/application/persistence/repository/company-repository.interface';
import { Company } from 'src/app/company/domain/entities/company.entity';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class CompanyRepositoryAdapterPrisma implements ICompanyRepository {
  constructor(private prisma: PrismaService) {}

  public async save(company: Company): Promise<void> {
    await this.prisma.company.create({
      data: company.props,
    });
  }

  public async edit(company: Company): Promise<void> {
    const { id, ...data } = company.props;

    await this.prisma.company.update({
      where: { id },
      data,
    });
  }
}
