import { Inject, Injectable } from '@nestjs/common';
import { ResaleSequenceInvalidNextIdError } from 'src/app/resale/resale/domain/errors/resale-sequence-invalid-next-id.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IResaleDao } from '../../persistence/dao/resale-dao.interface';
import type { IResaleSequenceRepository } from '../../persistence/repository/resale-sequence-repository.interface';
import { HexadecimalDecimal } from 'src/shared/value-objects/hexadecimal-decimal/hexadecimal-decimal.vo';
import { SetResaleNextIdExecuteInputDto } from './dtos/set-resale-next-id.dto';

@Injectable()
export class SetResaleNextId {
  constructor(
    @Inject(TOKENS.ResaleDao) private readonly resaleDao: IResaleDao,
    @Inject(TOKENS.ResaleSequenceRepository) private readonly resaleSequenceRepository: IResaleSequenceRepository,
  ) {}

  public async execute(data: SetResaleNextIdExecuteInputDto): Promise<SuccessMessage> {
    const maxId = await this.resaleDao.findMaxId();
    if (data.nextId <= maxId) {
      throw new ResaleSequenceInvalidNextIdError(data.nextId, maxId);
    }

    await this.resaleSequenceRepository.setNextId(data.nextId);
    const nextHex = HexadecimalDecimal.fromDecimal(data.nextId).hex;
    return { message: `Próximo ID de revenda definido para ${nextHex}.` };
  }
}
