import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DeliveryTermDto } from 'src/app/global/delivery-term/application/dtos/delivery-term.dto';
import { IDeliveryTermDao } from 'src/app/global/delivery-term/application/persistence/dao/delivery-term-dao.interface';
import { CreateDeliveryTermInputDto } from 'src/app/global/delivery-term/application/usecases/create-delivery-term/dtos/create-delivery-term.dto';
import { EditDeliveryTermInputDto } from 'src/app/global/delivery-term/application/usecases/edit-delivery-term/dtos/edit-delivery-term.dto';
import { FindAllDeliveryTermQueryDto } from 'src/app/global/delivery-term/application/usecases/find-all-delivery-term/dtos/find-all-delivery-term.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const DeliveryTermSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DeliveryTermSelect;

@Injectable()
export class DeliveryTermDaoAdapterPrisma implements IDeliveryTermDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllDeliveryTermQueryDto): Promise<[DeliveryTermDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.DeliveryTermWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        name: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.DeliveryTermWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [deliveryTerms, total] = await this.prisma.$transaction([
      this.prisma.deliveryTerm.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        select: DeliveryTermSelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.deliveryTerm.count({ where }),
    ]);

    return [deliveryTerms, total];
  }

  public async findById(id: number): Promise<DeliveryTermDto | null> {
    return this.prisma.deliveryTerm.findUnique({
      where: { id },
      select: DeliveryTermSelect,
    });
  }

  public async findByName(name: string): Promise<DeliveryTermDto | null> {
    return this.prisma.deliveryTerm.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: DeliveryTermSelect,
    });
  }

  public async save(data: CreateDeliveryTermInputDto): Promise<number> {
    const result = await this.prisma.deliveryTerm.create({
      data,
    });

    return result.id;
  }

  public async edit(id: number, data: EditDeliveryTermInputDto): Promise<void> {
    await this.prisma.deliveryTerm.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.deliveryTerm.delete({
      where: { id },
    });
  }

  public async countServicesByDeliveryTermId(deliveryTermId: number): Promise<number> {
    return this.prisma.service.count({
      where: { deliveryTermId: deliveryTermId },
    });
  }

  public async updateStatus(id: number, active: boolean): Promise<void> {
    await this.prisma.deliveryTerm.update({
      where: { id },
      data: { active },
    });
  }
}
