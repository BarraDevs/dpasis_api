import { Module } from '@nestjs/common';
import { ResaleContactModule } from './resale-contact/resale-contact.module';
import { ResaleModule } from './resale/resale.module';

const modules = [
  ResaleModule,
  ResaleContactModule,
];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class ResaleModuleModule {}
