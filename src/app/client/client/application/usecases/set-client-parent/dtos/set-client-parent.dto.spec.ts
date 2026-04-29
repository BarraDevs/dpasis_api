import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SetClientParentInputDto } from './set-client-parent.dto';

describe('SetClientParentInputDto', () => {
  it('should pass when parentClientId is null', async() => {
    const dto = plainToInstance(SetClientParentInputDto, { parentClientId: null });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass when parentClientId is a positive integer', async() => {
    const dto = plainToInstance(SetClientParentInputDto, { parentClientId: 5 });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail when parentClientId field is omitted', async() => {
    const dto = plainToInstance(SetClientParentInputDto, {});

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors[0]?.property).toBe('parentClientId');
  });
});
