import { Inject, Injectable } from '@nestjs/common';
import { LicenseNotFoundError } from 'src/app/license/domain/errors/license-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { ILicenseDao } from '../../persistence/dao/license-dao.interface';

@Injectable()
export class DeleteLicense {
  constructor(
    @Inject(TOKENS.LicenseDao) private readonly licenseDao: ILicenseDao,
  ) {}

  public async execute(id: string): Promise<SuccessMessage> {
    const license = await this.licenseDao.findById(id);
    if (!license) {
      throw new LicenseNotFoundError();
    }

    await this.licenseDao.delete(id);

    return { message: 'Licença deletada com sucesso!' };
  }
}
