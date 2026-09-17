import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NfmAlreadyHasActiveNfseError } from 'src/app/tax-invoice/nfm/domain/errors/nfm-already-has-active-nfse.error';
import {
  INfseRepository,
  ReserveNfseInput,
  ReserveNfseOutput,
} from 'src/app/tax-invoice/nfse/application/persistence/repository/nfse-repository.interface';
import { Nfse } from 'src/app/tax-invoice/nfse/domain/entities/nfse.entity';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { NfseFactory } from 'src/app/tax-invoice/nfse/domain/factories/nfse.factory';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

/**
 * O índice único parcial é criado por migration e não existe no schema Prisma. A violação chega
 * como P2002 genérico, e o `meta.target` traz ora o nome do índice, ora a lista de colunas — por
 * isso os dois identificadores. Nenhuma outra restrição única de `nfses` envolve `nfmId`, então
 * casar por qualquer um dos dois não confunde este índice com o de RPS duplicado.
 */
const ONE_ACTIVE_NFSE_PER_NFM_MARKERS = ['nfses_one_active_per_nfm', 'nfmId'];

/**
 * Toda NFS-e nasce com uma consulta ao provedor agendada. Se o caminho normal (fila → lote →
 * consulta do lote) funcionar, a nota chega a `ISSUED` muito antes disso e o agendamento morre
 * junto. Se não funcionar — job perdido, Redis reiniciado, worker morto —, é este relógio que
 * garante que alguém pergunte ao Giss em vez de a nota ficar parada esperando um job que não existe.
 */
const FIRST_RECONCILE_DELAY_MS = 15 * 60_000;

const NfseSelect = {
  id: true,
  companyId: true,
  clientId: true,
  rpsNumber: true,
  rpsSeries: true,
  status: true,
  batchProtocol: true,
  nfseNumber: true,
  verificationCode: true,
  issuedAt: true,
  errorMessage: true,
  canceledAt: true,
  cancelReasonCode: true,
  bankPaymentProvider: true,
  bankPaymentRequestCode: true,
  bankPaymentIdempotencyKey: true,
  bankPaymentRequestedAt: true,
  bankPaymentErrorMessage: true,
  bankPaymentFailedAt: true,
  bankPaymentStatus: true,
  bankPaymentConfirmedAt: true,
  bankPaymentSettledAt: true,
  bankPaymentNextSettlementAt: true,
  bankPaymentRetryCount: true,
  bankPaymentNextRetryAt: true,
  reconcileAttemptCount: true,
  nextReconcileAt: true,
  providerAlerts: true,
  providerAlertedAt: true,
  nfmId: true,
  data: true,
  createdAt: true,
} satisfies Prisma.NfseSelect;

@Injectable()
export class NfseRepositoryAdapterPrisma implements INfseRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Uma transação só para: travar a NFM, consumir o número de RPS, criar a NFS-e, gravar o vínculo
   * dos dois lados e registrar o despacho no outbox.
   *
   * A ordem importa. O `FOR UPDATE` na linha da NFM serializa duas requisições concorrentes para a
   * mesma NFM (P1-05) — sem ele as duas leem `nfseId = NULL` e as duas emitem. O `getAndIncrement`
   * do RPS entra aqui dentro para que o rollback devolva o número (P2-02): fora da transação, toda
   * falha posterior queimava um número que a prefeitura depois cobra explicação.
   */
  public async reserve(input: ReserveNfseInput): Promise<ReserveNfseOutput> {
    try {
      return await this.prisma.$transaction(async(tx) => {
        if (input.nfmId !== null) {
          await tx.$executeRaw`SELECT id FROM nfms WHERE id = ${input.nfmId} FOR UPDATE`;
        }

        const sequence = await tx.$queryRaw<[{ next_id: bigint }]>`
          INSERT INTO nfse_rps_sequences (company_id, next_id, updated_at)
          VALUES (${input.companyId}, 2, NOW())
          ON CONFLICT (company_id)
          DO UPDATE SET next_id = nfse_rps_sequences.next_id + 1, updated_at = NOW()
          RETURNING next_id - 1 AS next_id
        `;
        const rpsNumber = Number(sequence[0].next_id);

        const nfse = await tx.nfse.create({
          data: {
            companyId: input.companyId,
            clientId: input.clientId,
            nfmId: input.nfmId,
            rpsNumber,
            rpsSeries: input.rpsSeries,
            status: NfseStatus.PENDING,
            nextReconcileAt: new Date(Date.now() + FIRST_RECONCILE_DELAY_MS),
            data: input.data as unknown as Prisma.InputJsonValue,
          },
          select: { id: true },
        });

        if (input.nfmId !== null) {
          await tx.nfm.update({
            where: { id: input.nfmId },
            data: { nfseId: nfse.id },
          });
        }

        const outbox = await tx.nfseOutbox.create({
          data: {
            nfseId: nfse.id,
            jobName: input.jobName,
            payload: { nfseId: nfse.id } as Prisma.InputJsonValue,
          },
          select: { id: true },
        });

        return { nfseId: nfse.id, rpsNumber, outboxId: outbox.id };
      });
    }
    catch (error: unknown) {
      if (input.nfmId !== null && NfseRepositoryAdapterPrisma.isActiveNfsePerNfmViolation(error)) {
        throw new NfmAlreadyHasActiveNfseError(input.nfmId);
      }
      throw error;
    }
  }

  public async markOutboxDispatched(outboxId: number): Promise<void> {
    await this.prisma.nfseOutbox.update({
      where: { id: outboxId },
      data: { dispatchedAt: new Date() },
    });
  }

  /** Ver `ONE_ACTIVE_NFSE_PER_NFM_MARKERS`. */
  private static isActiveNfsePerNfmViolation(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      return false;
    }

    const target = error.meta?.target;
    const entries = Array.isArray(target) ? target.map(String) : [String(target ?? '')];
    return entries.some((entry) => ONE_ACTIVE_NFSE_PER_NFM_MARKERS.some((marker) => entry.includes(marker)));
  }

  public async save(entity: Nfse): Promise<number> {
    const props = entity.props;

    const row = await this.prisma.nfse.create({
      data: {
        companyId: props.companyId,
        clientId: props.clientId,
        rpsNumber: props.rpsNumber,
        rpsSeries: props.rpsSeries,
        status: props.status,
        data: props.data as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    return row.id;
  }

  public async edit(entity: Nfse): Promise<void> {
    const props = entity.props;

    await this.prisma.nfse.update({
      where: { id: props.id },
      data: {
        status: props.status,
        batchProtocol: props.batchProtocol,
        nfseNumber: props.nfseNumber,
        verificationCode: props.verificationCode,
        issuedAt: props.issuedAt,
        errorMessage: props.errorMessage,
        canceledAt: props.canceledAt,
        cancelReasonCode: props.cancelReasonCode,
        bankPaymentProvider: props.bankPaymentProvider,
        bankPaymentRequestCode: props.bankPaymentRequestCode,
        bankPaymentIdempotencyKey: props.bankPaymentIdempotencyKey,
        bankPaymentRequestedAt: props.bankPaymentRequestedAt,
        bankPaymentErrorMessage: props.bankPaymentErrorMessage,
        bankPaymentFailedAt: props.bankPaymentFailedAt,
        bankPaymentStatus: props.bankPaymentStatus,
        bankPaymentConfirmedAt: props.bankPaymentConfirmedAt,
        bankPaymentSettledAt: props.bankPaymentSettledAt ?? null,
        bankPaymentNextSettlementAt: props.bankPaymentNextSettlementAt ?? null,
        bankPaymentRetryCount: props.bankPaymentRetryCount ?? 0,
        bankPaymentNextRetryAt: props.bankPaymentNextRetryAt ?? null,
        reconcileAttemptCount: props.reconcileAttemptCount,
        nextReconcileAt: props.nextReconcileAt,
        providerAlerts: props.providerAlerts,
        providerAlertedAt: props.providerAlertedAt,
        data: props.data as unknown as Prisma.InputJsonValue,
      },
    });
  }

  public async markProviderAlertsNotified(ids: number[], notifiedAt: Date): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.prisma.nfse.updateMany({
      where: { id: { in: ids }, providerAlertedAt: null },
      data: { providerAlertedAt: notifiedAt },
    });
  }

  /**
   * `UPDATE` condicional em vez de ler e regravar: todas as réplicas rodam a mesma varredura no
   * mesmo minuto, e só a que ganhar a linha enfileira. A condição repete o que a varredura leu —
   * retentativa vencida, nota emitida e ainda sem cobrança — porque entre a leitura e o `UPDATE` o
   * job anterior pode ter vinculado o boleto.
   */
  public async claimBankPaymentRetry(nfseId: number, now: Date, leaseUntil: Date): Promise<boolean> {
    const { count } = await this.prisma.nfse.updateMany({
      where: {
        id: nfseId,
        status: NfseStatus.ISSUED,
        bankPaymentRequestCode: null,
        bankPaymentNextRetryAt: { lte: now },
      },
      data: {
        bankPaymentNextRetryAt: leaseUntil,
        bankPaymentRetryCount: { increment: 1 },
      },
    });

    return count === 1;
  }

  public async claimBankPaymentSettlement(nfseId: number, now: Date, leaseUntil: Date): Promise<boolean> {
    const { count } = await this.prisma.nfse.updateMany({
      where: {
        id: nfseId,
        bankPaymentRequestCode: { not: null },
        bankPaymentConfirmedAt: { not: null },
        bankPaymentSettledAt: null,
        bankPaymentFailedAt: null,
        bankPaymentNextSettlementAt: { lte: now },
      },
      data: {
        bankPaymentNextSettlementAt: leaseUntil,
      },
    });

    return count === 1;
  }

  public async findById(id: number): Promise<Nfse | null> {
    const row = await this.prisma.nfse.findUnique({
      where: { id },
      select: NfseSelect,
    });

    return row ? this.toEntity(row) : null;
  }

  public async findByBankPaymentRequestCode(requestCode: string): Promise<Nfse | null> {
    const row = await this.prisma.nfse.findFirst({
      where: { bankPaymentRequestCode: requestCode },
      select: NfseSelect,
    });

    return row ? this.toEntity(row) : null;
  }

  private toEntity(row: Prisma.NfseGetPayload<{ select: typeof NfseSelect }>): Nfse {
    return NfseFactory.load({
      id: row.id,
      companyId: row.companyId,
      clientId: row.clientId,
      rpsNumber: row.rpsNumber,
      rpsSeries: row.rpsSeries,
      status: row.status as NfseStatus,
      batchProtocol: row.batchProtocol,
      nfseNumber: row.nfseNumber,
      verificationCode: row.verificationCode,
      issuedAt: row.issuedAt,
      errorMessage: row.errorMessage,
      canceledAt: row.canceledAt,
      cancelReasonCode: row.cancelReasonCode,
      bankPaymentProvider: row.bankPaymentProvider,
      bankPaymentRequestCode: row.bankPaymentRequestCode,
      bankPaymentIdempotencyKey: row.bankPaymentIdempotencyKey,
      bankPaymentRequestedAt: row.bankPaymentRequestedAt,
      bankPaymentErrorMessage: row.bankPaymentErrorMessage,
      bankPaymentFailedAt: row.bankPaymentFailedAt,
      bankPaymentStatus: row.bankPaymentStatus,
      bankPaymentConfirmedAt: row.bankPaymentConfirmedAt,
      bankPaymentSettledAt: row.bankPaymentSettledAt,
      bankPaymentNextSettlementAt: row.bankPaymentNextSettlementAt,
      bankPaymentRetryCount: row.bankPaymentRetryCount,
      bankPaymentNextRetryAt: row.bankPaymentNextRetryAt,
      reconcileAttemptCount: row.reconcileAttemptCount,
      nextReconcileAt: row.nextReconcileAt,
      providerAlerts: row.providerAlerts,
      providerAlertedAt: row.providerAlertedAt,
      nfmId: row.nfmId,
      createdAt: row.createdAt,
      data: row.data as Record<string, unknown>,
    });
  }
}
