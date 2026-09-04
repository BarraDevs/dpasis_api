import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { FindCompanyById } from 'src/app/company/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { SAO_PAULO_TIMEZONE } from 'src/core/constants/timezone.constant';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { NfsIssuedNoteDto } from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';
import { NfsProviderCredentialsDto, NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { DateTime } from 'luxon';
import { NfseReconcileTargetDto } from '../../dtos/nfse-reconcile-target.dto';
import { matchIssuedNote } from '../../helpers/match-issued-note';
import type { INfseDao } from '../../persistence/dao/nfse-dao.interface';
import { ReconcileNfse } from '../reconcile-nfse/reconcile-nfse.service';
import {
  ReconcileNfsePeriodDivergenceDto,
  ReconcileNfsePeriodInputDto,
  ReconcileNfsePeriodOutputDto,
} from './dtos/reconcile-nfse-period.dto';

/**
 * Teto de páginas por empresa. Em Mauá não há limite de período e cada página traz 50 notas: um mês
 * cheio do prestador deu 14 páginas na medição. 40 cobre folgadamente a janela de trabalho de 1 dia
 * e impede que um provedor que ignore a paginação faça o job girar para sempre.
 */
const MAX_PAGES_PER_COMPANY = 40;

@Injectable()
export class ReconcileNfsePeriod {
  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    @Inject(TOKENS.NfseDao) private readonly nfseDao: INfseDao,
    @Inject(TOKENS.NfsGenerationGateway) private readonly nfsGenerationGateway: INfsGenerationGateway,
    private readonly findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId,
    private readonly findCompanyById: FindCompanyById,
    private readonly reconcileNfse: ReconcileNfse,
  ) {}

  /**
   * Conciliação em lote: uma varredura por período no lugar de N consultas por nota. Puxa o que o
   * provedor emitiu na janela e compara com o que o banco local acha que emitiu.
   *
   * O casamento é **nota a nota pela chave natural do RPS**, nunca por contagem: a consulta devolve
   * todas as notas do prestador, inclusive as emitidas pelo portal e pela contabilidade. Comparar
   * contagens acusaria centenas de divergências falsas.
   */
  public async execute(input: ReconcileNfsePeriodInputDto): Promise<ReconcileNfsePeriodOutputDto> {
    const dryRun = input.dryRun !== false;
    const { periodStart, periodEnd } = ReconcileNfsePeriod.toRange(input.startDate, input.endDate);

    const targets = await this.nfseDao.findPendingByPeriod(periodStart, periodEnd);
    const byCompany = ReconcileNfsePeriod.groupByCompany(targets);

    const divergences: ReconcileNfsePeriodDivergenceDto[] = [];
    let corrected = 0;
    let pagesRead = 0;

    for (const [companyId, companyTargets] of byCompany) {
      const { notes, pages } = await this.readAllPages(companyId, input.startDate, input.endDate);
      pagesRead += pages;

      for (const target of companyTargets) {
        const match = matchIssuedNote(notes, target);
        divergences.push({
          nfseId: target.id,
          rpsNumber: target.rpsNumber,
          rpsSeries: target.rpsSeries,
          status: target.status,
          foundAtProvider: !!match,
        });

        if (match && !dryRun) {
          // A correção reusa a reconciliação individual: uma regra só decide o estado, e ela
          // reconsulta pela chave natural antes de gravar. A varredura por período só diz quem olhar.
          await this.reconcileNfse.execute({ nfseId: target.id });
          corrected += 1;
        }
      }
    }

    this.logger.debug(LogContext.NFS_GENERATION, {
      adapter: 'nfse',
      action: 'reconcileNfsePeriod',
      reason: `período ${input.startDate}..${input.endDate}: `
        + `${targets.length} conferida(s), ${corrected} corrigida(s), ${pagesRead} página(s), dryRun=${dryRun}`,
    });

    return { checked: targets.length, corrected, pagesRead, divergences, dryRun };
  }

  /**
   * Pagina até o provedor sinalizar o fim (`endOfPages`: E212 ou página incompleta). Erro que não
   * seja fim de página (`errors` preenchido) aborta o job — não engolir como "corrigiu 0".
   */
  private async readAllPages(
    companyId: number,
    startDate: string,
    endDate: string,
  ): Promise<{ notes: NfsIssuedNoteDto[]; pages: number }> {
    const [providerConfig, company] = await Promise.all([
      this.findCompanyNfsConfigByCompanyId.execute(companyId),
      this.findCompanyById.execute(companyId),
    ]);

    const provider: NfsProviderCredentialsDto = {
      certFilePath: providerConfig.certFilePath,
      certPasswordEnvVar: providerConfig.certPasswordEnvVar,
      environment: providerConfig.environment as NfsProviderEnvironment,
      vendorConfig: providerConfig.vendorConfig,
    };

    const notes: NfsIssuedNoteDto[] = [];
    let pages = 0;

    for (let page = 1; page <= MAX_PAGES_PER_COMPANY; page += 1) {
      const result = await this.nfsGenerationGateway.listIssuedNfseByPeriod({
        startDate,
        endDate,
        page,
        providerDocument: company.document,
        providerMunicipalRegistration: providerConfig.municipalRegistration,
        provider,
      });

      pages += 1;
      notes.push(...result.notes);

      if (result.errors?.length) {
        const detail = result.errors.map((error) => `${error.code}: ${error.message}`).join('; ');
        throw new ExternalApiError(`Erro ao consultar NFS-e por período no Giss: ${detail}`);
      }

      if (result.endOfPages) {
        break;
      }
    }

    return { notes, pages };
  }

  private static groupByCompany(targets: NfseReconcileTargetDto[]): Map<number, NfseReconcileTargetDto[]> {
    const grouped = new Map<number, NfseReconcileTargetDto[]>();

    for (const target of targets) {
      const bucket = grouped.get(target.companyId);
      if (bucket) {
        bucket.push(target);
      }
      else {
        grouped.set(target.companyId, [target]);
      }
    }

    return grouped;
  }

  /** As datas chegam como dia civil de São Paulo; o banco guarda instantes UTC. */
  private static toRange(startDate: string, endDate: string): { periodStart: Date; periodEnd: Date } {
    const periodStart = DateTime.fromISO(startDate, { zone: SAO_PAULO_TIMEZONE }).startOf('day');
    const periodEnd = DateTime.fromISO(endDate, { zone: SAO_PAULO_TIMEZONE }).startOf('day').plus({ days: 1 });

    return { periodStart: periodStart.toJSDate(), periodEnd: periodEnd.toJSDate() };
  }
}
