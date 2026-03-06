import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CnaeNbsIndopDto } from 'src/app/taxation/cnae-nbs-indop/application/dtos/cnae-nbs-indop.dto';
import { ICnaeNbsIndopDao } from 'src/app/taxation/cnae-nbs-indop/application/persistence/dao/cnae-nbs-indop-dao.interface';
import { CreateCnaeNbsIndopInputDto } from 'src/app/taxation/cnae-nbs-indop/application/usecases/create-cnae-nbs-indop/dtos/create-cnae-nbs-indop.dto';
import { FindAllCnaeNbsIndopQueryDto } from 'src/app/taxation/cnae-nbs-indop/application/usecases/find-all-cnae-nbs-indop/dtos/find-all-cnae-nbs-indop.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const CnaeNbsIndopSelect = {
  id: true,
  cnae: {
    select: {
      id: true,
      code: true,
      description: true,
    },
  },
  nbs: {
    select: {
      id: true,
      code: true,
      description: true,
    },
  },
  indop: {
    select: {
      id: true,
      code: true,
      description: true,
    },
  },
} satisfies Prisma.CnaeNbsIndopSelect;

@Injectable()
export class CnaeNbsIndopDaoAdapterPrisma implements ICnaeNbsIndopDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllCnaeNbsIndopQueryDto): Promise<[CnaeNbsIndopDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.CnaeNbsIndopWhereInput = {};
    if (queries.cnaeId != null) {
      where.cnaeId = queries.cnaeId;
    }
    if (queries.nbsId != null) {
      where.nbsId = queries.nbsId;
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.cnaeNbsIndop.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: CnaeNbsIndopSelect,
        orderBy: [{ cnaeId: 'asc' }, { nbsId: 'asc' }, { indopId: 'asc' }],
      }),
      this.prisma.cnaeNbsIndop.count({ where }),
    ]);

    return [rows, total];
  }

  public async findById(id: number): Promise<CnaeNbsIndopDto | null> {
    const row = await this.prisma.cnaeNbsIndop.findUnique({
      where: { id },
      select: CnaeNbsIndopSelect,
    });
    return row ?? null;
  }

  public async findByComposite(
    cnaeId: number,
    nbsId: number,
    indopId: number,
  ): Promise<CnaeNbsIndopDto | null> {
    const row = await this.prisma.cnaeNbsIndop.findUnique({
      where: {
        // eslint-disable-next-line camelcase
        cnaeId_nbsId_indopId: { cnaeId, nbsId, indopId },
      },
      select: CnaeNbsIndopSelect,
    });
    return row ?? null;
  }

  public async save(data: CreateCnaeNbsIndopInputDto): Promise<number> {
    const result = await this.prisma.cnaeNbsIndop.create({
      data: {
        cnaeId: data.cnaeId,
        nbsId: data.nbsId,
        indopId: data.indopId,
      },
    });
    return result.id;
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.cnaeNbsIndop.delete({
      where: { id },
    });
  }

  public async findDistinctCnaeIds(): Promise<number[]> {
    const rows = await this.prisma.cnaeNbsIndop.findMany({
      where: {
        cnae: { active: true },
      },
      select: { cnaeId: true },
      distinct: ['cnaeId'],
      orderBy: { cnaeId: 'asc' },
    });
    return rows.map((r) => r.cnaeId);
  }

  public async findDistinctNbsIdsByCnaeId(cnaeId: number): Promise<number[]> {
    const rows = await this.prisma.cnaeNbsIndop.findMany({
      where: {
        cnaeId,
        nbs: { active: true },
      },
      select: { nbsId: true },
      distinct: ['nbsId'],
      orderBy: { nbsId: 'asc' },
    });
    return rows.map((r) => r.nbsId);
  }

  public async findDistinctIndopIdsByCnaeIdAndNbsId(
    cnaeId: number,
    nbsId: number,
  ): Promise<number[]> {
    const rows = await this.prisma.cnaeNbsIndop.findMany({
      where: {
        cnaeId,
        nbsId,
        indop: { active: true },
      },
      select: { indopId: true },
      distinct: ['indopId'],
      orderBy: { indopId: 'asc' },
    });
    return rows.map((r) => r.indopId);
  }
}
