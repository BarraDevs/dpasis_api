import { Controller, Get } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { Swagger } from 'src/infra/openapi/swagger';
import { CheckCertificates } from '../../../../application/usecases/check-certificates/check-certificates.service';
import { CheckCertificatesOutputDto } from '../../../../application/usecases/check-certificates/dtos/check-certificates.dto';

@Controller('admin/health')
@RequiredRoles(AccountRole.ADMIN)
export class HealthAdminController {
  constructor(private readonly checkCertificates: CheckCertificates) {}

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
}
