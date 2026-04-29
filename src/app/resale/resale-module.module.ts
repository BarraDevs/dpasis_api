import { Module } from '@nestjs/common';
import { ResaleContactModule } from './resale-contact/resale-contact.module';
import { ResaleDepartmentModule } from './resale-department/resale-department.module';
import { ResaleModule } from './resale/resale.module';

const modules = [
  ResaleModule,
  ResaleDepartmentModule,
  ResaleContactModule,
];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class ResaleModuleModule {}
