import { Module } from '@nestjs/common';
import { BankModule } from './bank/bank.module';
import { BilledModule } from './billed/billed.module';
import { CategoryModule } from './category/category.module';
import { DeliveryTermModule } from './delivery-term/delivery-term.module';
import { FreightModule } from './freight/freight.module';
import { ProposalValidityModule } from './proposal-validity/proposal-validity.module';
import { TaxationModuleModule } from './taxation/taxation-module.module';
import { WarrantyModule } from './warranty/warranty.module';

const modules = [
  BankModule,
  BilledModule,
  CategoryModule,
  DeliveryTermModule,
  FreightModule,
  ProposalValidityModule,
  TaxationModuleModule,
  WarrantyModule,
];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class GlobalModule {}
