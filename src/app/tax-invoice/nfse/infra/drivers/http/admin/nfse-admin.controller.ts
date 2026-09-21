import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { Swagger } from 'src/infra/openapi/swagger';
import { getThrottleHalfLimit } from 'src/infra/throttle/throttle.runtime';
import {
  ListIssuedNfseFromProviderOutputDto,
  ListIssuedNfseFromProviderQueryDto,
} from '../../../../application/usecases/list-issued-nfse-from-provider/dtos/list-issued-nfse-from-provider.dto';
import { ListIssuedNfseFromProvider } from '../../../../application/usecases/list-issued-nfse-from-provider/list-issued-nfse-from-provider.service';

@Controller('admin/nfse')
@RequiredRoles(AccountRole.ADMIN)
export class NfseAdminController {
  constructor(private readonly listIssuedNfseFromProvider: ListIssuedNfseFromProvider) {}

  @Get('issued-at-provider')
  @Throttle({
    default: { limit: () => getThrottleHalfLimit() },
  })
  @RequiredClaims(Claim.NFM_READ)
  @Swagger({
    tags: ['NFS-e'],
    summary: 'Listar NFS-e emitidas no Giss por empresa e período',
    description: 'Consulta o provedor (página de 50). Não lê NFM/NFS-e locais. Paginar com `endOfPages`.',
    applyBadRequest: true,
    applyNotFound: true,
    applyServiceUnavailable: true,
    okResponse: ListIssuedNfseFromProviderOutputDto,
  })
  public issuedAtProvider(@Query() queries: ListIssuedNfseFromProviderQueryDto): Promise<ListIssuedNfseFromProviderOutputDto> {
    return this.listIssuedNfseFromProvider.execute(queries);
  }
}
