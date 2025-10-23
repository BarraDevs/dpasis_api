import { Props } from 'scripts/generate-module';

export function generateDeleteUsecaseSpecFile({ moduleName, moduleNamePascal }: Props) {
  return `import { Test, TestingModule } from '@nestjs/testing';
import { ${moduleNamePascal}Module } from 'src/app/${moduleName}/${moduleName}.module';
import { Delete${moduleNamePascal} } from './delete-${moduleName}.service';

describe('Delete${moduleNamePascal}', () => {
  let service: Delete${moduleNamePascal};

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [${moduleNamePascal}Module],
    }).compile();

    service = module.get(Delete${moduleNamePascal});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
`;
}
