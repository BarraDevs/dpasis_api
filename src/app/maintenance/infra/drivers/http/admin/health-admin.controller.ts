import { Controller, Get } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { Swagger } from 'src/infra/openapi/swagger';
import { CheckAlertChannel } from '../../../../application/usecases/check-alert-channel/check-alert-channel.service';
import { CheckAlertChannelOutputDto } from '../../../../application/usecases/check-alert-channel/dtos/check-alert-channel.dto';
import { CheckCertificates } from '../../../../application/usecases/check-certificates/check-certificates.service';
import { CheckCertificatesOutputDto } from '../../../../application/usecases/check-certificates/dtos/check-certificates.dto';

@Controller('admin/health')
@RequiredRoles(AccountRole.ADMIN)
export class HealthAdminController {
  constructor(
    private readonly checkCertificates: CheckCertificates,
    private readonly checkAlertChannel: CheckAlertChannel,
  ) {}

  /**
   * Validade dos certificados que a emissão depende: o A1 do Giss por empresa e o mTLS do Inter.
   * Leitura pura — carrega os arquivos e devolve `notAfter`, sem tocar em nada.
   */
  @Get('certificates')
  @RequiredClaims(Claim.COMPANY_NFS_CONFIG_READ)
  @Swagger({
    tags: ['Manutenção'],
    summary: 'Validade dos certificados digitais (Giss e Inter)',
    okResponse: CheckCertificatesOutputDto,
  })
  public certificates(): Promise<CheckCertificatesOutputDto> {
    return this.checkCertificates.execute();
  }

  /**
   * Se o canal de alerta entrega. Abre a conexão SMTP e autentica, **sem** mandar e-mail — dá para
   * chamar antes de um fechamento sem poluir a caixa de ninguém.
   */
  @Get('smtp')
  @RequiredClaims(Claim.COMPANY_NFS_CONFIG_READ)
  @Swagger({
    tags: ['Manutenção'],
    summary: 'Disponibilidade do canal de alerta (SMTP)',
    okResponse: CheckAlertChannelOutputDto,
  })
  public smtp(): Promise<CheckAlertChannelOutputDto> {
    return this.checkAlertChannel.execute();
  }
}
