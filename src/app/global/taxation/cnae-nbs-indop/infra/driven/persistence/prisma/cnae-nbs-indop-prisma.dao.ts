import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CnaeNbsIndopDto } from 'src/app/global/taxation/cnae-nbs-indop/application/dtos/cnae-nbs-indop.dto';
import { ICnaeNbsIndopDao } from 'src/app/global/taxation/cnae-nbs-indop/application/persistence/dao/cnae-nbs-indop-dao.interface';
import { CreateCnaeNbsIndopInputDto } from 'src/app/global/taxation/cnae-nbs-indop/application/usecases/create-cnae-nbs-indop/dtos/create-cnae-nbs-indop.dto';
import { FindAllCnaeNbsIndopQueryDto } from 'src/app/global/taxation/cnae-nbs-indop/application/usecases/find-all-cnae-nbs-indop/dtos/find-all-cnae-nbs-indop.dto';
import { CnaeDto } from 'src/app/global/taxation/cnae/application/dtos/cnae.dto';
import { IndopDto } from 'src/app/global/taxation/indop/application/dtos/indop.dto';
import { NbsDto } from 'src/app/global/taxation/nbs/application/dtos/nbs.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const CnaeSelectForSelect = {
  id: true,
  code: true,
  description: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CnaeSelect;

const NbsSelectForSelect = {
  id: true,
  code: true,
  description: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NbsSelect;

const IndopSelectForSelect = {
  id: true,
  code: true,
  description: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.IndopSelect;

const CnaeNbsIndopSelect = {
  id: true,
  active: true,
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

    const conditions: Prisma.CnaeNbsIndopWhereInput[] = [];

    if (queries.cnaeId != null) {
      conditions.push({ cnaeId: { equals: queries.cnaeId } });
    }
    if (queries.nbsId != null) {
      conditions.push({ nbsId: { equals: queries.nbsId } });
    }
    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.CnaeNbsIndopWhereInput = conditions.length > 0 ? { AND: conditions } : {};

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

  public async findByComposite(cnaeId: number, nbsId: number, indopId: number): Promise<CnaeNbsIndopDto | null> {
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

  public async countClientItemsByCnaeNbsIndopId(cnaeNbsIndopId: number): Promise<number> {
    return this.prisma.clientItem.count({
      where: { cnaeNbsIndopId },
    });
  }

  public async countServicesByCnaeNbsIndopId(cnaeNbsIndopId: number): Promise<number> {
    return this.prisma.service.count({
      where: { cnaeNbsIndopId },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.cnaeNbsIndop.update({
      where: { id },
      data: { active },
    });
  }

  public async findCnaesForSelect(): Promise<CnaeDto[]> {
    return this.prisma.cnae.findMany({
      where: {
        active: true,
        cnaeNbsIndops: { some: { active: true } },
      },
      select: CnaeSelectForSelect,
      orderBy: { code: 'asc' },
    });
  }

  public async findNbssForSelectByCnaeId(cnaeId: number): Promise<NbsDto[]> {
    return this.prisma.nbs.findMany({
      where: {
        active: true,
        cnaeNbsIndops: { some: { active: true, cnaeId } },
      },
      select: NbsSelectForSelect,
      orderBy: { code: 'asc' },
    });
  }

  public async findIndopsForSelectByCnaeAndNbs(cnaeId: number, nbsId: number): Promise<IndopDto[]> {
    return this.prisma.indop.findMany({
      where: {
        active: true,
        cnaeNbsIndops: { some: { active: true, cnaeId, nbsId } },
      },
      select: IndopSelectForSelect,
      orderBy: { code: 'asc' },
    });
  }
}
