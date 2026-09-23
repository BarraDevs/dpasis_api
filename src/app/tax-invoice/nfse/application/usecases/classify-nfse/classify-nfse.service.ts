import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { DuplicateNfseClassificationError } from '../../../domain/errors/duplicate-nfse-classification.error';
import { normalizeRpsSeries } from '../../helpers/normalize-rps-series';
import type { INfseClassificationDao } from '../../persistence/dao/nfse-classification-dao.interface';
import { ClassifyNfseInputDto, ClassifyNfseOutputDto } from './dtos/classify-nfse.dto';

@Injectable()
export class ClassifyNfse {
  constructor(
    @Inject(TOKENS.NfseClassificationDao) private readonly dao: INfseClassificationDao,
  ) {}

  public async execute(data: ClassifyNfseInputDto): Promise<ClassifyNfseOutputDto> {
    const seen = new Set<string>();
    const items = data.items.map((item) => {
      const rpsSeries = normalizeRpsSeries(item.rpsSeries);
      const key = `${rpsSeries}:${item.rpsNumber}`;
      if (seen.has(key)) {
        throw new DuplicateNfseClassificationError();
      }
      seen.add(key);
      return {
        rpsNumber: item.rpsNumber,
        rpsSeries,
        kind: item.kind,
      };
    });

    await this.dao.upsertMany(data.companyId, items);

    return { message: 'NFS-e classificadas com sucesso' };
  }
}
