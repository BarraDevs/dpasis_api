import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../authentication/application/guards/guards.module'; // Adicionado
import { OwnerModule } from '../owner/owner.module';
import { LicensePersistenceModule } from './application/persistence/license-persistence.module';
import { CreateLicense } from './application/usecases/create-license/create-license.service';
import { DeleteLicense } from './application/usecases/delete-license/delete-license.service';
import { EditLicense } from './application/usecases/edit-license/edit-license.service';
import { FindAllLicense } from './application/usecases/find-all-license/find-all-license.service';
import { FindLicenseById } from './application/usecases/find-license-by-id/find-license-by-id.service';
import { LicenseController } from './infra/drivers/http/license.controller';

@Module({
  imports: [
    LicensePersistenceModule,
    AuthenticationGuardsModule,
    OwnerModule,
  ],
  controllers: [
    LicenseController,
  ],
  providers: [
    CreateLicense,
    DeleteLicense,
    EditLicense,
    FindAllLicense,
    FindLicenseById,
  ],
  exports: [],
})
export class LicenseModule {}
