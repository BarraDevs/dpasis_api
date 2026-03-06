import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditClientInvoiceConfigInputDto } from './edit-client-invoice-config.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditClientInvoiceConfigInputDto,
};

describe('EditClientInvoiceConfigInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should pass with empty object (all fields optional)', async() => {
    const data = {};

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(EditClientInvoiceConfigInputDto);
    expect(result).toEqual({});
  });

  describe('generateNf', () => {
    it('should accept generateNf as true', async() => {
      const data = { generateNf: true };

      const result = await target.transform(data, metadata);

      expect(result.generateNf).toBe(true);
    });

    it('should accept generateNf as false', async() => {
      const data = { generateNf: false };

      const result = await target.transform(data, metadata);

      expect(result.generateNf).toBe(false);
    });
  });

  describe('type', () => {
    it('should accept MONTHLY type', async() => {
      const data = { type: ClientInvoiceConfigType.MONTHLY };

      const result = await target.transform(data, metadata);

      expect(result.type).toBe(ClientInvoiceConfigType.MONTHLY);
    });

    it('should accept ANNUAL type', async() => {
      const data = { type: ClientInvoiceConfigType.ANNUAL };

      const result = await target.transform(data, metadata);

      expect(result.type).toBe(ClientInvoiceConfigType.ANNUAL);
    });
  });

  describe('emissionDay', () => {
    it('should accept valid emissionDay', async() => {
      const data = { emissionDay: 10 };

      const result = await target.transform(data, metadata);

      expect(result.emissionDay).toBe(10);
    });

    it('should throw an error if emissionDay is out of range', async() => {
      const data = { emissionDay: 32 };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('emissionDay deve ser entre 1 e 31');
      });
    });
  });

  describe('dueDateType', () => {
    it('should accept DUE_DATE', async() => {
      const data = { dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE };

      const result = await target.transform(data, metadata);

      expect(result.dueDateType).toBe(ClientInvoiceConfigDueDateType.DUE_DATE);
    });

    it('should accept DEADLINE', async() => {
      const data = { dueDateType: ClientInvoiceConfigDueDateType.DEADLINE };

      const result = await target.transform(data, metadata);

      expect(result.dueDateType).toBe(ClientInvoiceConfigDueDateType.DEADLINE);
    });
  });

  describe('dueDateDay', () => {
    it('should accept valid dueDateDay', async() => {
      const data = { dueDateDay: 20 };

      const result = await target.transform(data, metadata);

      expect(result.dueDateDay).toBe(20);
    });

    it('should accept null dueDateDay', async() => {
      const data = { dueDateDay: null };

      const result = await target.transform(data, metadata);

      expect(result.dueDateDay).toBeNull();
    });
  });

  describe('deadlineDays', () => {
    it('should accept valid deadlineDays', async() => {
      const data = { deadlineDays: 15 };

      const result = await target.transform(data, metadata);

      expect(result.deadlineDays).toBe(15);
    });
  });

  describe('months', () => {
    it('should accept valid months array', async() => {
      const data = { months: [3, 6, 9, 12] };

      const result = await target.transform(data, metadata);

      expect(result.months).toEqual([3, 6, 9, 12]);
    });
  });

  describe('billingAddressId', () => {
    it('should accept valid billingAddressId', async() => {
      const data = { billingAddressId: 5 };

      const result = await target.transform(data, metadata);

      expect(result.billingAddressId).toBe(5);
    });
  });

  describe('bankId', () => {
    it('should accept valid bankId', async() => {
      const data = { bankId: 3 };

      const result = await target.transform(data, metadata);

      expect(result.bankId).toBe(3);
    });
  });

  describe('autoProtestBoleto', () => {
    it('should accept autoProtestBoleto', async() => {
      const data = { autoProtestBoleto: true };

      const result = await target.transform(data, metadata);

      expect(result.autoProtestBoleto).toBe(true);
    });
  });

  describe('message', () => {
    it('should accept null message', async() => {
      const data = { message: null };

      const result = await target.transform(data, metadata);

      expect(result.message).toBeNull();
    });

    it('should trim message', async() => {
      const data = { message: '  Mensagem atualizada  ' };

      const result = await target.transform(data, metadata);

      expect(result.message).toBe('Mensagem atualizada');
    });
  });

  it('should pass with all fields provided', async() => {
    const data = {
      generateNf: false,
      type: ClientInvoiceConfigType.ANNUAL,
      emissionDay: 1,
      dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
      dueDateDay: null,
      deadlineDays: 30,
      months: [6, 12],
      billingAddressId: 2,
      bankId: 4,
      autoProtestBoleto: true,
      message: 'Nova mensagem',
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(EditClientInvoiceConfigInputDto);
    expect(result).toEqual(data);
  });

  it('should pass with partial fields (only some provided)', async() => {
    const data = {
      generateNf: false,
      message: 'Apenas mensagem',
    };

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(EditClientInvoiceConfigInputDto);
    expect(result.generateNf).toBe(false);
    expect(result.message).toBe('Apenas mensagem');
    expect(result.type).toBeUndefined();
    expect(result.emissionDay).toBeUndefined();
  });

  it('should not include clientId (omitted from DTO)', async() => {
    const data = {
      generateNf: false,
      message: 'Teste',
    };

    const result = await target.transform(data, metadata);

    expect(result).not.toHaveProperty('clientId');
  });
});
