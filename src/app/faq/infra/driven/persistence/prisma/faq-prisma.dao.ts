import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FaqDto } from 'src/app/faq/application/dtos/faq.dto';
import { IFaqDao } from 'src/app/faq/application/persistence/dao/faq-dao.interface';
import { CreateFaqInputDto } from 'src/app/faq/application/usecases/create-faq/dtos/create-faq.dto';
import { EditFaqInputDto } from 'src/app/faq/application/usecases/edit-faq/dtos/edit-faq.dto';
import { FindAllFaqQueryDto } from 'src/app/faq/application/usecases/find-all-faq/dtos/find-all-faq.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const FaqSelect = {
  id: true,
  question: true,
  answer: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FaqSelect;

@Injectable()
export class FaqDaoAdapterPrisma implements IFaqDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllFaqQueryDto): Promise<[FaqDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.FaqWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        OR: [
          { question: { contains: queries.search.trim(), mode: 'insensitive' } },
          { answer: { contains: queries.search.trim(), mode: 'insensitive' } },
        ],
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.FaqWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [faqs, total] = await this.prisma.$transaction([
      this.prisma.faq.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: FaqSelect,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.faq.count({ where }),
    ]);

    return [faqs, total];
  }

  public async findById(id: number): Promise<FaqDto | null> {
    return this.prisma.faq.findUnique({
      where: { id },
      select: FaqSelect,
    });
  }

  public async save(data: CreateFaqInputDto): Promise<number> {
    const result = await this.prisma.faq.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditFaqInputDto): Promise<void> {
    await this.prisma.faq.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.faq.delete({
      where: { id },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.faq.update({
      where: { id },
      data: { active },
    });
  }
}
