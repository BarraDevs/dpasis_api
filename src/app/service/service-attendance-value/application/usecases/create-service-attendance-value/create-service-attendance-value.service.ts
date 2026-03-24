import { Inject, Injectable } from '@nestjs/common';
import { ServiceAttendanceValueFactory } from 'src/app/service/service-attendance-value/domain/factories/service-attendance-value.factory';
import { FindServiceCatalogById } from 'src/app/service/service-catalog/application/usecases/find-service-catalog-by-id/find-service-catalog-by-id.service';
import { TOKENS } from 'src/core/di/token';
import type { IServiceAttendanceValueRepository } from '../../persistence/repository/service-attendance-value-repository.interface';
import {
  CreateServiceAttendanceValueInputDto,
  CreateServiceAttendanceValueOutputDto,
} from './dtos/create-service-attendance-value.dto';

@Injectable()
export class CreateServiceAttendanceValue {
  constructor(
    @Inject(TOKENS.ServiceAttendanceValueRepository)
    private readonly serviceAttendanceValueRepository: IServiceAttendanceValueRepository,
    private readonly findServiceCatalogById: FindServiceCatalogById,
  ) {}

  public async execute(data: CreateServiceAttendanceValueInputDto): Promise<CreateServiceAttendanceValueOutputDto> {
    await this.findServiceCatalogById.execute(data.serviceId, { onlyActive: true });

    const entity = ServiceAttendanceValueFactory.create({
      serviceId: data.serviceId,
      values: data.values,
    });

    const id = await this.serviceAttendanceValueRepository.save(entity);

    return { id };
  }
}
