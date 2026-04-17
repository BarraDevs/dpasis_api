import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { ClientAttendanceTypeNotFoundError } from '../../../domain/errors/client-attendance-type-not-found.error';
import { ClientAttendanceTypeDto } from '../../dtos/client-attendance-type.dto';
import type { IClientAttendanceTypeDao } from '../../persistence/dao/client-attendance-type-dao.interface';

@Injectable()
export class FindClientAttendanceTypeById {
  constructor(
    @Inject(TOKENS.ClientAttendanceTypeDao) private readonly clientAttendanceTypeDao: IClientAttendanceTypeDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<ClientAttendanceTypeDto> {
    const clientAttendanceType = await this.clientAttendanceTypeDao.findById(id);
    if (!clientAttendanceType) {
      throw new ClientAttendanceTypeNotFoundError();
    }
    if (options.onlyActive && !clientAttendanceType.active) {
      throw new ClientAttendanceTypeNotFoundError();
    }

    return clientAttendanceType;
  }
}
