import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { IAuditLogDao } from '../../persistence/dao/audit-log-dao.interface';
import { RecordJobAuditInputDto } from './dtos/record-job-audit.dto';

/** Distingue as linhas do caminho assíncrono das mutações HTTP, na mesma tabela. */
export const JOB_AUDIT_METHOD = 'JOB';

@Injectable()
export class RecordJobAudit {
  constructor(
    @Inject(TOKENS.AuditLogDao) private readonly auditLogDao: IAuditLogDao,
  ) {}

  /**
   * Trilha das transições que acontecem fora de uma requisição.
   *
   * O interceptor de auditoria só enxerga HTTP, e as decisões que mais importam neste fluxo —
   * marcar uma nota como emitida, rejeitada ou aguardando o provedor, vincular um boleto — acontecem
   * dentro de jobs. Sem isto, a pergunta "quem mudou esta nota, quando e por quê" não tinha resposta
   * fora dos logs.
   *
   * Fire-and-forget, como o interceptor: auditoria não pode derrubar o job que ela observa.
   */
  public record(input: RecordJobAuditInputDto): void {
    void this.auditLogDao.save({
      accountId: null,
      method: JOB_AUDIT_METHOD,
      url: `job:${input.jobName}`,
      params: { nfseId: input.nfseId },
      body: {
        from: input.from ?? null,
        to: input.to,
        reason: input.reason ?? null,
      },
      statusCode: input.succeeded === false ? 500 : 200,
      ip: null,
    }).catch(() => {
      // Silêncio deliberado: a linha de auditoria não vale o preço de interromper a transição.
    });
  }
}
