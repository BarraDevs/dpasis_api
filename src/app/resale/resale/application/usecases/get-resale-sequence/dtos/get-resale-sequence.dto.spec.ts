import { plainToInstance } from 'class-transformer';
import { GetResaleSequenceOutputDto } from './get-resale-sequence.dto';

describe('GetResaleSequenceOutputDto', () => {
  it('should hold nextId from plain object', () => {
    const dto = plainToInstance(GetResaleSequenceOutputDto, { nextId: 15 });

    expect(dto).toBeInstanceOf(GetResaleSequenceOutputDto);
    expect(dto.nextId).toBe(15);
  });
});
