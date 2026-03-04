import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { CnaeModule } from 'src/app/cnae/cnae/cnae.module';
import { IndopModule } from 'src/app/indop/indop/indop.module';
import { NbsModule } from 'src/app/nbs/nbs/nbs.module';
import { CnaeNbsIndopPersistenceModule } from './application/persistence/cnae-nbs-indop-persistence.module';
import { CreateCnaeNbsIndop } from './application/usecases/create-cnae-nbs-indop/create-cnae-nbs-indop.service';
import { DeleteCnaeNbsIndop } from './application/usecases/delete-cnae-nbs-indop/delete-cnae-nbs-indop.service';
import { FindAllCnaeNbsIndop } from './application/usecases/find-all-cnae-nbs-indop/find-all-cnae-nbs-indop.service';
import { FindCnaesForSelect } from './application/usecases/find-cnaes-for-select/find-cnaes-for-select.service';
import { FindIndopsByCnaeAndNbsForSelect } from './application/usecases/find-indops-by-cnae-and-nbs-for-select/find-indops-by-cnae-and-nbs-for-select.service';
import { FindNbsByCnaeForSelect } from './application/usecases/find-nbs-by-cnae-for-select/find-nbs-by-cnae-for-select.service';
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
    FindCnaesForSelect,
    FindNbsByCnaeForSelect,
    FindIndopsByCnaeAndNbsForSelect,
  ],
})
export class CnaeNbsIndopModule {}
