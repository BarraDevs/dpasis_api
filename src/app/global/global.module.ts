import { Module } from '@nestjs/common';
import { BankModule } from './bank/bank.module';
import { TaxationModuleModule } from './taxation/taxation-module.module';

const modules = [
  BankModule,
  TaxationModuleModule,
];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class GlobalModule {}
