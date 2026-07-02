import { Injectable } from '@nestjs/common';
import { IProviderRepository } from 'src/app/provider/application/persistence/repository/provider-repository.interface';
import { Provider } from 'src/app/provider/domain/entities/provider.entity';
import { ProviderFactory } from 'src/app/provider/domain/factories/provider.factory';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ProviderRepositoryAdapterPrisma implements IProviderRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: Provider): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...props } = entity.props;

    const created = await this.prisma.provider.create({
      data: { ...props },
    });
    return created.id;
  }

  public async edit(entity: Provider): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...props } = entity.props;

    await this.prisma.provider.update({
      where: { id: id! },
      data: { ...props },
    });
  }

  public async findById(id: number): Promise<Provider | null> {
    const data = await this.prisma.provider.findUnique({
      where: { id },
    });
    if (!data) return null;

    return ProviderFactory.load({
      ...data,
      ie: data.ie ?? null,
      complement: data.complement ?? null,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.provider.delete({
      where: { id },
    });
  }
}
