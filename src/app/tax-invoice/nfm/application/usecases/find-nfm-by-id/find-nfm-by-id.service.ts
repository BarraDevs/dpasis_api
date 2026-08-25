import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
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

    return result;
  }
}
