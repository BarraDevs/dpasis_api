import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { SAO_PAULO_TIMEZONE } from 'src/core/constants/timezone.constant';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { IssueNfse } from 'src/app/tax-invoice/nfse/application/usecases/issue-nfse/issue-nfse.service';
import { TOKENS } from 'src/core/di/token';
import { AppException } from 'src/core/filters/app.exception';
import { Nfm } from '../../../domain/entities/nfm.entity';
import { NfmAlreadyHasActiveNfseError } from '../../../domain/errors/nfm-already-has-active-nfse.error';
import { NfmWithoutServiceItemsError } from '../../../domain/errors/nfm-without-service-items.error';
import { NfmFactory } from '../../../domain/factories/nfm.factory';
import { NfmToIssueNfseMapper } from '../../mappers/nfm-to-issue-nfse.mapper';
import type { INfmCronRunDao } from '../../persistence/dao/nfm-cron-run-dao.interface';
import type { INfmRepository } from '../../persistence/repository/nfm-repository.interface';
import { FindElegibleClients } from '../find-elegible-clients/find-elegible-clients.service';
import {
  SaveElegibleNfmErrorDto,
  SaveElegibleNfmsOutputDto,
} from './dtos/save-elegible-nfms.dto';

@Injectable()
export class SaveElegibleNfms {
  constructor(
    @Inject(TOKENS.NfmRepository) private readonly nfmRepository: INfmRepository,
    @Inject(TOKENS.NfmCronRunDao) private readonly nfmCronRunDao: INfmCronRunDao,
    private readonly findElegibleClients: FindElegibleClients,
    private readonly findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId,
    private readonly issueNfse: IssueNfse,
  ) {}

  public async execute(): Promise<SaveElegibleNfmsOutputDto> {
    const elegibles = await this.findElegibleClients.execute();

    const result: SaveElegibleNfmsOutputDto = {
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    // Competência pelo fuso de Brasília: em UTC, a virada do mês aconteceria três horas antes e o
    // fechamento do dia 30 à noite gravaria a competência do mês seguinte.
    //
    // Uma NFM atrasada — vencimento 15 faturado no dia 20 — nasce com a competência do mês corrente e
    // a data de hoje, como decidido pela operação. Quem cuida de o boleto não vencer no passado é o
    // piso de vencimento em `NfseToIssueBankPaymentMapper`.
    const now = DateTime.now().setZone(SAO_PAULO_TIMEZONE);
    const referenceMonth = now.month;
    const referenceYear = now.year;

    for (const elegible of elegibles) {
      const cnaeNbsIndopId = elegible.clientItems[0]?.cnaeNbsIndop.id;
      const clientId = elegible.client.id;

      if (!cnaeNbsIndopId) {
        result.failed += 1;
        result.errors.push({
          clientId,
          cnaeNbsIndopId: 0,
          message: new NfmWithoutServiceItemsError().message,
        });
        continue;
      }

      try {
        const existing = await this.nfmRepository.findByClientReferenceAndCnae(
          clientId,
          referenceMonth,
          referenceYear,
          cnaeNbsIndopId,
        );

        if (existing?.hasNfse()) {
          result.skipped += 1;
          continue;
        }

        let nfm: Nfm;
        if (existing) {
          nfm = existing;
        }
        else {
          const created = NfmFactory.create({
            clientId,
            clientDocument: elegible.client.document,
            companyName: elegible.client.companyName,
            referenceMonth,
            referenceYear,
            totalValueInCents: elegible.clientItems.reduce((sum, item) => sum + item.totalValueInCents, 0),
            cnaeNbsIndopId,
            data: elegible as unknown as Record<string, unknown>,
          });
          const id = await this.nfmRepository.save(created);
          nfm = NfmFactory.load({ ...created.props, id });
        }

        const providerConfig = await this.findCompanyNfsConfigByCompanyId.execute(elegible.client.company.id);
        const issueInput = NfmToIssueNfseMapper.toIssueNfseInput(elegible, providerConfig);

        // O vínculo NFM -> NFS-e agora nasce dentro da transação de `IssueNfse`; não há mais uma
        // janela entre "NFS-e criada" e "NFM sabe da NFS-e" para um crash aproveitar.
        await this.issueNfse.execute({ ...issueInput, nfmId: nfm.props.id });

        result.created += 1;
      }
      catch (error: unknown) {
        // O índice único parcial recusou porque já existe NFS-e viva para esta NFM — é a corrida do
        // P1-05 perdendo, não um erro de emissão. Contar como falha faria o relatório acusar um
        // problema onde a guarda funcionou.
        if (error instanceof NfmAlreadyHasActiveNfseError) {
          result.skipped += 1;
          continue;
        }

        const message = this.resolveErrorMessage(error);
        const errorDto: SaveElegibleNfmErrorDto = { clientId, cnaeNbsIndopId, message };
        result.failed += 1;
        result.errors.push(errorDto);
      }
    }

    await this.nfmCronRunDao.save(result);

    return result;
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof AppException) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Erro desconhecido ao emitir NFS-e para NFM.';
  }
}
