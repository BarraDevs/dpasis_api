import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsObject, Validate, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'isStringRecord', async: false })
class IsStringRecordConstraint implements ValidatorConstraintInterface {
  public validate(value: unknown): boolean {
    if (value == null || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }

    return Object.values(value as Record<string, unknown>).every(item => typeof item === 'string');
  }
}

export class RenderEmailTemplateInputDto {
  @ApiProperty({
    example: { 'nfse.numero': '123', 'cliente.nome': 'Empresa Exemplo' },
    additionalProperties: { type: 'string' },
  })
  @IsDefined({ message: '$property é obrigatório' })
  @IsObject({ message: '$property deve ser um objeto' })
  @Validate(IsStringRecordConstraint, { message: '$property deve ser um mapa de texto para texto' })
  variables: Record<string, string>;
}

export class RenderEmailTemplateOutputDto {
  subject: string;
  html: string;
}
