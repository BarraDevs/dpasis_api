import { Inject, Injectable } from '@nestjs/common';
import { FindOwnerById } from 'src/app/owner/application/usecases/find-owner-by-id/find-owner-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import type { ILicenseDao } from '../../persistence/dao/license-dao.interface';
import { CreateLicenseInputDto, CreateLicenseOutputDto } from './dtos/create-license.dto';

@Injectable()
export class CreateLicense {
  constructor(
    @Inject(TOKENS.LicenseDao) private readonly licenseDao: ILicenseDao,
    private readonly findOwnerById: FindOwnerById,
  ) {}

  public async execute(data: CreateLicenseInputDto): Promise<CreateLicenseOutputDto> {
    const owner = await this.findOwnerById.execute(data.ownerId);

    // TODO: Verificar com cliente se billingStartDate pode ser no passado
    const licenseId = await this.licenseDao.save({
      ...data,
      ownerId: owner.id,
      billingStartDate: UTCDate.from(data.billingStartDate).value,
    });

    return { id: licenseId };
  }
}
