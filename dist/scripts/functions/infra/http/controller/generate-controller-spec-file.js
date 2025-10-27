"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateControllerSpecFile = generateControllerSpecFile;
function generateControllerSpecFile({ moduleName, moduleNamePascal }) {
    return `import { Test } from '@nestjs/testing';
import { ${moduleNamePascal}Module } from 'src/app/${moduleName}/${moduleName}.module';
import { ${moduleNamePascal}Controller } from './${moduleName}.controller';

describe('${moduleNamePascal}Controller', () => {
  let sut: ${moduleNamePascal}Controller;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ${moduleNamePascal}Module,
      ],
    }).compile();

    sut = module.get(${moduleNamePascal}Controller);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
`;
}
//# sourceMappingURL=generate-controller-spec-file.js.map