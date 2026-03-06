import { Module } from '@nestjs/common';
import { CnaeNbsIndopModule } from './cnae-nbs-indop/cnae-nbs-indop.module';
import { CnaeModule } from './cnae/cnae.module';
import { IndopModule } from './indop/indop.module';
import { NbsModule } from './nbs/nbs.module';

const modules = [
  CnaeNbsIndopModule,
  CnaeModule,
  IndopModule,
  NbsModule,
];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class TaxationModuleModule {}
