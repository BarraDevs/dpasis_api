import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { Swagger } from 'src/infra/openapi/swagger';
import { getThrottleHalfLimit } from 'src/infra/throttle/throttle.runtime';
import { ClassifyNfse } from '../../../../application/usecases/classify-nfse/classify-nfse.service';
import { ClassifyNfseInputDto, ClassifyNfseOutputDto } from '../../../../application/usecases/classify-nfse/dtos/classify-nfse.dto';
import {
  ListIssuedNfseFromProviderOutputDto,
  ListIssuedNfseFromProviderQueryDto,
} from '../../../../application/usecases/list-issued-nfse-from-provider/dtos/list-issued-nfse-from-provider.dto';
import { ListIssuedNfseFromProvider } from '../../../../application/usecases/list-issued-nfse-from-provider/list-issued-nfse-from-provider.service';

@Controller('admin/nfse')
@RequiredRoles(AccountRole.ADMIN)
export class NfseAdminController {
  constructor(
    private readonly listIssuedNfseFromProvider: ListIssuedNfseFromProvider,
    private readonly classifyNfse: ClassifyNfse,
  ) {}

  @Get('issued-at-provider')
  @Throttle({
    default: { limit: () => getThrottleHalfLimit() },
  })
  @RequiredClaims(Claim.NFM_READ)
  @Swagger({
    tags: ['NFS-e'],
    summary: 'Listar NFS-e emitidas no Giss por empresa e período',
    description: 'Consulta o provedor (página de 50). Não lê NFM/NFS-e locais. Paginar com `endOfPages`. `kind` vem da classificação interna.',
    applyBadRequest: true,
    applyNotFound: true,
    applyServiceUnavailable: true,
    okResponse: ListIssuedNfseFromProviderOutputDto,
  })
  public issuedAtProvider(@Query() queries: ListIssuedNfseFromProviderQueryDto): Promise<ListIssuedNfseFromProviderOutputDto> {
    return this.listIssuedNfseFromProvider.execute(queries);
  }

  @Post('classifications')
  @RequiredClaims(Claim.NFM_WRITE)
  @Swagger({
    tags: ['NFS-e'],
    summary: 'Classificar NFS-e em massa (NFM ou NFS)',
    description: 'Upsert por empresa + série + número do RPS. Teto de 200 itens. Não envia nada ao Giss. Reclassificar é enviar de novo com outro `kind`.',
    applyBadRequest: true,
    okResponse: ClassifyNfseOutputDto,
  })
  public classify(@Body() body: ClassifyNfseInputDto): Promise<ClassifyNfseOutputDto> {
    return this.classifyNfse.execute(body);
  }
}
