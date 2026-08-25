import { Injectable } from '@nestjs/common';
import { CancelNfse } from 'src/app/tax-invoice/nfse/application/usecases/cancel-nfse/cancel-nfse.service';
import { FindNfmById } from '../find-nfm-by-id/find-nfm-by-id.service';
import { CancelNfmInputDto, CancelNfmOutputDto } from './dtos/cancel-nfm.dto';

@Injectable()
export class CancelNfm {
  constructor(
    private readonly findNfmById: FindNfmById,
    private readonly cancelNfse: CancelNfse,
  ) {}

  public async execute(nfmId: number, input: CancelNfmInputDto): Promise<CancelNfmOutputDto> {
    const nfm = await this.findNfmById.execute(nfmId);
    const result = await this.cancelNfse.execute(nfm.nfse.id, input);

    return {
      id: nfmId,
      status: result.status,
      canceledAt: result.canceledAt,
    };
  }
}
