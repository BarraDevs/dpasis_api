import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WarrantyDto } from 'src/app/service/warranty/application/dtos/warranty.dto';
import { IWarrantyDao } from 'src/app/service/warranty/application/persistence/dao/warranty-dao.interface';
import { CreateWarrantyInputDto } from 'src/app/service/warranty/application/usecases/create-warranty/dtos/create-warranty.dto';
import { EditWarrantyInputDto } from 'src/app/service/warranty/application/usecases/edit-warranty/dtos/edit-warranty.dto';
import { FindAllWarrantyQueryDto } from 'src/app/service/warranty/application/usecases/find-all-warranty/dtos/find-all-warranty.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const WarrantySelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.WarrantySelect;

@Injectable()
export class WarrantyDaoAdapterPrisma implements IWarrantyDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllWarrantyQueryDto): Promise<[WarrantyDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.WarrantyWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        name: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.WarrantyWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.warranty.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: WarrantySelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.warranty.count({ where }),
    ]);

    return [rows, total];
  }

  public async findById(id: number): Promise<WarrantyDto | null> {
    return this.prisma.warranty.findUnique({
      where: { id },
      select: WarrantySelect,
    });
  }

  public async findByName(name: string): Promise<WarrantyDto | null> {
    return this.prisma.warranty.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: WarrantySelect,
    });
  }

  public async save(data: CreateWarrantyInputDto): Promise<number> {
    const result = await this.prisma.warranty.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditWarrantyInputDto): Promise<void> {
    await this.prisma.warranty.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.warranty.delete({
      where: { id },
    });
  }

  public async countServicesByWarrantyId(warrantyId: number): Promise<number> {
    return this.prisma.service.count({
      where: { warrantyId: warrantyId },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.warranty.update({
      where: { id },
      data: { active },
    });
  }
}
