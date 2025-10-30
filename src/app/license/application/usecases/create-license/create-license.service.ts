import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import type { ILicenseDao } from '../../persistence/dao/license-dao.interface';
import { CreateLicenseInputDto, CreateLicenseOutputDto } from './dtos/create-license.dto';

@Injectable()
export class CreateLicense {
  constructor(
    @Inject(TOKENS.LicenseDao) private readonly licenseDao: ILicenseDao,
  ) {}

  public async execute(data: CreateLicenseInputDto): Promise<CreateLicenseOutputDto> {
    // TODO: Verificar com cliente se billingStartDate pode ser no passado

    const licenseId = await this.licenseDao.save({
      ...data,
      billingStartDate: UTCDate.from(data.billingStartDate).value,
    });

    return { id: licenseId };
  }
}
