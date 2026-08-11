import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyNfsConfigAlreadyExistsError } from 'src/app/company/company-nfs-config/domain/errors/company-nfs-config-already-exists.error';
import { TOKENS } from 'src/core/di/token';
import type { ICompanyNfsConfigDao } from '../../persistence/dao/company-nfs-config-dao.interface';
import { CreateCompanyNfsConfigInputDto, CreateCompanyNfsConfigOutputDto } from './dtos/create-company-nfs-config.dto';

@Injectable()
export class CreateCompanyNfsConfig {
  constructor(
    @Inject(TOKENS.CompanyNfsConfigDao) private readonly companyNfsConfigDao: ICompanyNfsConfigDao,
    private readonly findCompanyById: FindCompanyById,
  ) {}

  public async execute(data: CreateCompanyNfsConfigInputDto): Promise<CreateCompanyNfsConfigOutputDto> {
    await this.findCompanyById.execute(data.companyId);

    const existingConfig = await this.companyNfsConfigDao.findByCompanyId(data.companyId);
    if (existingConfig) {
      throw new CompanyNfsConfigAlreadyExistsError();
    }

    const id = await this.companyNfsConfigDao.save(data);

    return { id };
  }
}
