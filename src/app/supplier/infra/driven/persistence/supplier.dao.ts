import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SupplierDto } from 'src/app/supplier/application/dtos/supplier.dto';
import { ISupplierDao } from 'src/app/supplier/application/persistence/dao/supplier-dao.interface';
import { FindAllSupplierQueryDto } from 'src/app/supplier/application/usecases/find-all-supplier/dtos/find-all-supplier.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class SupplierDaoAdapterPrisma implements ISupplierDao {
  constructor(private prisma: PrismaService) {}

  public async findAll(queries: FindAllSupplierQueryDto): Promise<[SupplierDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.SupplierWhereInput = {
      AND: [
        { cnpj: queries.cnpj ? { contains: queries.cnpj } : undefined },
        { ie: queries.ie ? { contains: queries.ie } : undefined },
        { group: queries.group ? { contains: queries.group, mode: 'insensitive' } : undefined },
        { type: queries.type ? { contains: queries.type, mode: 'insensitive' } : undefined },
        { companyName: queries.companyName ? { contains: queries.companyName, mode: 'insensitive' } : undefined },
        { fantasyName: queries.fantasyName ? { contains: queries.fantasyName, mode: 'insensitive' } : undefined },
        { representative: queries.representative ? { contains: queries.representative, mode: 'insensitive' } : undefined },
      ],
    };

    const [suppliers, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return [suppliers, total];
  }

  public async findById(id: string): Promise<SupplierDto | null> {
    return this.prisma.supplier.findUnique({
      where: { id },
    });
  }

  public async findByCnpj(cnpj: string): Promise<SupplierDto | null> {
    return this.prisma.supplier.findUnique({
      where: { cnpj },
    });
  }

  public async findByIe(ie: string): Promise<SupplierDto | null> {
    return this.prisma.supplier.findUnique({
      where: { ie },
    });
  }
}
