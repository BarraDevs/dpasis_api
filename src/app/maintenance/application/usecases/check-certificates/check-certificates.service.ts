import { Inject, Injectable } from '@nestjs/common';
import type { ICompanyNfsConfigDao } from 'src/app/company/company-nfs-config/application/persistence/dao/company-nfs-config-dao.interface';
import { InspectBankCertificates } from 'src/app/global/bank/application/usecases/inspect-bank-certificates/inspect-bank-certificates.service';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
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
    private readonly inspectBankCertificates: InspectBankCertificates,
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
      ...await this.checkInterCertificates(),
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

  private async checkInterCertificates(): Promise<CertificateHealthDto[]> {
    const inspections = await this.inspectBankCertificates.execute();

    return inspections.map((item) => {
      if (item.loadError) {
        const expired = /venceu em/.test(item.loadError);
        return {
          provider: 'INTER',
          owner: item.owner,
          path: item.path,
          notAfter: item.notAfter?.toISOString() ?? null,
          daysToExpire: null,
          status: expired ? CertificateHealthStatus.Expired : CertificateHealthStatus.Error,
          message: item.loadError,
        };
      }

      const notAfter = item.notAfter ?? new Date(0);
      const daysToExpire = Math.floor((notAfter.getTime() - Date.now()) / ONE_DAY_IN_MS);

      return {
        provider: 'INTER',
        owner: item.owner,
        path: item.path,
        notAfter: item.notAfter?.toISOString() ?? null,
        daysToExpire,
        status: daysToExpire <= CERTIFICATE_WARNING_THRESHOLDS_IN_DAYS[0]
          ? CertificateHealthStatus.Expiring
          : CertificateHealthStatus.Ok,
        message: null,
      };
    });
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
