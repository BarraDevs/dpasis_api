import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { HonorificDto } from 'src/app/honorific/application/dtos/honorific.dto';
import { IHonorificDao } from 'src/app/honorific/application/persistence/dao/honorific-dao.interface';
import { CreateHonorificInputDto } from 'src/app/honorific/application/usecases/create-honorific/dtos/create-honorific.dto';
import { EditHonorificInputDto } from 'src/app/honorific/application/usecases/edit-honorific/dtos/edit-honorific.dto';
import { FindAllHonorificQueryDto } from 'src/app/honorific/application/usecases/find-all-honorific/dtos/find-all-honorific.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const HonorificSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.HonorificSelect;

@Injectable()
export class HonorificDaoAdapterPrisma implements IHonorificDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllHonorificQueryDto): Promise<[HonorificDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.HonorificWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        name: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.HonorificWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [honorifics, total] = await this.prisma.$transaction([
      this.prisma.honorific.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: HonorificSelect,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.honorific.count({ where }),
    ]);

    return [honorifics, total];
  }

  public async findById(id: number): Promise<HonorificDto | null> {
    return this.prisma.honorific.findUnique({
      where: { id },
      select: HonorificSelect,
    });
  }

  public async findByName(name: string): Promise<HonorificDto | null> {
    return this.prisma.honorific.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: HonorificSelect,
    });
  }

  public async save(data: CreateHonorificInputDto): Promise<number> {
    const result = await this.prisma.honorific.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditHonorificInputDto): Promise<void> {
    await this.prisma.honorific.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.honorific.delete({
      where: { id },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.honorific.update({
      where: { id },
      data: { active },
    });
  }

  public async countClientsById(id: number): Promise<number> {
    return this.prisma.client.count({
      where: { honorificId: id },
    });
  }
}
