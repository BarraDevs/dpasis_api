import { Module } from '@nestjs/common';
import { NfmModule } from './nfm/nfm.module';
import { NfseModule } from './nfse/nfse.module';

const modules = [
  NfmModule,
  NfseModule,
];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class TaxInvoiceModule {}
