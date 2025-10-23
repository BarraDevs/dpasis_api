import { Props } from 'scripts/generate-module';

export function generateFindAllUsecaseSpecFile({ moduleName, moduleNamePascal }: Props) {
  return `import { Test, TestingModule } from '@nestjs/testing';
import { ${moduleNamePascal}Module } from 'src/app/${moduleName}/${moduleName}.module';
import { FindAll${moduleNamePascal} } from './find-all-${moduleName}.service';

describe('FindAll${moduleNamePascal}', () => {
  let service: FindAll${moduleNamePascal};

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [${moduleNamePascal}Module],
    }).compile();

    service = module.get(FindAll${moduleNamePascal});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
`;
}
