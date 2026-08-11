import { Injectable } from '@nestjs/common';
import { ICompanyRepository } from 'src/app/company/company/application/persistence/repository/company-repository.interface';
import { Company } from 'src/app/company/company/domain/entities/company.entity';
import { CompanyFactory } from 'src/app/company/company/domain/factories/company.factory';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class CompanyRepositoryAdapterPrisma implements ICompanyRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: Company): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...props } = entity.props;

    const created = await this.prisma.company.create({
      data: { ...props },
    });
    return created.id;
  }

  public async edit(entity: Company): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...props } = entity.props;

    await this.prisma.company.update({
      where: { id: id! },
      data: { ...props },
    });
  }

  public async findById(id: number): Promise<Company | null> {
    const data = await this.prisma.company.findUnique({
      where: { id },
    });
    if (!data) return null;

    return CompanyFactory.load({
      ...data,
      complement: data.complement ?? null,
      ie: data.ie ?? null,
      phone02: data.phone02 ?? null,
      cellphone: data.cellphone ?? null,
      email02: data.email02 ?? null,
    });
  }
}
