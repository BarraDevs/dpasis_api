import { CreateResaleOutputDto } from './create-resale.dto';

describe('CreateResaleOutputDto', () => {
  it('should accept id assignment', () => {
    const dto = new CreateResaleOutputDto();
    dto.id = 42;

    expect(dto.id).toBe(42);
  });
});
