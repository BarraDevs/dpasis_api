"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCreateUsecaseFile = generateCreateUsecaseFile;
function generateCreateUsecaseFile({ moduleName, moduleNameCamel, moduleNamePascal }) {
    return `import { Injectable } from '@nestjs/common';
import { Create${moduleNamePascal}InputDto, Create${moduleNamePascal}OutputDto } from './dtos/create-${moduleName}.dto';

@Injectable()
export class Create${moduleNamePascal} {
  constructor() {}

  public async execute(data: Create${moduleNamePascal}InputDto): Promise<Create${moduleNamePascal}OutputDto> {
    // Lógica para criar um ${moduleNameCamel}.
  }
}
`;
}
//# sourceMappingURL=generate-create-usecase-file.js.map