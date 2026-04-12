import { Inject, Injectable } from '@nestjs/common';
import { ClientSequenceInvalidNextIdError } from 'src/app/client/client/domain/errors/client-sequence-invalid-next-id.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import type { IClientSequenceRepository } from '../../persistence/repository/client-sequence-repository.interface';
import { SetClientNextIdInputDto } from './dtos/set-client-next-id.dto';

@Injectable()
export class SetClientNextId {
  constructor(
    @Inject(TOKENS.ClientDao) private readonly clientDao: IClientDao,
    @Inject(TOKENS.ClientSequenceRepository) private readonly clientSequenceRepository: IClientSequenceRepository,
  ) {}

  public async execute(data: SetClientNextIdInputDto): Promise<SuccessMessage> {
    const maxId = await this.clientDao.findMaxId();
    if (data.nextId <= maxId) {
      throw new ClientSequenceInvalidNextIdError(data.nextId, maxId);
    }

    await this.clientSequenceRepository.setNextId(data.nextId);
    return { message: `Próximo ID de cliente definido para ${data.nextId}.` };
  }
}
