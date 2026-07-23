import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { INfsProviderConfigDao } from 'src/app/tax-invoice/nfse/application/persistence/dao/nfs-provider-config-dao.interface';
import { NfsProviderConfigDto } from 'src/app/tax-invoice/nfse/application/dtos/nfs-provider-config.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const NfsProviderConfigSelect = {
  id: true,
  companyId: true,
  vendor: true,
  municipalRegistration: true,
  municipalCodeIbge: true,
  serieRps: true,
  environment: true,
  certFilePath: true,
  certPasswordEnvVar: true,
  vendorConfig: true,
} satisfies Prisma.NfsProviderConfigSelect;

@Injectable()
export class NfsProviderConfigDaoAdapterPrisma implements INfsProviderConfigDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findByCompanyId(companyId: number): Promise<NfsProviderConfigDto | null> {
    const row = await this.prisma.nfsProviderConfig.findUnique({
      where: { companyId },
      select: NfsProviderConfigSelect,
    });

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      companyId: row.companyId,
      vendor: row.vendor,
      municipalRegistration: row.municipalRegistration,
      municipalCodeIbge: row.municipalCodeIbge,
      serieRps: row.serieRps,
      environment: row.environment,
      certFilePath: row.certFilePath,
      certPasswordEnvVar: row.certPasswordEnvVar,
      vendorConfig: row.vendorConfig as Record<string, unknown>,
    };
  }
}
