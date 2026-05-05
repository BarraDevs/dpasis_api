import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IVoucherDao, ResaleIdentifierDto, ResaleVoucherDto } from 'src/app/voucher/application/persistence/dao/voucher-dao.interface';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const ResaleVoucherSelect = {
  id: true,
  identifier: true,
} satisfies Prisma.ResaleSelect;

@Injectable()
export class VoucherDaoAdapterPrisma implements IVoucherDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findIndicatorResales(): Promise<ResaleIdentifierDto[]> {
    return this.prisma.resale.findMany({
      where: { manufacturerResale: true, active: true },
      select: ResaleVoucherSelect,
    });
  }

  public async updateVouchers(updates: ResaleVoucherDto[]): Promise<void> {
    await this.prisma.$transaction(
      updates.map(({ id, voucher }) =>
        this.prisma.resale.update({
          where: { id },
          data: { voucher },
        }),
      ),
    );
  }
}
