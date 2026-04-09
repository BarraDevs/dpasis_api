import { Inject, Injectable } from '@nestjs/common';
import { BilledFactory } from 'src/app/service/billed/domain/factories/billed.factory';
import { TOKENS } from 'src/core/di/token';
import type { IBilledRepository } from '../../persistence/repository/billed-repository.interface';
import { CreateBilledInputDto, CreateBilledOutputDto } from './dtos/create-billed.dto';

@Injectable()
export class CreateBilled {
  constructor(
    @Inject(TOKENS.BilledRepository) private readonly billedRepository: IBilledRepository,
  ) {}

  public async execute(data: CreateBilledInputDto): Promise<CreateBilledOutputDto> {
    const entity = BilledFactory.create(data);

    const id = await this.billedRepository.save(entity);

    return { id };
  }
}
