import { Module } from '@nestjs/common';
import { NfmModule } from './nfm/nfm.module';

const modules = [
  NfmModule,
];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class TaxInvoiceModule {}
