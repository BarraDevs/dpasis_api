import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientAttendanceAlreadyExistsError } from '../../../domain/errors/client-attendance-already-exists.error';
import { ClientAttendanceNotFoundError } from '../../../domain/errors/client-attendance-not-found.error';
import type { IClientAttendanceDao } from '../../persistence/dao/client-attendance-dao.interface';
import { EditClientAttendanceInputDto } from './dtos/edit-client-attendance.dto';

@Injectable()
export class EditClientAttendance {
  constructor(
    @Inject(TOKENS.ClientAttendanceDao) private readonly clientAttendanceDao: IClientAttendanceDao,
  ) {}

  public async execute(id: number, data: EditClientAttendanceInputDto): Promise<SuccessMessage> {
    const clientAttendance = await this.clientAttendanceDao.findById(id);
    if (!clientAttendance) {
      throw new ClientAttendanceNotFoundError();
    }

    const existing = await this.clientAttendanceDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new ClientAttendanceAlreadyExistsError(data.name);
    }

    await this.clientAttendanceDao.edit(id, data);

    return { message: 'Atendimento de cliente atualizado com sucesso' };
  }
}
