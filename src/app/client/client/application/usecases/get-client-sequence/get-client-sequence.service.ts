import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { IClientSequenceRepository } from '../../persistence/repository/client-sequence-repository.interface';
import { GetClientSequenceOutputDto } from './dtos/get-client-sequence.dto';

@Injectable()
export class GetClientSequence {
  constructor(
    @Inject(TOKENS.ClientSequenceRepository) private readonly clientSequenceRepository: IClientSequenceRepository,
  ) {}

  public async execute(): Promise<GetClientSequenceOutputDto> {
    const nextId = await this.clientSequenceRepository.getCurrent();
    return { nextId };
  }
}
