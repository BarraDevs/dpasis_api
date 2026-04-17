import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { ClientAttendanceNotFoundError } from '../../../domain/errors/client-attendance-not-found.error';
import { ClientAttendanceDto } from '../../dtos/client-attendance.dto';
import type { IClientAttendanceDao } from '../../persistence/dao/client-attendance-dao.interface';

@Injectable()
export class FindClientAttendanceById {
  constructor(
    @Inject(TOKENS.ClientAttendanceDao) private readonly clientAttendanceDao: IClientAttendanceDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<ClientAttendanceDto> {
    const clientAttendance = await this.clientAttendanceDao.findById(id);
    if (!clientAttendance) {
      throw new ClientAttendanceNotFoundError();
    }
    if (options.onlyActive && !clientAttendance.active) {
      throw new ClientAttendanceNotFoundError();
    }

    return clientAttendance;
  }
}
