import { Inject, Injectable } from '@nestjs/common';
import { CancelNfse } from 'src/app/tax-invoice/nfse/application/usecases/cancel-nfse/cancel-nfse.service';
import { TOKENS } from 'src/core/di/token';
import { NfmNotFoundError } from '../../../domain/errors/nfm-not-found.error';
import type { INfmRepository } from '../../persistence/repository/nfm-repository.interface';
import { CancelNfmInputDto, CancelNfmOutputDto } from './dtos/cancel-nfm.dto';

@Injectable()
export class CancelNfm {
  constructor(
    @Inject(TOKENS.NfmRepository) private readonly nfmRepository: INfmRepository,
    private readonly cancelNfse: CancelNfse,
  ) {}

  public async execute(nfmId: number, input: CancelNfmInputDto): Promise<CancelNfmOutputDto> {
    const nfm = await this.nfmRepository.findById(nfmId);
    if (!nfm) {
      throw new NfmNotFoundError();
    }

    nfm.ensureCanCancel();

    const result = await this.cancelNfse.execute(nfm.props.nfse!.props.id, input);

    return {
      id: nfmId,
      status: result.status,
      canceledAt: result.canceledAt,
    };
  }
}
