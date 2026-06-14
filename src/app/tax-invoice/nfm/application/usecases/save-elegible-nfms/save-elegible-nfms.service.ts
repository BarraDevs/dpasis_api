import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { NfmStatus } from '../../../domain/enums/nfm-status.enum';
import type { INfmDao } from '../../persistence/dao/nfm-dao.interface';
import { FindElegibleClients } from '../find-elegible-clients/find-elegible-clients.service';
import { SaveElegibleNfmsOutputDto, SaveNfmData } from './dtos/save-elegible-nfms.dto';

@Injectable()
export class SaveElegibleNfms {
  constructor(
    @Inject(TOKENS.NfmDao) private readonly nfmDao: INfmDao,
    private readonly findElegibleClients: FindElegibleClients,
  ) {}

  public async execute(): Promise<SaveElegibleNfmsOutputDto> {
    const elegibles = await this.findElegibleClients.execute();

    if (elegibles.length === 0) {
      return { created: 0 };
    }

    const now = new Date();
    const referenceMonth = now.getMonth() + 1;
    const referenceYear = now.getFullYear();

    const rows: SaveNfmData[] = elegibles.map(nfm => ({
      clientId: nfm.client.id,
      clientDocument: nfm.client.document,
      companyName: nfm.client.companyName,
      status: NfmStatus.PENDING,
      referenceMonth,
      referenceYear,
      totalValueInCents: nfm.clientItems.reduce((sum, item) => sum + item.totalValueInCents, 0),
      data: nfm,
    }));

    const created = await this.nfmDao.saveMany(rows);

    return { created };
  }
}
