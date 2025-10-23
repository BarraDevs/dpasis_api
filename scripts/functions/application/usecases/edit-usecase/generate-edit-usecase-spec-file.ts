import { Props } from 'scripts/generate-module';

export function generateEditUsecaseSpecFile({ moduleName, moduleNamePascal }: Props) {
  return `import { Test, TestingModule } from '@nestjs/testing';
import { ${moduleNamePascal}Module } from 'src/app/${moduleName}/${moduleName}.module';
import { Edit${moduleNamePascal} } from './edit-${moduleName}.service';

describe('Edit${moduleNamePascal}', () => {
  let service: Edit${moduleNamePascal};

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [${moduleNamePascal}Module],
    }).compile();

    service = module.get(Edit${moduleNamePascal});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
`;
}
