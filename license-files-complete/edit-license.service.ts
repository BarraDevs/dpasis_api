TypeScript

import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { ILicenseDao } from '../../persistence/dao/license-dao.interface';
import { LicenseNotFoundError } from 'src/app/license/domain/errors/license-not-found.error'; // Usando o mesmo erro
import { EditLicenseInputDto } from './dtos/edit-license.dto';

@Injectable()
export class EditLicense {
  constructor(
    @Inject(TOKENS.LicenseDao) private readonly licenseDao: ILicenseDao,
  ) {}

  public async execute(id: string, data: EditLicenseInputDto): Promise<SuccessMessage> {
    const license = await this.licenseDao.findById(id);
    if (!license) {
      throw new LicenseNotFoundError();
    }

    await this.licenseDao.edit(id, data);

    return { message: 'Licença atualizada com sucesso!' };
  }
}
