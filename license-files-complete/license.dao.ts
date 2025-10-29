TypeScript

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LicenseDto } from 'src/app/license/application/dtos/license.dto';
import { ILicenseDao } from 'src/app/license/application/persistence/dao/license-dao.interface';
import { CreateLicenseInputDto } from 'src/app/license/application/usecases/create-license/dtos/create-license.dto';
import { EditLicenseInputDto } from 'src/app/license/application/usecases/edit-license/dtos/edit-license.dto';
import { FindAllLicenseQueryDto } from 'src/app/license/application/usecases/find-all-license/dtos/find-all-license.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class LicenseDaoAdapterPrisma implements ILicenseDao {
  constructor(private prisma: PrismaService) {}

  public async save(data: CreateLicenseInputDto): Promise<string> {
    const result = await this.prisma.license.create({
      data: {
        ...data,
        // O schema espera um DateTime para billingStartDate,
        // o DTO garante que recebemos uma string Date.
        // O Prisma Client lida com a conversão da string ISO para DateTime.
        billingStartDate: data.billingStartDate,
      },
    });

    return result.id;
  }

  public async findAll(queries: FindAllLicenseQueryDto): Promise<[LicenseDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.LicenseWhereInput = {
      license: { contains: queries.search, mode: 'insensitive' }, // Buscando no campo 'license'
    };

    return this.prisma.$transaction([
      this.prisma.license.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.license.count({ where }),
    ]);
  }

  public async findById(id: string): Promise<LicenseDto | null> {
    return this.prisma.license.findUnique({
      where: { id },
    });
  }

  public async edit(id: string, data: EditLicenseInputDto): Promise<void> {
    await this.prisma.license.update({
      where: { id },
      data: {
        ...data,
        // Garantindo a conversão correta da data se ela for enviada na edição
        billingStartDate: data.billingStartDate ? data.billingStartDate : undefined,
      },
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.license.delete({
      where: { id },
    });
  }
}
6. Tratamento Global de Erros
Notei que o novo erro LicenseNotFoundError não está sendo tratado globalmente. Precisamos adicioná-lo ao http-exception.filter.ts.
