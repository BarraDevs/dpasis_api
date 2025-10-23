import { Props } from 'scripts/generate-module';

export function generateCreateUsecaseSpecFile({ moduleName, moduleNamePascal }: Props) {
  return `import { Test, TestingModule } from '@nestjs/testing';
import { ${moduleNamePascal}Module } from 'src/app/${moduleName}/${moduleName}.module';
import { Create${moduleNamePascal} } from './create-${moduleName}.service';

describe('Create${moduleNamePascal}', () => {
  let service: Create${moduleNamePascal};

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [${moduleNamePascal}Module],
    }).compile();

    service = module.get(Create${moduleNamePascal});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
`;
}
