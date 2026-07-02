import { Module } from '@nestjs/common';
import { ProviderModule } from './provider/provider.module';

const modules = [
  ProviderModule,
];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class ProviderModuleModule {}
