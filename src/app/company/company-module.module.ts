import { Module } from '@nestjs/common';
import { CompanyModule } from './company/company.module';

const modules = [
  CompanyModule,
];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class CompanyModuleModule {}
