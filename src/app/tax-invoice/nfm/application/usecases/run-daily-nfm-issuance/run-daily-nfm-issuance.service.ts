import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { SAO_PAULO_TIMEZONE } from 'src/core/constants/timezone.constant';
import { TOKENS } from 'src/core/di/token';
import type { IAlertGateway } from 'src/infra/alert/alert.gateway';
import { AlertType } from 'src/infra/alert/enums/alert-type.enum';
import type { ICacheGateway } from 'src/infra/cache/cache.gateway';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { SaveElegibleNfmsOutputDto } from '../save-elegible-nfms/dtos/save-elegible-nfms.dto';
import { SaveElegibleNfms } from '../save-elegible-nfms/save-elegible-nfms.service';

/** Um pouco menos de 24h: a trava expira antes do fechamento seguinte, sem deixar o dia sem dono. */
const LOCK_TTL_IN_SECONDS = 82_800;
const MAX_ERRORS_IN_ALERT = 20;

@Injectable()
export class RunDailyNfmIssuance {
  constructor(
    private readonly saveElegibleNfms: SaveElegibleNfms,
    @Inject(TOKENS.CacheGateway) private readonly cacheGateway: ICacheGateway,
    @Inject(TOKENS.AlertGateway) private readonly alertGateway: IAlertGateway,
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
  ) {}

  /**
   * Fechamento diário automático.
   *
   * Até aqui o faturamento inteiro dependia de alguém abrir a tela e apertar o botão no dia certo:
   * um feriado, umas férias ou um esquecimento e os contratos daquele dia não eram emitidos — e no
   * dia seguinte o filtro de igualdade não os alcançava mais.
   *
   * **A trava é fail-closed**, ao contrário da usada nos alertas. Lá, falhar em reivindicar significa
   * mandar o e-mail assim mesmo, porque duplicar um aviso é barato. Aqui, duas réplicas rodando o
   * mesmo fechamento é o caminho para uma segunda NFS-e — o único erro irreversível deste fluxo.
   * Sem certeza de exclusividade, não emite: avisa e sai.
   */
  public async execute(): Promise<SaveElegibleNfmsOutputDto | null> {
    const today = DateTime.now().setZone(SAO_PAULO_TIMEZONE).toFormat('yyyy-MM-dd');
    const lockKey = `cron:nfm-daily-issuance:${today}`;

    let claimed: boolean;
    try {
      claimed = await this.cacheGateway.setIfAbsent(lockKey, new Date().toISOString(), LOCK_TTL_IN_SECONDS);
    }
    catch (error: unknown) {
      this.logger.error(LogContext.CACHE, { adapter: 'redis', action: 'setIfAbsent', key: lockKey, error });
      await this.alert(`[NFM] Fechamento de ${today} não executado: trava indisponível`, [
        'Não foi possível garantir execução única (Redis indisponível), então nada foi emitido.',
        'Emitir manualmente por POST /admin/nfm depois de confirmar que nenhuma réplica emitiu.',
      ]);
      return null;
    }

    if (!claimed) {
      this.logger.debug(LogContext.NFS_GENERATION, {
        adapter: 'nfm',
        action: 'runDailyNfmIssuance',
        errorMessage: `Fechamento de ${today} já reivindicado por outra instância`,
      });
      return null;
    }

    try {
      const result = await this.saveElegibleNfms.execute();

      this.logger.debug(LogContext.NFS_GENERATION, {
        adapter: 'nfm',
        action: 'runDailyNfmIssuance',
        errorMessage: `Fechamento de ${today}: ${result.created} criada(s), ${result.skipped} pulada(s), ${result.failed} falha(s)`,
      });

      if (result.failed > 0) {
        await this.alert(
          `[NFM] Fechamento de ${today} terminou com ${result.failed} falha(s)`,
          [
            `criadas=${result.created} · puladas=${result.skipped} · falhas=${result.failed}`,
            ...result.errors.slice(0, MAX_ERRORS_IN_ALERT)
              .map((error) => `clientId=${error.clientId} · cnaeNbsIndopId=${error.cnaeNbsIndopId} · motivo="${error.message}"`),
          ],
        );
      }

      return result;
    }
    catch (error: unknown) {
      // A varredura não pode derrubar o agendador, mas também não pode falhar em silêncio: sem
      // alerta, um fechamento que não aconteceu só aparece quando o cliente cobra a nota.
      this.logger.error(LogContext.NFS_GENERATION, { adapter: 'nfm', action: 'runDailyNfmIssuance', error });
      await this.alert(`[NFM] Fechamento de ${today} falhou`, [
        `Erro: ${error instanceof Error ? error.message : String(error)}`,
        'A trava do dia continua tomada; reexecutar por POST /admin/nfm depois de conferir o que foi criado.',
      ]);
      return null;
    }
  }

  private async alert(subject: string, lines: string[]): Promise<void> {
    await this.alertGateway.send({ type: AlertType.NfmDailyIssuance, subject, lines });
  }
}
