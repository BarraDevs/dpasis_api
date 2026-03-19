import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CnaeDto } from 'src/app/taxation/cnae/application/dtos/cnae.dto';
import { ICnaeDao } from 'src/app/taxation/cnae/application/persistence/dao/cnae-dao.interface';
import { CreateCnaeInputDto } from 'src/app/taxation/cnae/application/usecases/create-cnae/dtos/create-cnae.dto';
import { EditCnaeInputDto } from 'src/app/taxation/cnae/application/usecases/edit-cnae/dtos/edit-cnae.dto';
import { FindAllCnaeQueryDto } from 'src/app/taxation/cnae/application/usecases/find-all-cnae/dtos/find-all-cnae.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const CnaeSelect = {
  id: true,
  code: true,
  description: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CnaeSelect;

@Injectable()
export class CnaeDaoAdapterPrisma implements ICnaeDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllCnaeQueryDto): Promise<[CnaeDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.CnaeWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        OR: [
          { code: { contains: queries.search.trim(), mode: 'insensitive' } },
          { description: { contains: queries.search.trim(), mode: 'insensitive' } },
        ],
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.CnaeWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [cnaes, total] = await this.prisma.$transaction([
      this.prisma.cnae.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: CnaeSelect,
        orderBy: { code: 'asc' },
      }),
      this.prisma.cnae.count({ where }),
    ]);

    return [cnaes, total];
  }

  public async findById(id: number): Promise<CnaeDto | null> {
    return this.prisma.cnae.findUnique({
      where: { id },
      select: CnaeSelect,
    });
  }

  public async findByCode(code: string): Promise<CnaeDto | null> {
    return this.prisma.cnae.findFirst({
      where: { code: { equals: code, mode: 'insensitive' } },
      select: CnaeSelect,
    });
  }

  public async save(data: CreateCnaeInputDto): Promise<number> {
    const result = await this.prisma.cnae.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditCnaeInputDto): Promise<void> {
    await this.prisma.cnae.update({
      where: { id },
      data,
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.cnae.update({
      where: { id },
      data: { active },
    });
  }
}
