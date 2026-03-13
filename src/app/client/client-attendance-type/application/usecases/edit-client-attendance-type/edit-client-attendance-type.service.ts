import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientAttendanceTypeAlreadyExistsError } from '../../../domain/errors/client-attendance-type-already-exists.error';
import { ClientAttendanceTypeNotFoundError } from '../../../domain/errors/client-attendance-type-not-found.error';
import type { IClientAttendanceTypeDao } from '../../persistence/dao/client-attendance-type-dao.interface';
import { EditClientAttendanceTypeInputDto } from './dtos/edit-client-attendance-type.dto';

@Injectable()
export class EditClientAttendanceType {
  constructor(
    @Inject(TOKENS.ClientAttendanceTypeDao) private readonly clientAttendanceTypeDao: IClientAttendanceTypeDao,
  ) {}

  public async execute(id: number, data: EditClientAttendanceTypeInputDto): Promise<SuccessMessage> {
    const clientAttendanceType = await this.clientAttendanceTypeDao.findById(id);
    if (!clientAttendanceType) {
      throw new ClientAttendanceTypeNotFoundError();
    }

    const existing = await this.clientAttendanceTypeDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new ClientAttendanceTypeAlreadyExistsError(data.name);
    }

    await this.clientAttendanceTypeDao.edit(id, data);

    return { message: 'Tipo de atendimento de cliente atualizado com sucesso' };
  }
}
