import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseDto } from '../../dtos/nfse.dto';
import type { INfseDao } from '../../persistence/dao/nfse-dao.interface';

@Injectable()
export class FindNfseById {
  constructor(
    @Inject(TOKENS.NfseDao) private readonly nfseDao: INfseDao,
  ) {}

  public async execute(id: number): Promise<NfseDto> {
    const result = await this.nfseDao.findById(id);
    if (!result) {
      throw new NfseNotFoundError();
    }

    return result;
  }
}
