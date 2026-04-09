import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IndopDto } from 'src/app/taxation/indop/application/dtos/indop.dto';
import { IIndopDao } from 'src/app/taxation/indop/application/persistence/dao/indop-dao.interface';
import { CreateIndopInputDto } from 'src/app/taxation/indop/application/usecases/create-indop/dtos/create-indop.dto';
import { EditIndopInputDto } from 'src/app/taxation/indop/application/usecases/edit-indop/dtos/edit-indop.dto';
import { FindAllIndopQueryDto } from 'src/app/taxation/indop/application/usecases/find-all-indop/dtos/find-all-indop.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const IndopSelect = {
  id: true,
  code: true,
  description: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.IndopSelect;

@Injectable()
export class IndopDaoAdapterPrisma implements IIndopDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllIndopQueryDto): Promise<[IndopDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.IndopWhereInput[] = [];

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

    const where: Prisma.IndopWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [indops, total] = await this.prisma.$transaction([
      this.prisma.indop.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: IndopSelect,
        orderBy: { code: 'asc' },
      }),
      this.prisma.indop.count({ where }),
    ]);

    return [indops, total];
  }

  public async findById(id: number): Promise<IndopDto | null> {
    return this.prisma.indop.findUnique({
      where: { id },
      select: IndopSelect,
    });
  }

  public async findByCode(code: string): Promise<IndopDto | null> {
    return this.prisma.indop.findFirst({
      where: { code: { equals: code, mode: 'insensitive' } },
      select: IndopSelect,
    });
  }

  public async save(data: CreateIndopInputDto): Promise<number> {
    const result = await this.prisma.indop.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditIndopInputDto): Promise<void> {
    await this.prisma.indop.update({
      where: { id },
      data,
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.indop.update({
      where: { id },
      data: { active },
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.indop.delete({
      where: { id },
    });
  }

  public async countCnaeNbsIndopByIndopId(indopId: number): Promise<number> {
    return this.prisma.cnaeNbsIndop.count({
      where: { indopId },
    });
  }
}
