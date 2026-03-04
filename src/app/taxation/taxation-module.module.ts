import { Module } from '@nestjs/common';
import { CnaeNbsIndopModule } from './cnae-nbs-indop/cnae-nbs-indop/cnae-nbs-indop.module';
import { CnaeModule } from './cnae/cnae/cnae.module';
import { IndopModule } from './indop/indop/indop.module';
import { NbsModule } from './nbs/nbs/nbs.module';

const modules = [
  CnaeModule,
  IndopModule,
  NbsModule,
  CnaeNbsIndopModule,
];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class TaxationModuleModule {}
