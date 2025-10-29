TypeScript

import { Inject, Injectable } from '@nestjs/common';
import { TOKENS }
from 'src/core/di/token';
import type { ILicenseDao } from '../../persistence/dao/license-dao.interface';
import { CreateLicenseInputDto, CreateLicenseOutputDto } from './dtos/create-license.dto';

@Injectable()
export class CreateLicense {
  constructor(
    @Inject(TOKENS.LicenseDao) private readonly licenseDao: ILicenseDao,
  ) {}

  public async execute(data: CreateLicenseInputDto): Promise<CreateLicenseOutputDto> {
    const licenseId = await this.licenseDao.save(data);
    return { id: licenseId };
  }
}
