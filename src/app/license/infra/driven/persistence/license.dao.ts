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
      data,
    });

    return result.id;
  }

  public async findAll(queries: FindAllLicenseQueryDto): Promise<[LicenseDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.LicenseWhereInput = {
      license: { contains: queries.search, mode: 'insensitive' },
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
      data,
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.license.delete({
      where: { id },
    });
  }
}
