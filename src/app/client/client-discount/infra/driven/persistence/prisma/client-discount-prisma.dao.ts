import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientDiscountDto } from 'src/app/client/client-discount/application/dtos/client-discount.dto';
import { IClientDiscountDao } from 'src/app/client/client-discount/application/persistence/dao/client-discount-dao.interface';
import { FindAllClientDiscountQueryDto } from 'src/app/client/client-discount/application/usecases/find-all-client-discount/dtos/find-all-client-discount.dto';
import { DiscountType } from 'src/app/client/client-discount/domain/enums/discount-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ClientDiscountSelect = {
  id: true,
  clientId: true,
  description: true,
  type: true,
  discountValue: true,
  month: true,
  year: true,
  doNotGenerateCharge: true,
  terminateContract: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientDiscountSelect;

type ClientDiscountData = Prisma.ClientDiscountGetPayload<{
  select: typeof ClientDiscountSelect;
}>;

@Injectable()
export class ClientDiscountDaoAdapterPrisma implements IClientDiscountDao {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDto(data: ClientDiscountData): ClientDiscountDto {
    return {
      ...data,
      type: data.type as DiscountType,
    };
  }

  public async findAll(queries: FindAllClientDiscountQueryDto): Promise<[ClientDiscountDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.ClientDiscountWhereInput[] = [
      { clientId: { equals: queries.clientId } },
    ];

    if (queries.month != null) {
      conditions.push({ month: { equals: queries.month } });
    }

    if (queries.year != null) {
      conditions.push({ year: { equals: queries.year } });
    }

    if (queries.search?.trim()) {
      conditions.push({
        description: { contains: queries.search.trim(), mode: 'insensitive' },
      });
    }

    const where: Prisma.ClientDiscountWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.clientDiscount.findMany({
        where,
        select: ClientDiscountSelect,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: [{ year: 'asc' }, { month: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.clientDiscount.count({ where }),
    ]);

    return [data.map(this.mapToDto), total];
  }

  public async findById(id: number): Promise<ClientDiscountDto | null> {
    const data = await this.prisma.clientDiscount.findUnique({
      where: { id },
      select: ClientDiscountSelect,
    });
    if (!data) return null;

    return this.mapToDto(data);
  }
}
