import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { CnaeModule } from 'src/app/global/taxation/cnae/cnae.module';
import { IndopModule } from 'src/app/global/taxation/indop/indop.module';
import { NbsModule } from 'src/app/global/taxation/nbs/nbs.module';
import { CnaeNbsIndopPersistenceModule } from './application/persistence/cnae-nbs-indop-persistence.module';
import { CreateCnaeNbsIndop } from './application/usecases/create-cnae-nbs-indop/create-cnae-nbs-indop.service';
import { DeleteCnaeNbsIndop } from './application/usecases/delete-cnae-nbs-indop/delete-cnae-nbs-indop.service';
import { FindAllCnaeNbsIndop } from './application/usecases/find-all-cnae-nbs-indop/find-all-cnae-nbs-indop.service';
import { FindCnaeNbsIndopById } from './application/usecases/find-cnae-nbs-indop-by-id/find-cnae-nbs-indop-by-id.service';
import { FindCnaesForSelect } from './application/usecases/find-cnaes-for-select/find-cnaes-for-select.service';
import { FindIndopsByCnaeAndNbsForSelect } from './application/usecases/find-indops-by-cnae-and-nbs-for-select/find-indops-by-cnae-and-nbs-for-select.service';
import { FindNbsByCnaeForSelect } from './application/usecases/find-nbs-by-cnae-for-select/find-nbs-by-cnae-for-select.service';
import { UpdateCnaeNbsIndopStatus } from './application/usecases/update-cnae-nbs-indop-status/update-cnae-nbs-indop-status.service';
import { CnaeNbsIndopAdminController } from './infra/drivers/http/admin/cnae-nbs-indop-admin.controller';

@Module({
  imports: [
    CnaeNbsIndopPersistenceModule,
    AuthenticationGuardsModule,
    CnaeModule,
    NbsModule,
    IndopModule,
  ],
  controllers: [
    CnaeNbsIndopAdminController,
  ],
  providers: [
    CreateCnaeNbsIndop,
    DeleteCnaeNbsIndop,
    FindAllCnaeNbsIndop,
    FindCnaeNbsIndopById,
    FindCnaesForSelect,
    FindNbsByCnaeForSelect,
    FindIndopsByCnaeAndNbsForSelect,
    UpdateCnaeNbsIndopStatus,
  ],
  exports: [
    FindCnaeNbsIndopById,
  ],
})
export class CnaeNbsIndopModule {}
