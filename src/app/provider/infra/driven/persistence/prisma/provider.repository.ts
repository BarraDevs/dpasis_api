import { Injectable } from '@nestjs/common';
import { IProviderRepository } from 'src/app/provider/application/persistence/repository/provider-repository.interface';
import { Provider } from 'src/app/provider/domain/entities/provider.entity';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ProviderRepositoryAdapterPrisma implements IProviderRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findById(id: string): Promise<Provider | null> {
    const providerRecord = await this.prisma.provider.findUnique({
      where: { id },
      include: { companies: true },
    });

    if (!providerRecord) {
      return null;
    }

    return Provider.load({
      ...providerRecord,
      companyIds: providerRecord.companies.map((company) => company.id),
    });
  }

  public async save(provider: Provider): Promise<void> {
    const { companyIds, ...data } = provider.props;

    await this.prisma.provider.create({
      data: {
        ...data,
        companies: {
          connect: companyIds.map((companyId) => ({ id: companyId })),
        },
      },
    });
  }

  public async edit(provider: Provider): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, companyIds, updatedAt, ...data } = provider.props;

    await this.prisma.provider.update({
      where: { id },
      data: {
        ...data,
        companies: {
          set: companyIds.map((companyId) => ({ id: companyId })),
        },
      },
    });
  }
}
