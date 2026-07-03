import { Module } from '@nestjs/common';
import { ProviderItemModule } from './provider-item/provider-item.module';
import { ProviderModule } from './provider/provider.module';

const modules = [
  ProviderModule,
  ProviderItemModule,
];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class ProviderModuleModule {}
