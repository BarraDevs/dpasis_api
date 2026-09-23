import { Module } from '@nestjs/common';
import { BankModule } from './bank/bank.module';
import { BilledModule } from './billed/billed.module';
import { CategoryModule } from './category/category.module';
import { DepartmentModule } from './department/department.module';
import { DeliveryTermModule } from './delivery-term/delivery-term.module';
import { EmailTemplateModule } from './email-template/email-template.module';
import { EmailTemplateVariableModule } from './email-template-variable/email-template-variable.module';
import { FreightModule } from './freight/freight.module';
import { ProposalValidityModule } from './proposal-validity/proposal-validity.module';
import { TaxationModuleModule } from './taxation/taxation-module.module';
import { WarrantyModule } from './warranty/warranty.module';

const modules = [
  BankModule,
  BilledModule,
  CategoryModule,
  DepartmentModule,
  DeliveryTermModule,
  EmailTemplateModule,
  EmailTemplateVariableModule,
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
