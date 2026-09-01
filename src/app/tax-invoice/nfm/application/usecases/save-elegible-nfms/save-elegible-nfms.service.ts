import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import type { INfseRepository } from 'src/app/tax-invoice/nfse/application/persistence/repository/nfse-repository.interface';
import { IssueNfse } from 'src/app/tax-invoice/nfse/application/usecases/issue-nfse/issue-nfse.service';
import { TOKENS } from 'src/core/di/token';
import { AppException } from 'src/core/filters/app.exception';
import { Nfm } from '../../../domain/entities/nfm.entity';
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
    @Inject(TOKENS.NfseRepository) private readonly nfseRepository: INfseRepository,
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

    const now = new Date();
    const referenceMonth = now.getMonth() + 1;
    const referenceYear = now.getFullYear();

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
        const issued = await this.issueNfse.execute(issueInput);

        const nfse = await this.nfseRepository.findById(issued.id);
        if (!nfse) {
          throw new AppException(`NFS-e ${issued.id} não encontrada após emissão.`);
        }

        nfm.linkNfse(nfse);
        await this.nfmRepository.edit(nfm);

        result.created += 1;
      }
      catch (error: unknown) {
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
