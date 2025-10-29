TypeScript

import { PartialType } from '@nestjs/swagger';
import { CreateLicenseInputDto } from '../../create-license/dtos/create-license.dto';

export class EditLicenseInputDto extends PartialType(CreateLicenseInputDto, {
  skipNullProperties: false,
}) {}
2. Casos de Uso (Services)
Agora, vamos implementar os 5 casos de uso (CRUD completo), seguindo o padrão que vi em Client e Contact.
