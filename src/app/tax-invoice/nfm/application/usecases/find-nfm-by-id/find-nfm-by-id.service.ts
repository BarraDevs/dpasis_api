import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { NfmNfseMissingError } from '../../../domain/errors/nfm-nfse-missing.error';
import { NfmNotFoundError } from '../../../domain/errors/nfm-not-found.error';
import { NfmWithNfseDto } from '../../dtos/nfm.dto';
import type { INfmDao } from '../../persistence/dao/nfm-dao.interface';

@Injectable()
export class FindNfmById {
  constructor(
    @Inject(TOKENS.NfmDao) private readonly nfmDao: INfmDao,
  ) {}

  public async execute(id: number): Promise<NfmWithNfseDto> {
    const result = await this.nfmDao.findById(id);
    if (!result) {
      throw new NfmNotFoundError();
    }
    if (!result.nfse) {
      throw new NfmNfseMissingError(id);
    }

    return {
      ...result,
      nfse: result.nfse,
    };
  }
}
