import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { NfDto } from 'src/infra/nf-generation/dtos/nf.dto';
import type { INfGenerationGateway } from 'src/infra/nf-generation/nf-generation.gateway';
import { FindAllNfmsQueryDto } from './dtos/find-all-nfms.dto';

@Injectable()
export class FindAllNfms {
  constructor(
    @Inject(TOKENS.NfGenerationGateway) private readonly nfGenerationGateway: INfGenerationGateway,
  ) {}

  public async execute(queries: FindAllNfmsQueryDto): Promise<NfDto[]> {
    return this.nfGenerationGateway.findAll(queries);
  }
}
