import { Inject, Injectable } from '@nestjs/common';
import type { ICompanyNfsConfigDao } from 'src/app/company/company-nfs-config/application/persistence/dao/company-nfs-config-dao.interface';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { InterCertLoader } from 'src/infra/bank-payment/adapters/inter/oauth/inter-cert.loader';
import { GissPfxLoader } from 'src/infra/nfs-generation/adapters/giss/signing/giss-pfx-loader';
import {
  CertificateHealthDto,
  CertificateHealthStatus,
  CheckCertificatesOutputDto,
} from './dtos/check-certificates.dto';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

/** Limiares de aviso. O de 30 dias é o prazo mínimo para emitir e instalar um certificado novo. */
export const CERTIFICATE_WARNING_THRESHOLDS_IN_DAYS = [30, 15, 7] as const;

@Injectable()
export class CheckCertificates {
  constructor(
    @Inject(TOKENS.CompanyNfsConfigDao) private readonly companyNfsConfigDao: ICompanyNfsConfigDao,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Vencimento de certificado é evento previsível, e hoje só aparece quando a emissão quebra: o
   * handshake TLS falha, o erro chega genérico e o dia inteiro de notas para. Os loaders já recusam
   * um certificado vencido desde a Onda 1 — o que faltava era enxergar a data **antes**.
   *
   * Nunca lança: um certificado ilegível vira uma linha com `status: ERROR`. Um healthcheck que cai
   * por causa do problema que deveria reportar não serve para nada.
   */
  public async execute(): Promise<CheckCertificatesOutputDto> {
    const certificates: CertificateHealthDto[] = [
      ...await this.checkGissCertificates(),
      ...this.checkInterCertificate(),
    ];

    return { certificates, status: CheckCertificates.worstStatus(certificates) };
  }

  private async checkGissCertificates(): Promise<CertificateHealthDto[]> {
    if (!this.configService.gissProviderEnabled) {
      return [];
    }

    const configs = await this.companyNfsConfigDao.findAll();

    return configs.map((config) => this.inspect(
      config.vendor,
      `companyId=${config.companyId} · IM ${config.municipalRegistration}`,
      config.certFilePath,
      () => GissPfxLoader.load(config.certFilePath, config.certPasswordEnvVar).notAfter,
    ));
  }

  private checkInterCertificate(): CertificateHealthDto[] {
    if (!this.configService.interProviderEnabled) {
      return [];
    }

    const certPath = this.configService.interCertPath;

    return [this.inspect(
      'INTER',
      'mTLS da API de cobrança',
      certPath,
      () => InterCertLoader.load(certPath, this.configService.interKeyPath).notAfter,
    )];
  }

  private inspect(provider: string, owner: string, path: string, readNotAfter: ()=> Date): CertificateHealthDto {
    try {
      const notAfter = readNotAfter();
      const daysToExpire = Math.floor((notAfter.getTime() - Date.now()) / ONE_DAY_IN_MS);

      return {
        provider,
        owner,
        path,
        notAfter: notAfter.toISOString(),
        daysToExpire,
        status: daysToExpire <= CERTIFICATE_WARNING_THRESHOLDS_IN_DAYS[0]
          ? CertificateHealthStatus.Expiring
          : CertificateHealthStatus.Ok,
        message: null,
      };
    }
    catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      // O loader recusa um certificado vencido com a data na mensagem: é vencimento, não defeito de
      // leitura, e a diferença muda o que a operação faz a seguir.
      const expired = /venceu em/.test(message);

      return {
        provider,
        owner,
        path,
        notAfter: null,
        daysToExpire: null,
        status: expired ? CertificateHealthStatus.Expired : CertificateHealthStatus.Error,
        message,
      };
    }
  }

  private static worstStatus(certificates: CertificateHealthDto[]): CertificateHealthStatus {
    const ranking = [
      CertificateHealthStatus.Expired,
      CertificateHealthStatus.Error,
      CertificateHealthStatus.Expiring,
      CertificateHealthStatus.Ok,
    ];

    return ranking.find((status) => certificates.some((certificate) => certificate.status === status))
      ?? CertificateHealthStatus.Ok;
  }
}
