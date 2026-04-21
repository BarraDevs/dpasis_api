import { Module } from '@nestjs/common';
import { ResaleModule } from './resale/resale.module';

const modules = [
  ResaleModule,
];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class ResaleModuleModule {}
