import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ClientAttendanceAlreadyExistsError } from '../../../domain/errors/client-attendance-already-exists.error';
import type { IClientAttendanceDao } from '../../persistence/dao/client-attendance-dao.interface';
import { CreateClientAttendanceInputDto, CreateClientAttendanceOutputDto } from './dtos/create-client-attendance.dto';

@Injectable()
export class CreateClientAttendance {
  constructor(
    @Inject(TOKENS.ClientAttendanceDao) private readonly clientAttendanceDao: IClientAttendanceDao,
  ) {}

  public async execute(data: CreateClientAttendanceInputDto): Promise<CreateClientAttendanceOutputDto> {
    const existing = await this.clientAttendanceDao.findByName(data.name.trim());
    if (existing) {
      throw new ClientAttendanceAlreadyExistsError(data.name);
    }

    const id = await this.clientAttendanceDao.save(data);
    return { id };
  }
}
