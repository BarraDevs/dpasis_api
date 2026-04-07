import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditAdminInputDto } from './edit-admin.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditAdminInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some(m => m.includes(substring))).toBe(true);
}

function makeValidInputDto(overrides: Partial<EditAdminInputDto> = {}): EditAdminInputDto {
  return {
    claims: [{ subject: 'bank', action: 'list' }],
    ...overrides,
  };
}

describe('EditAdminInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('claims field', () => {
    it('should reject when claims is missing', async() => {
      const data = {} as EditAdminInputDto;

      expect.assertions(1);
      return target.transform(data, metadata).catch(error => {
        expectMessageToContain(error.getResponse().message, 'claims');
      });
    });

    it('should reject when claims is not an array', async() => {
      const data = makeValidInputDto({ claims: {} as unknown as EditAdminInputDto['claims'] });

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

    it('should trim subject and action in claims', async() => {
      const data = makeValidInputDto({
        claims: [{ subject: '  faq  ', action: '  read  ' }],
      });

      const result = await target.transform(data, metadata);

      expect(result.claims[0].subject).toBe('faq');
      expect(result.claims[0].action).toBe('read');
    });

    it('should accept empty claims array', async() => {
      const data = makeValidInputDto({ claims: [] });

      const result = await target.transform(data, metadata);

      expect(result.claims).toEqual([]);
    });
  });

  describe('optional name', () => {
    it('should accept undefined name', async() => {
      const data = makeValidInputDto({ name: undefined });

      const result = await target.transform(data, metadata);

      expect(result.name).toBeUndefined();
    });

    it('should trim name when provided', async() => {
      const data = makeValidInputDto({ name: '  Novo Nome  ' });

      const result = await target.transform(data, metadata);

      expect(result.name).toBe('Novo Nome');
    });
  });

  describe('optional email', () => {
    it('should reject invalid email when provided', async() => {
      const data = makeValidInputDto({ email: 'invalid' });

      expect.assertions(1);
      return target.transform(data, metadata).catch(error => {
        expectMessageToContain(error.getResponse().message, 'e-mail');
      });
    });

    it('should trim email when provided', async() => {
      const data = makeValidInputDto({ email: '  novo@example.com  ' });

      const result = await target.transform(data, metadata);

      expect(result.email).toBe('novo@example.com');
    });
  });

  describe('optional document', () => {
    it('should trim document when provided', async() => {
      const data = makeValidInputDto({ document: '  390.533.447-05  ' });

      const result = await target.transform(data, metadata);

      expect(result.document).toBe('390.533.447-05');
    });
  });

  describe('optional profilePicture', () => {
    it('should accept null', async() => {
      const data = makeValidInputDto({ profilePicture: null });

      const result = await target.transform(data, metadata);

      expect(result.profilePicture).toBeNull();
    });

    it('should trim string when provided', async() => {
      const data = makeValidInputDto({ profilePicture: '  https://cdn/x.png  ' });

      const result = await target.transform(data, metadata);

      expect(result.profilePicture).toBe('https://cdn/x.png');
    });
  });

  describe('full payload', () => {
    it('should pass with only claims', async() => {
      const data = makeValidInputDto();

      const result = await target.transform(data, metadata);

      expect(result.claims).toHaveLength(1);
      expect(result.name).toBeUndefined();
    });

    it('should pass with all optional fields set', async() => {
      const data = makeValidInputDto({
        name: 'Nome',
        email: 'a@b.com',
        document: '529.982.247-25',
        profilePicture: null,
        claims: [{ subject: 'x', action: 'y' }],
      });

      const result = await target.transform(data, metadata);

      expect(result).toMatchObject({
        name: 'Nome',
        email: 'a@b.com',
        document: '529.982.247-25',
        profilePicture: null,
      });
      expect(result.claims[0]).toEqual({ subject: 'x', action: 'y' });
    });
  });
});
