import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { ICompanyNfsConfigDao } from 'src/app/company/company-nfs-config/application/persistence/dao/company-nfs-config-dao.interface';
import { CreateCompanyNfsConfigInputDto } from 'src/app/company/company-nfs-config/application/usecases/create-company-nfs-config/dtos/create-company-nfs-config.dto';
import { EditCompanyNfsConfigInputDto } from 'src/app/company/company-nfs-config/application/usecases/edit-company-nfs-config/dtos/edit-company-nfs-config.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

const CompanyNfsConfigSelect = {
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
  simpleNationalOptant: true,
  fiscalIncentive: true,
  issRate: true,
  issExigibility: true,
} satisfies Prisma.NfsProviderConfigSelect;

@Injectable()
export class CompanyNfsConfigDaoAdapterPrisma implements ICompanyNfsConfigDao {
  constructor(private readonly prisma: PrismaService) {}

  public async findById(id: number): Promise<CompanyNfsConfigDto | null> {
    const row = await this.prisma.nfsProviderConfig.findUnique({
      where: { id },
      select: CompanyNfsConfigSelect,
    });

    return row ? this.mapToDto(row) : null;
  }

  public async findByCompanyId(companyId: number): Promise<CompanyNfsConfigDto | null> {
    const row = await this.prisma.nfsProviderConfig.findUnique({
      where: { companyId },
      select: CompanyNfsConfigSelect,
    });

    return row ? this.mapToDto(row) : null;
  }

  public async save(data: CreateCompanyNfsConfigInputDto): Promise<number> {
    const result = await this.prisma.nfsProviderConfig.create({
      data: {
        companyId: data.companyId,
        vendor: data.vendor,
        municipalRegistration: data.municipalRegistration,
        municipalCodeIbge: data.municipalCodeIbge,
        serieRps: data.serieRps,
        environment: data.environment,
        certFilePath: data.certFilePath,
        certPasswordEnvVar: data.certPasswordEnvVar,
        vendorConfig: data.vendorConfig as Prisma.InputJsonValue,
        simpleNationalOptant: data.simpleNationalOptant,
        fiscalIncentive: data.fiscalIncentive,
        issRate: data.issRate,
        issExigibility: data.issExigibility,
      },
    });

    return result.id;
  }

  public async edit(id: number, data: EditCompanyNfsConfigInputDto): Promise<void> {
    const { vendorConfig, ...rest } = data;
    await this.prisma.nfsProviderConfig.update({
      where: { id },
      data: {
        ...rest,
        ...(vendorConfig !== undefined ? { vendorConfig: vendorConfig as Prisma.InputJsonValue } : {}),
      },
    });
  }

  private mapToDto(row: Prisma.NfsProviderConfigGetPayload<{ select: typeof CompanyNfsConfigSelect }>): CompanyNfsConfigDto {
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
      simpleNationalOptant: row.simpleNationalOptant,
      fiscalIncentive: row.fiscalIncentive,
      issRate: row.issRate != null ? Number(row.issRate) : null,
      issExigibility: row.issExigibility,
    };
  }
}
