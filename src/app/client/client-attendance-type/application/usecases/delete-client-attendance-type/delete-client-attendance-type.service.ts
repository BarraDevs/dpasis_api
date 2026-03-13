import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientAttendanceTypeNotFoundError } from '../../../domain/errors/client-attendance-type-not-found.error';
import type { IClientAttendanceTypeDao } from '../../persistence/dao/client-attendance-type-dao.interface';

@Injectable()
export class DeleteClientAttendanceType {
  constructor(
    @Inject(TOKENS.ClientAttendanceTypeDao) private readonly clientAttendanceTypeDao: IClientAttendanceTypeDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const clientAttendanceType = await this.clientAttendanceTypeDao.findById(id);
    if (!clientAttendanceType) {
      throw new ClientAttendanceTypeNotFoundError();
    }

    await this.clientAttendanceTypeDao.delete(id);

    return { message: 'Tipo de atendimento de cliente excluído com sucesso' };
  }
}
