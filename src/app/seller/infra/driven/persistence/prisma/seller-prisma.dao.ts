import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SellerDto } from 'src/app/seller/application/dtos/seller.dto';
import { ISellerDao } from 'src/app/seller/application/persistence/dao/seller-dao.interface';
import { FindAllSellerQueryDto } from 'src/app/seller/application/usecases/find-all-seller/dtos/find-all-seller.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const SellerSelect = {
  id: true,
  name: true,
  phone: true,
  nickname: true,
  whatsapp: true,
  email: true,
  commission: true,
  profilePictureUrl: true,
  observation: true,
  zipCode: true,
  street: true,
  number: true,
  complement: true,
  neighborhood: true,
  city: true,
  state: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SellerSelect;

@Injectable()
export class SellerDaoAdapterPrisma implements ISellerDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllSellerQueryDto): Promise<[SellerDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const conditions: Prisma.SellerWhereInput[] = [];

    if (queries.search?.trim()) {
      conditions.push({
        OR: [
          { name: { contains: queries.search.trim(), mode: 'insensitive' } },
          { nickname: { contains: queries.search.trim(), mode: 'insensitive' } },
          { email: { contains: queries.search.trim(), mode: 'insensitive' } },
          { phone: { contains: queries.search.trim(), mode: 'insensitive' } },
          { whatsapp: { contains: queries.search.trim(), mode: 'insensitive' } },
        ],
      });
    }

    if (queries.active != null && queries.active !== undefined) {
      conditions.push({ active: queries.active });
    }

    const where: Prisma.SellerWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    return this.prisma.$transaction([
      this.prisma.seller.findMany({
        where,
        take: pagination.take,
        skip: pagination.skip,
        select: SellerSelect,
        orderBy: { id: 'asc' },
      }),
      this.prisma.seller.count({ where }),
    ]);
  }

  public async findById(id: number): Promise<SellerDto | null> {
    return this.prisma.seller.findUnique({
      where: { id },
      select: SellerSelect,
    });
  }

  public async findByEmail(email: string): Promise<{ id: number } | null> {
    const seller = await this.prisma.seller.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });

    return seller ? { id: seller.id } : null;
  }
}
