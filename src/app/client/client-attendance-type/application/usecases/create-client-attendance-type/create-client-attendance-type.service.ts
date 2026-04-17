import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ClientAttendanceTypeAlreadyExistsError } from '../../../domain/errors/client-attendance-type-already-exists.error';
import type { IClientAttendanceTypeDao } from '../../persistence/dao/client-attendance-type-dao.interface';
import { CreateClientAttendanceTypeInputDto, CreateClientAttendanceTypeOutputDto } from './dtos/create-client-attendance-type.dto';

@Injectable()
export class CreateClientAttendanceType {
  constructor(
    @Inject(TOKENS.ClientAttendanceTypeDao) private readonly clientAttendanceTypeDao: IClientAttendanceTypeDao,
  ) {}

  public async execute(data: CreateClientAttendanceTypeInputDto): Promise<CreateClientAttendanceTypeOutputDto> {
    const existing = await this.clientAttendanceTypeDao.findByName(data.name.trim());
    if (existing) {
      throw new ClientAttendanceTypeAlreadyExistsError(data.name);
    }

    const id = await this.clientAttendanceTypeDao.save(data);
    return { id };
  }
}
