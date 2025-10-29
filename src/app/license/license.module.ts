import { Module } from '@nestjs/common';
import { LicensePersistenceModule } from './application/persistence/license-persistence.module';
import { LicenseController } from './infra/drivers/http/license.controller';

@Module({
  imports: [
    LicensePersistenceModule,
  ],
  controllers: [
    LicenseController,
  ],
  providers: [
    // CreateLicense,
    // DeleteLicense,
    // EditLicense,
    // FindAllLicense,
    // FindLicenseById,
  ],
  exports: [],
})
export class LicenseModule {}
