import { Module } from '@nestjs/common';
import { CompanyModule } from './company/company.module';
import { CompanyNfsConfigModule } from './company-nfs-config/company-nfs-config.module';

const modules = [
  CompanyModule,
  CompanyNfsConfigModule,
];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class CompanyModuleModule {}
