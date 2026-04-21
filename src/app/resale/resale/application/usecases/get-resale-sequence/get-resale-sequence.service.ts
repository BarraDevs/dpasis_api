import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { IResaleSequenceRepository } from '../../persistence/repository/resale-sequence-repository.interface';
import { GetResaleSequenceOutputDto } from './dtos/get-resale-sequence.dto';

@Injectable()
export class GetResaleSequence {
  constructor(
    @Inject(TOKENS.ResaleSequenceRepository) private readonly resaleSequenceRepository: IResaleSequenceRepository,
  ) {}

  public async execute(): Promise<GetResaleSequenceOutputDto> {
    const nextId = await this.resaleSequenceRepository.getCurrent();
    return { nextId };
  }
}
