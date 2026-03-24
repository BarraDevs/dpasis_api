import { Inject, Injectable } from '@nestjs/common';
import { ServiceAttendanceValueNotFoundError } from 'src/app/service/service-attendance-value/domain/errors/service-attendance-value-not-found.error';
import { ServiceAttendanceValueFactory } from 'src/app/service/service-attendance-value/domain/factories/service-attendance-value.factory';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IServiceAttendanceValueRepository } from '../../persistence/repository/service-attendance-value-repository.interface';
import { EditServiceAttendanceValueInputDto } from './dtos/edit-service-attendance-value.dto';

@Injectable()
export class EditServiceAttendanceValue {
  constructor(
    @Inject(TOKENS.ServiceAttendanceValueRepository)
    private readonly serviceAttendanceValueRepository: IServiceAttendanceValueRepository,
  ) {}

  public async execute(id: number, data: EditServiceAttendanceValueInputDto): Promise<SuccessMessage> {
    const existing = await this.serviceAttendanceValueRepository.findById(id);
    if (!existing) {
      throw new ServiceAttendanceValueNotFoundError();
    }

    const entity = ServiceAttendanceValueFactory.edit({
      id,
      serviceId: existing.props.serviceId,
      values: data.values,
    });

    await this.serviceAttendanceValueRepository.edit(entity);

    return { message: 'Edição realizada com sucesso' };
  }
}
