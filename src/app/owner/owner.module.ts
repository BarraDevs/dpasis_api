import { Module } from '@nestjs/common';
import { OwnerPersistenceModule } from './application/persistence/owner-persistence.module';
import { FindOwnerById } from './application/usecases/find-owner-by-id/find-owner-by-id.service';

@Module({
  imports: [
    OwnerPersistenceModule,
  ],
  providers: [
    FindOwnerById,
  ],
  exports: [
    FindOwnerById,
  ],
})
export class OwnerModule {}
