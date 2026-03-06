import { Injectable } from '@nestjs/common';
import { IClientDiscountRepository } from 'src/app/client/client-discount/application/persistence/repository/client-discount-repository.interface';
import { ClientDiscount } from 'src/app/client/client-discount/domain/entities/client-discount.entity';
import { DiscountType } from 'src/app/client/client-discount/domain/enums/discount-type.enum';
import { ClientDiscountFactory } from 'src/app/client/client-discount/domain/factories/client-discount.factory';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ClientDiscountRepositoryAdapterPrisma implements IClientDiscountRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: ClientDiscount): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...props } = entity.props;

    const result = await this.prisma.clientDiscount.create({
      data: { ...props },
    });

    return result.id;
  }

  public async edit(entity: ClientDiscount): Promise<void> {
    const { id, ...props } = entity.props;

    await this.prisma.clientDiscount.update({
      where: { id: id! },
      data: { ...props },
    });
  }

  public async findById(id: number): Promise<ClientDiscount | null> {
    const data = await this.prisma.clientDiscount.findUnique({
      where: { id },
    });
    if (!data) return null;

    return ClientDiscountFactory.load({
      ...data,
      type: data.type as DiscountType,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.clientDiscount.delete({
      where: { id },
    });
  }
}
