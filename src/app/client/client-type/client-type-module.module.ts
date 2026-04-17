import { Module } from '@nestjs/common';
import { ClientDescriptionTypeModule } from './client-description-type/client-description-type.module';
import { ClientDriveTypeModule } from './client-drive-type/client-drive-type.module';
import { ClientSystemTypeModule } from './client-system-type/client-system-type.module';
import { ClientTypeModule } from './client-type/client-type.module';

const modules = [
  ClientDescriptionTypeModule,
  ClientDriveTypeModule,
  ClientSystemTypeModule,
  ClientTypeModule,
];

@Module({
  imports: [...modules],
  exports: [...modules],
})
export class ClientTypeModuleModule {}
