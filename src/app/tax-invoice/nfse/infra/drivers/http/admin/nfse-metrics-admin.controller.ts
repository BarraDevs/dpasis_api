import { Controller, Get } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { Swagger } from 'src/infra/openapi/swagger';
import { GetNfseMetricsOutputDto } from '../../../../application/usecases/get-nfse-metrics/dtos/get-nfse-metrics.dto';
import { GetNfseMetrics } from '../../../../application/usecases/get-nfse-metrics/get-nfse-metrics.service';

@Controller('admin/metrics')
@RequiredRoles(AccountRole.ADMIN)
export class NfseMetricsAdminController {
  constructor(private readonly getNfseMetrics: GetNfseMetrics) {}

  /**
   * Números do fluxo de emissão: NFS-e por status, presas, emitidas sem cobrança, situação das
   * cobranças, chamadas aos provedores nas últimas 24h e profundidade das filas. Leitura pura.
   */
  @Get('nfse')
  @RequiredClaims(Claim.NFM_READ)
  @Swagger({
    tags: ['Manutenção'],
    summary: 'Métricas do fluxo de NFS-e',
    okResponse: GetNfseMetricsOutputDto,
  })
  public nfse(): Promise<GetNfseMetricsOutputDto> {
    return this.getNfseMetrics.execute();
  }
}
