import { Inject, Injectable } from '@nestjs/common';
import { ServiceAttendanceValueNotFoundError } from 'src/app/service/service-attendance-value/domain/errors/service-attendance-value-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { ServiceAttendanceValueDto } from '../../dtos/service-attendance-value.dto';
import type { IServiceAttendanceValueDao } from '../../persistence/dao/service-attendance-value-dao.interface';

@Injectable()
export class FindServiceAttendanceValueById {
  constructor(
    @Inject(TOKENS.ServiceAttendanceValueDao) private readonly serviceAttendanceValueDao: IServiceAttendanceValueDao,
  ) {}

  public async execute(id: number): Promise<ServiceAttendanceValueDto> {
    const result = await this.serviceAttendanceValueDao.findById(id);
    if (!result) {
      throw new ServiceAttendanceValueNotFoundError();
    }

    return result;
  }
}
