import { NfsGenerationFakeAdapterGateway } from './nfs-generation-fake.gateway';

describe('NfsGenerationFakeAdapterGateway - Unit tests', () => {
  let sut: NfsGenerationFakeAdapterGateway;

  beforeEach(() => {
    sut = new NfsGenerationFakeAdapterGateway();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
