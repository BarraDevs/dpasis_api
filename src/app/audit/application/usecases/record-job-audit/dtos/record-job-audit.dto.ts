export class RecordJobAuditInputDto {
  /** Nome do job ou da rotina que executou a transição. */
  jobName: string;
  nfseId: number;
  /** Estado antes e depois. `from` nulo quando a transição não parte de um estado conhecido. */
  from?: string | null;
  to: string;
  /** Motivo, mensagem do provedor ou origem da decisão. */
  reason?: string | null;
  /** `false` quando a transição registra uma falha. Vira o `statusCode` da linha de auditoria. */
  succeeded?: boolean;
}
