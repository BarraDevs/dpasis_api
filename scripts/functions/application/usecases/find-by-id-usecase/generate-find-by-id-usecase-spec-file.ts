import { Props } from 'scripts/generate-module';

export function generateFindByIdUsecaseSpecFile({ moduleName, moduleNamePascal }: Props) {
  return `import { Test, TestingModule } from '@nestjs/testing';
import { ${moduleNamePascal}Module } from 'src/app/${moduleName}/${moduleName}.module';
import { Find${moduleNamePascal}ById } from './find-${moduleName}-by-id.service';

describe('Find${moduleNamePascal}ById', () => {
  let service: Find${moduleNamePascal}ById;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [${moduleNamePascal}Module],
    }).compile();

    service = module.get(Find${moduleNamePascal}ById);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
`;
}
