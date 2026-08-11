import { Inject, Injectable } from '@nestjs/common';
import { CompanyNfsConfigNotFoundError } from 'src/app/company/company-nfs-config/domain/errors/company-nfs-config-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { ICompanyNfsConfigDao } from '../../persistence/dao/company-nfs-config-dao.interface';
import { EditCompanyNfsConfigInputDto } from './dtos/edit-company-nfs-config.dto';

@Injectable()
export class EditCompanyNfsConfig {
  constructor(
    @Inject(TOKENS.CompanyNfsConfigDao) private readonly companyNfsConfigDao: ICompanyNfsConfigDao,
  ) {}

  public async execute(id: number, data: EditCompanyNfsConfigInputDto): Promise<SuccessMessage> {
    const config = await this.companyNfsConfigDao.findById(id);
    if (!config) {
      throw new CompanyNfsConfigNotFoundError();
    }

    await this.companyNfsConfigDao.edit(id, data);

    return { message: 'Configuração de NFS-e atualizada com sucesso' };
  }
}
