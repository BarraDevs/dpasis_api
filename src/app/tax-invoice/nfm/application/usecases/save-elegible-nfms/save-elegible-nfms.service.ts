import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { IssueNfse } from 'src/app/tax-invoice/nfse/application/usecases/issue-nfse/issue-nfse.service';
import { TOKENS } from 'src/core/di/token';
import { AppException } from 'src/core/filters/app.exception';
import { NfmStatus } from '../../../domain/enums/nfm-status.enum';
import { NfmToIssueNfseMapper } from '../../mappers/nfm-to-issue-nfse.mapper';
import type { INfmDao } from '../../persistence/dao/nfm-dao.interface';
import { FindElegibleClients } from '../find-elegible-clients/find-elegible-clients.service';
import {
  SaveElegibleNfmErrorDto,
  SaveElegibleNfmsOutputDto,
} from './dtos/save-elegible-nfms.dto';

@Injectable()
export class SaveElegibleNfms {
  constructor(
    @Inject(TOKENS.NfmDao) private readonly nfmDao: INfmDao,
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

    if (elegibles.length === 0) {
      return result;
    }

    const now = new Date();
    const referenceMonth = now.getMonth() + 1;
    const referenceYear = now.getFullYear();

    for (const nfm of elegibles) {
      const cnaeNbsIndopId = nfm.clientItems[0]?.cnaeNbsIndop.id;
      const clientId = nfm.client.id;

      if (!cnaeNbsIndopId) {
        result.failed += 1;
        result.errors.push({
          clientId,
          cnaeNbsIndopId: 0,
          message: 'Grupo NFM sem itens de serviço.',
        });
        continue;
      }

      try {
        let nfmId: number;
        const existing = await this.nfmDao.findByClientReferenceAndCnae(
          clientId,
          referenceMonth,
          referenceYear,
          cnaeNbsIndopId,
        );

        if (existing?.nfseId) {
          result.skipped += 1;
          continue;
        }

        if (existing) {
          nfmId = existing.id;
        }
        else {
          nfmId = await this.nfmDao.save({
            clientId,
            clientDocument: nfm.client.document,
            companyName: nfm.client.companyName,
            status: NfmStatus.PENDING,
            referenceMonth,
            referenceYear,
            totalValueInCents: nfm.clientItems.reduce((sum, item) => sum + item.totalValueInCents, 0),
            cnaeNbsIndopId,
            nfseId: null,
            data: nfm,
          });
        }

        const providerConfig = await this.findCompanyNfsConfigByCompanyId.execute(nfm.client.company.id);
        const issueInput = NfmToIssueNfseMapper.toIssueNfseInput(nfm, providerConfig);
        const issued = await this.issueNfse.execute(issueInput);

        await this.nfmDao.edit(nfmId, {
          nfseId: issued.id,
          status: NfmStatus.PENDING,
        });

        result.created += 1;
      }
      catch (error: unknown) {
        result.failed += 1;
        const message = this.resolveErrorMessage(error);
        const errorDto: SaveElegibleNfmErrorDto = { clientId, cnaeNbsIndopId, message };
        result.errors.push(errorDto);

        const existing = await this.nfmDao.findByClientReferenceAndCnae(
          clientId,
          referenceMonth,
          referenceYear,
          cnaeNbsIndopId,
        );
        if (existing && !existing.nfseId) {
          await this.nfmDao.edit(existing.id, { status: NfmStatus.FAILED, nfseId: null });
        }
      }
    }

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
