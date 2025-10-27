"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCreateUsecaseDtoFile = generateCreateUsecaseDtoFile;
function generateCreateUsecaseDtoFile({ moduleNamePascal }) {
    return `import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/class-*/decorators/trim/trim';

export class Create${moduleNamePascal}InputDto {
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  field: string;
}

export class Create${moduleNamePascal}OutputDto {
  id: string;
}
`;
}
//# sourceMappingURL=generate-create-usecase-dto-file.js.map