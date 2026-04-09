import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NbsDto } from 'src/app/taxation/nbs/application/dtos/nbs.dto';
import { INbsDao } from 'src/app/taxation/nbs/application/persistence/dao/nbs-dao.interface';
import { CreateNbsInputDto } from 'src/app/taxation/nbs/application/usecases/create-nbs/dtos/create-nbs.dto';
import { EditNbsInputDto } from 'src/app/taxation/nbs/application/usecases/edit-nbs/dtos/edit-nbs.dto';
import { FindAllNbsQueryDto } from 'src/app/taxation/nbs/application/usecases/find-all-nbs/dtos/find-all-nbs.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const NbsSelect = {
  id: true,
  code: true,
  description: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NbsSelect;

@Injectable()
export class NbsDaoAdapterPrisma implements INbsDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllNbsQueryDto): Promise<[NbsDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.NbsWhereInput[] = [];

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

    const where: Prisma.NbsWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [nbss, total] = await this.prisma.$transaction([
      this.prisma.nbs.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: NbsSelect,
        orderBy: { code: 'asc' },
      }),
      this.prisma.nbs.count({ where }),
    ]);

    return [nbss, total];
  }

  public async findById(id: number): Promise<NbsDto | null> {
    return this.prisma.nbs.findUnique({
      where: { id },
      select: NbsSelect,
    });
  }

  public async findByCode(code: string): Promise<NbsDto | null> {
    return this.prisma.nbs.findFirst({
      where: { code: { equals: code, mode: 'insensitive' } },
      select: NbsSelect,
    });
  }

  public async save(data: CreateNbsInputDto): Promise<number> {
    const result = await this.prisma.nbs.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditNbsInputDto): Promise<void> {
    await this.prisma.nbs.update({
      where: { id },
      data,
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.nbs.update({
      where: { id },
      data: { active },
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.nbs.delete({
      where: { id },
    });
  }

  public async countCnaeNbsIndopByNbsId(nbsId: number): Promise<number> {
    return this.prisma.cnaeNbsIndop.count({
      where: { nbsId },
    });
  }
}
