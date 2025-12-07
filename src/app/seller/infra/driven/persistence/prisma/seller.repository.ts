import { Injectable } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { ISellerRepository } from 'src/app/seller/application/persistence/repository/seller-repository.interface';
import { Seller } from 'src/app/seller/domain/entities/seller.entity';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class SellerRepositoryAdapterPrisma implements ISellerRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findById(id: string): Promise<Seller | null> {
    const sellerRecord = await this.prisma.seller.findUnique({
      where: { id },
      include: {
        companies: true,
        role: {
          include: {
            account: true,
          },
        },
      },
    });

    if (!sellerRecord) {
      return null;
    }

    return Seller.load({
      ...sellerRecord,
      email: sellerRecord.role.account.email,
      companyIds: sellerRecord.companies.map((company) => company.id),
    });
  }

  public async save(seller: Seller, passwordHash: string): Promise<void> {
    const { companyIds, email, ...data } = seller.props;

    await this.prisma.seller.create({
      data: {
        ...data,
        companies: {
          connect: companyIds.map((companyId) => ({ id: companyId })),
        },
        role: {
          create: {
            role: AccountRole.SELLER,
            account: {
              create: {
                email,
                password: passwordHash,
                status: AccountStatus.ACTIVE,
              },
            },
          },
        },
      },
    });
  }

  public async edit(seller: Seller): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, companyIds, updatedAt, email, ...data } = seller.props;

    const sellerRecord = await this.prisma.seller.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });

    await this.prisma.$transaction([
      this.prisma.seller.update({
        where: { id },
        data: {
          ...data,
          companies: {
            set: companyIds.map((companyId) => ({ id: companyId })),
          },
        },
      }),
      this.prisma.account.update({
        where: {
          id: sellerRecord?.role.accountId,
        },
        data: {
          email,
        },
      }),
    ]);
  }
}
