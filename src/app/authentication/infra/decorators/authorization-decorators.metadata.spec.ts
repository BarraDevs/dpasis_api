import { Controller, Get } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { REQUIRED_CLAIMS_KEY, REQUIRED_ROLES_KEY } from './authorization-metadata.constants';
import { RequiredClaims } from './required-claims.decorator';
import { RequiredRoles } from './required-role.decorator';

describe('Authorization decorators metadata', () => {
  it('should set required claims metadata on the handler method', () => {
    @Controller()
    class TestController {
      @Get()
      @RequiredClaims(Claim.BANK_LIST, Claim.BANK_DETAIL)
      list(): void {}
    }

    const meta = Reflect.getMetadata(
      REQUIRED_CLAIMS_KEY,
      TestController.prototype.list,
    );

    expect(meta).toEqual([Claim.BANK_LIST, Claim.BANK_DETAIL]);
  });

  it('should set required roles metadata on the controller class when using RequiredRoles', () => {
    @RequiredRoles(AccountRole.ADMIN)
    @Controller()
    class TestController {
      @Get()
      ping(): void {}
    }

    const meta = Reflect.getMetadata(REQUIRED_ROLES_KEY, TestController);

    expect(meta).toEqual([AccountRole.ADMIN]);
  });
});
