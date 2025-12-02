import { Inject, Injectable } from '@nestjs/common';
import { LicenseNotFoundError } from 'src/app/license/domain/errors/license-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { LicenseDto } from '../../dtos/license.dto';
import type { ILicenseDao } from '../../persistence/dao/license-dao.interface';

@Injectable()
export class FindLicenseById {
  constructor(
    @Inject(TOKENS.LicenseDao) private readonly licenseDao: ILicenseDao,
  ) {}

  public async execute(id: string): Promise<LicenseDto> {
    const license = await this.licenseDao.findById(id);
    if (!license) {
      throw new LicenseNotFoundError();
    }

    return license;
  }
}
