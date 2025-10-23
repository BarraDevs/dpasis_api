import { Module } from '@nestjs/common';
import { AccountModule } from 'src/app/account/account.module';
import { CacheModule } from 'src/infra/cache/cache.module';
import { AuthenticationGuard } from './authentication/authentication.guard';
import { AuthorizationGuard } from './authorization/authorization.guard';

@Module({
  imports: [
    AccountModule,
    CacheModule.forRoot(),
  ],
  providers: [
    AuthenticationGuard,
    AuthorizationGuard,
  ],
})
export class AuthenticationGuardsModule {}
