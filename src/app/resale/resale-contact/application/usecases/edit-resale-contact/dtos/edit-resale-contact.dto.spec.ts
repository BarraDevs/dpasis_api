import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditResaleContactInputDto } from './edit-resale-contact.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditResaleContactInputDto,
};

describe('EditResaleContactInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should pass with empty object (all fields optional)', async() => {
    const data = {};

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(EditResaleContactInputDto);
    expect(result).toEqual({});
  });

  describe('name', () => {
    it('should throw an error if name is empty', async() => {
      const data = { name: '' };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('name é obrigatório');
      });
    });

    it('should throw an error if name exceeds 255 characters', async() => {
      const data = { name: 'a'.repeat(256) };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('name deve ter no máximo 255 caracteres');
      });
    });

    it('should accept valid name', async() => {
      const data = { name: 'João Silva' };

      const result = await target.transform(data, metadata);

      expect(result.name).toBe('João Silva');
    });

    it('should trim name', async() => {
      const data = { name: '  João Silva  ' };

      const result = await target.transform(data, metadata);

      expect(result.name).toBe('João Silva');
    });
  });

  describe('email', () => {
    it('should throw an error if email is invalid', async() => {
      const data = { email: 'invalid-email' };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        const message = error.getResponse().message;
        const msgStr = Array.isArray(message) ? message.join(' ') : message;
        expect(msgStr).toContain('email');
      });
    });

    it('should accept valid email', async() => {
      const data = { email: 'joao@example.com' };

      const result = await target.transform(data, metadata);

      expect(result.email).toBe('joao@example.com');
    });

    it('should trim email', async() => {
      const data = { email: '  joao@example.com  ' };

      const result = await target.transform(data, metadata);

      expect(result.email).toBe('joao@example.com');
    });
  });

  describe('departmentId', () => {
    it('should accept valid departmentId', async() => {
      const data = { departmentId: 1 };

      const result = await target.transform(data, metadata);

      expect(result.departmentId).toBe(1);
    });
  });

  describe('phone (optional)', () => {
    it('should accept null phone', async() => {
      const data = { phone: null };

      const result = await target.transform(data, metadata);

      expect(result.phone).toBeNull();
    });

    it('should accept string phone', async() => {
      const data = { phone: '11999999999' };

      const result = await target.transform(data, metadata);

      expect(result.phone).toBe('11999999999');
    });

    it('should trim phone', async() => {
      const data = { phone: '  11999999999  ' };

      const result = await target.transform(data, metadata);

      expect(result.phone).toBe('11999999999');
    });
  });

  describe('whatsapp (optional)', () => {
    it('should accept null whatsapp', async() => {
      const data = { whatsapp: null };

      const result = await target.transform(data, metadata);

      expect(result.whatsapp).toBeNull();
    });

    it('should accept string whatsapp', async() => {
      const data = { whatsapp: '11988887777' };

      const result = await target.transform(data, metadata);

      expect(result.whatsapp).toBe('11988887777');
    });

    it('should trim whatsapp', async() => {
      const data = { whatsapp: '  11988887777  ' };

      const result = await target.transform(data, metadata);

      expect(result.whatsapp).toBe('11988887777');
    });
  });

  describe('observations (optional)', () => {
    it('should accept null observations', async() => {
      const data = { observations: null };

      const result = await target.transform(data, metadata);

      expect(result.observations).toBeNull();
    });

    it('should accept string observations', async() => {
      const data = { observations: 'Observação' };

      const result = await target.transform(data, metadata);

      expect(result.observations).toBe('Observação');
    });

    it('should trim observations', async() => {
      const data = { observations: '  Observação  ' };

      const result = await target.transform(data, metadata);

      expect(result.observations).toBe('Observação');
    });
  });

  describe('receiveNF', () => {
    it('should accept receiveNF as false', async() => {
      const data = { receiveNF: false };

      const result = await target.transform(data, metadata);

      expect(result.receiveNF).toBe(false);
    });

    it('should accept receiveNF as true', async() => {
      const data = { receiveNF: true };

      const result = await target.transform(data, metadata);

      expect(result.receiveNF).toBe(true);
    });
  });

  it('should pass with all fields provided', async() => {
    const data = {
      departmentId: 1,
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '11999999999',
      whatsapp: '11988887777',
      observations: 'Observação',
      receiveNF: false,
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(EditResaleContactInputDto);
    expect(result).toEqual(data);
  });

  it('should pass with partial fields (only some provided)', async() => {
    const data = {
      name: 'Maria Santos',
      email: 'maria@example.com',
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(EditResaleContactInputDto);
    expect(result.name).toBe('Maria Santos');
    expect(result.email).toBe('maria@example.com');
    expect(result.departmentId).toBeUndefined();
    expect(result.receiveNF).toBeUndefined();
  });

  it('should not include resaleId (omitted from DTO)', async() => {
    const data = {
      name: 'João Silva',
      email: 'joao@example.com',
    };

    const result = await target.transform(data, metadata);

    expect(result).not.toHaveProperty('resaleId');
  });
});
