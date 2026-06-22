import { Injectable } from '@nestjs/common';
import { ISellerRepository } from 'src/app/seller/application/persistence/repository/seller-repository.interface';
import { Seller } from 'src/app/seller/domain/entities/seller.entity';
import { SellerFactory } from 'src/app/seller/domain/factories/seller.factory';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class SellerRepositoryAdapterPrisma implements ISellerRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: Seller): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...props } = entity.props;

    const created = await this.prisma.seller.create({
      data: { ...props },
    });
    return created.id;
  }

  public async edit(entity: Seller): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...props } = entity.props;

    await this.prisma.seller.update({
      where: { id: id! },
      data: { ...props },
    });
  }

  public async findById(id: number): Promise<Seller | null> {
    const data = await this.prisma.seller.findUnique({
      where: { id },
    });
    if (!data) return null;

    return SellerFactory.load({
      ...data,
      nickname: data.nickname ?? null,
      profilePictureUrl: data.profilePictureUrl ?? null,
      observation: data.observation ?? null,
      complement: data.complement ?? null,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.seller.delete({
      where: { id },
    });
  }
}
