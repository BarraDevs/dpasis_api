import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { ClaimInputDto, CreateAdminInputDto } from './create-admin.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateAdminInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some(m => m.includes(substring))).toBe(true);
}

function makeValidInputDto(overrides: Partial<CreateAdminInputDto> = {}): CreateAdminInputDto {
  return {
    name: 'Maria Silva',
    email: 'maria@example.com',
    password: 'SenhaForte123',
    document: '529.982.247-25',
    profilePicture: null,
    claims: [{ subject: 'bank', action: 'list' }],
    ...overrides,
  };
}

describe('CreateAdminInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('name field', () => {
    it.each([undefined, null, '', '  '])('should reject empty name (%s)', async(value: unknown) => {
      const data = makeValidInputDto({ name: value as string });

      expect.assertions(1);
      return target.transform(data, metadata).catch(error => {
        expectMessageToContain(error.getResponse().message, 'name');
      });
    });

    it('should trim name', async() => {
      const data = makeValidInputDto({ name: '  Maria  ' });

      const result = await target.transform(data, metadata);

      expect(result.name).toBe('Maria');
    });
  });

  describe('email field', () => {
    it.each([undefined, null, '', '  '])('should reject empty email (%s)', async(value: unknown) => {
      const data = makeValidInputDto({ email: value as string });

      expect.assertions(1);
      return target.transform(data, metadata).catch(error => {
        expectMessageToContain(error.getResponse().message, 'email');
      });
    });

    it('should reject invalid email', async() => {
      const data = makeValidInputDto({ email: 'not-an-email' });

      expect.assertions(1);
      return target.transform(data, metadata).catch(error => {
        expectMessageToContain(error.getResponse().message, 'e-mail');
      });
    });

    it('should trim email', async() => {
      const data = makeValidInputDto({ email: '  maria@example.com  ' });

      const result = await target.transform(data, metadata);

      expect(result.email).toBe('maria@example.com');
    });
  });

  describe('password field', () => {
    it.each([undefined, null, ''])('should reject empty password (%s)', async(value: unknown) => {
      const data = makeValidInputDto({ password: value as string });

      expect.assertions(1);
      return target.transform(data, metadata).catch(error => {
        expectMessageToContain(error.getResponse().message, 'password');
      });
    });

    it('does not trim password (only whitespace is still non-empty)', async() => {
      const data = makeValidInputDto({ password: '   ' });

      const result = await target.transform(data, metadata);

      expect(result.password).toBe('   ');
    });
  });

  describe('document field', () => {
    it.each([undefined, null, '', '  '])('should reject empty document (%s)', async(value: unknown) => {
      const data = makeValidInputDto({ document: value as string });

      expect.assertions(1);
      return target.transform(data, metadata).catch(error => {
        expectMessageToContain(error.getResponse().message, 'document');
      });
    });

    it('should trim document', async() => {
      const data = makeValidInputDto({ document: '  529.982.247-25  ' });

      const result = await target.transform(data, metadata);

      expect(result.document).toBe('529.982.247-25');
    });
  });

  describe('profilePicture field', () => {
    it('should accept null', async() => {
      const data = makeValidInputDto({ profilePicture: null });

      const result = await target.transform(data, metadata);

      expect(result.profilePicture).toBeNull();
    });

    it('should accept omitted (undefined)', async() => {
      const data = makeValidInputDto();
      delete (data as { profilePicture?: unknown }).profilePicture;

      const result = await target.transform(data, metadata);

      expect(result.profilePicture).toBeUndefined();
    });

    it('should trim string profilePicture', async() => {
      const data = makeValidInputDto({ profilePicture: '  https://x.com/a.png  ' });

      const result = await target.transform(data, metadata);

      expect(result.profilePicture).toBe('https://x.com/a.png');
    });
  });

  describe('claims field', () => {
    it('should reject when claims is not an array', async() => {
      const data = makeValidInputDto({ claims: {} as unknown as ClaimInputDto[] });

      expect.assertions(1);
      return target.transform(data, metadata).catch(error => {
        expectMessageToContain(error.getResponse().message, 'claims');
      });
    });

    it('should reject nested claim with empty subject', async() => {
      const data = makeValidInputDto({
        claims: [{ subject: '', action: 'list' }],
      });

      expect.assertions(1);
      return target.transform(data, metadata).catch(error => {
        expectMessageToContain(error.getResponse().message, 'subject');
      });
    });

    it('should reject nested claim with empty action', async() => {
      const data = makeValidInputDto({
        claims: [{ subject: 'bank', action: '' }],
      });

      expect.assertions(1);
      return target.transform(data, metadata).catch(error => {
        expectMessageToContain(error.getResponse().message, 'action');
      });
    });

    it('should trim subject and action in claims', async() => {
      const data = makeValidInputDto({
        claims: [{ subject: '  bank  ', action: '  list  ' }],
      });

      const result = await target.transform(data, metadata);

      expect(result.claims[0].subject).toBe('bank');
      expect(result.claims[0].action).toBe('list');
    });

    it('should accept empty claims array', async() => {
      const data = makeValidInputDto({ claims: [] });

      const result = await target.transform(data, metadata);

      expect(result.claims).toEqual([]);
    });
  });

  describe('full payload', () => {
    it('should pass when all fields are valid', async() => {
      const data = makeValidInputDto();

      const result = await target.transform(data, metadata);

      expect(result).toMatchObject({
        name: 'Maria Silva',
        email: 'maria@example.com',
        password: 'SenhaForte123',
        document: '529.982.247-25',
        profilePicture: null,
      });
      expect(result.claims).toHaveLength(1);
    });
  });
});
