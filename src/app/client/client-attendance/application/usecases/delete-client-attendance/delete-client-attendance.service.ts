import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientAttendanceNotFoundError } from '../../../domain/errors/client-attendance-not-found.error';
import type { IClientAttendanceDao } from '../../persistence/dao/client-attendance-dao.interface';

@Injectable()
export class DeleteClientAttendance {
  constructor(
    @Inject(TOKENS.ClientAttendanceDao) private readonly clientAttendanceDao: IClientAttendanceDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const clientAttendance = await this.clientAttendanceDao.findById(id);
    if (!clientAttendance) {
      throw new ClientAttendanceNotFoundError();
    }

    await this.clientAttendanceDao.delete(id);

    return { message: 'Atendimento de cliente excluído com sucesso' };
  }
}
