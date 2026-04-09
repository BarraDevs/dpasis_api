import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { ClaimSubject } from 'src/app/authentication/domain/authorization/claim-subject.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { PermissionLevel } from '../../../../domain/enums/permission-level.enum';
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
    subjects: [{ subject: ClaimSubject.Bank, enabled: true, level: PermissionLevel.Read }],
    ...overrides,
  };
}

describe('EditAdminInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('subjects field', () => {
    it('should reject when subjects is missing', async() => {
      const data = {} as EditAdminInputDto;

      expect.assertions(1);
      return target.transform(data, metadata).catch(error => {
        expectMessageToContain(error.getResponse().message, 'subjects');
      });
    });

    it('should reject when subjects is not an array', async() => {
      const data = makeValidInputDto({ subjects: {} as unknown as EditAdminInputDto['subjects'] });

      expect.assertions(1);
      return target.transform(data, metadata).catch(error => {
        expectMessageToContain(error.getResponse().message, 'subjects');
      });
    });

    it('should reject nested item with enabled true but missing level', async() => {
      const data = makeValidInputDto({
        subjects: [{ subject: ClaimSubject.Faq, enabled: true }],
      });

      expect.assertions(1);
      return target.transform(data, metadata).catch(error => {
        expectMessageToContain(error.getResponse().message, 'level');
      });
    });

    it('should accept nested item with enabled false without level', async() => {
      const data = makeValidInputDto({
        subjects: [{ subject: ClaimSubject.Faq, enabled: false }],
      });

      const result = await target.transform(data, metadata);

      expect(result.subjects[0].enabled).toBe(false);
      expect(result.subjects[0].level).toBeUndefined();
    });

    it('should accept empty subjects array', async() => {
      const data = makeValidInputDto({ subjects: [] });

      const result = await target.transform(data, metadata);

      expect(result.subjects).toEqual([]);
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
    it('should pass with only subjects', async() => {
      const data = makeValidInputDto();

      const result = await target.transform(data, metadata);

      expect(result.subjects).toHaveLength(1);
      expect(result.name).toBeUndefined();
    });

    it('should pass with all optional fields set', async() => {
      const data = makeValidInputDto({
        name: 'Nome',
        email: 'a@b.com',
        document: '529.982.247-25',
        profilePicture: null,
        subjects: [{ subject: ClaimSubject.Company, enabled: true, level: PermissionLevel.Write }],
      });

      const result = await target.transform(data, metadata);

      expect(result).toMatchObject({
        name: 'Nome',
        email: 'a@b.com',
        document: '529.982.247-25',
        profilePicture: null,
      });
      expect(result.subjects[0]).toMatchObject({
        subject: ClaimSubject.Company,
        enabled: true,
        level: PermissionLevel.Write,
      });
    });
  });
});
