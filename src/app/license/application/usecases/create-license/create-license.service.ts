import { Injectable } from '@nestjs/common';
import { CreateLicenseInputDto, CreateLicenseOutputDto } from './dtos/create-license.dto';

@Injectable()
export class CreateLicense {
  constructor() {}

  public async execute(data: CreateLicenseInputDto): Promise<CreateLicenseOutputDto> {
    // Lógica para criar um license.
  }
}
