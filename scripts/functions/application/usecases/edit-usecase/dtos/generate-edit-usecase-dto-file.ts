import { Props } from 'scripts/generate-module';

export function generateEditUsecaseDtoFile({ moduleNamePascal }: Props) {
  return `import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class-*/decorators/trim/trim';

export class Edit${moduleNamePascal}InputDto {
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  field: string;
}
`;
}
