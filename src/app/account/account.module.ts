import { Module } from '@nestjs/common';
import { AccountPersistenceModule } from './application/persistence/account-persistence.module';
import { FindAccountByCredential } from './application/usecases/find-account-by-credential/find-account-by-credential.service';
import { FindAccountById } from './application/usecases/find-account-by-id/find-account-by-id.service';

const providers = [
  FindAccountByCredential,
  FindAccountById,
];

@Module({
  imports: [
    AccountPersistenceModule,
  ],
  providers: [...providers],
  exports: [...providers],
})
export class AccountModule {}
