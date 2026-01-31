import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SellerDto } from 'src/app/seller/application/dtos/seller.dto';
import { ISellerDao } from 'src/app/seller/application/persistence/dao/seller-dao.interface';
import { FindAllSellerQueryDto } from 'src/app/seller/application/usecases/find-all-seller/dtos/find-all-seller.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const sellerSelect = {
  id: true,
  name: true,
  nickname: true,
  phone: true,
  cellphone: true,
  commission: true,
  zipCode: true,
  street: true,
  number: true,
  complement: true,
  reference: true,
  neighborhood: true,
  city: true,
  state: true,
  observation: true,
  avatarUrl: true,
  active: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: {
      account: {
        select: {
          email: true,
        },
      },
    },
  },
  companies: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.SellerSelect;

type SellerRecord = Prisma.SellerGetPayload<{ select: typeof sellerSelect }>;

function mapToDto(record: SellerRecord): SellerDto {
  return {
    id: record.id,
    name: record.name,
    nickname: record.nickname,
    phone: record.phone,
    cellphone: record.cellphone,
    email: record.role.account.email,
    commission: record.commission,
    zipCode: record.zipCode,
    street: record.street,
    number: record.number,
    complement: record.complement,
    reference: record.reference,
    neighborhood: record.neighborhood,
    city: record.city,
    state: record.state,
    observation: record.observation,
    avatarUrl: record.avatarUrl,
    active: record.active,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    companies: record.companies,
  };
}

@Injectable()
export class SellerDaoAdapterPrisma implements ISellerDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll(queries: FindAllSellerQueryDto): Promise<[SellerDto[], number]> {
    const pagination = this.prisma.paginationFactory(queries.page, queries.size);

    const where: Prisma.SellerWhereInput = {
      AND: [
        { name: queries.name ? { contains: queries.name, mode: 'insensitive' } : undefined },
        { nickname: queries.nickname ? { contains: queries.nickname, mode: 'insensitive' } : undefined },
        { role: queries.email ? { account: { email: { contains: queries.email, mode: 'insensitive' } } } : undefined },
        { phone: queries.phone ? { contains: queries.phone } : undefined },
        { cellphone: queries.cellphone ? { contains: queries.cellphone } : undefined },
        { active: queries.active !== undefined ? queries.active : undefined },
        { companies: queries.companyIds?.length ? { some: { id: { in: queries.companyIds } } } : undefined },
        {
          OR: queries.address ? [
            { zipCode: { contains: queries.address, mode: 'insensitive' } },
            { street: { contains: queries.address, mode: 'insensitive' } },
            { number: { contains: queries.address, mode: 'insensitive' } },
            { neighborhood: { contains: queries.address, mode: 'insensitive' } },
            { city: { contains: queries.address, mode: 'insensitive' } },
            { state: { contains: queries.address, mode: 'insensitive' } },
          ] : undefined,
        },
      ],
    };

    const [records, total] = await this.prisma.$transaction([
      this.prisma.seller.findMany({
        where,
        select: sellerSelect,
        take: pagination.take,
        skip: pagination.skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.seller.count({ where }),
    ]);

    return [records.map(mapToDto), total];
  }

  public async findById(id: string): Promise<SellerDto | null> {
    const record = await this.prisma.seller.findUnique({
      where: { id },
      select: sellerSelect,
    });

    return record ? mapToDto(record) : null;
  }

  public async findByEmail(email: string): Promise<SellerDto | null> {
    const record = await this.prisma.seller.findFirst({
      where: {
        role: {
          account: {
            email: { equals: email, mode: 'insensitive' },
          },
        },
      },
      select: sellerSelect,
    });

    return record ? mapToDto(record) : null;
  }
}
