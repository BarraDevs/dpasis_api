import { Inject, Injectable } from '@nestjs/common';
import { ServiceAttendanceValueNotFoundError } from 'src/app/service/service-attendance-value/domain/errors/service-attendance-value-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IServiceAttendanceValueDao } from '../../persistence/dao/service-attendance-value-dao.interface';
import type { IServiceAttendanceValueRepository } from '../../persistence/repository/service-attendance-value-repository.interface';

@Injectable()
export class DeleteServiceAttendanceValue {
  constructor(
    @Inject(TOKENS.ServiceAttendanceValueDao) private readonly serviceAttendanceValueDao: IServiceAttendanceValueDao,
    @Inject(TOKENS.ServiceAttendanceValueRepository)
    private readonly serviceAttendanceValueRepository: IServiceAttendanceValueRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const existing = await this.serviceAttendanceValueDao.findById(id);
    if (!existing) {
      throw new ServiceAttendanceValueNotFoundError();
    }

    await this.serviceAttendanceValueRepository.delete(id);

    return { message: 'Exclusão realizada com sucesso' };
  }
}
