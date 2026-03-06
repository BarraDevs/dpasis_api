import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import {
  CreateClientInvoiceConfigInputDto,
  CreateClientInvoiceConfigOutputDto,
} from './create-client-invoice-config.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateClientInvoiceConfigInputDto,
};

function makeValidData(overrides?: Partial<CreateClientInvoiceConfigInputDto>) {
  return {
    clientId: 1,
    generateNf: true,
    type: ClientInvoiceConfigType.MONTHLY,
    emissionDay: 5,
    dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
    dueDateDay: 15,
    months: [] as number[],
    billingAddressId: 1,
    bankId: 1,
    autoProtestBoleto: false,
    message: null as string | null,
    ...overrides,
  };
}

describe('CreateClientInvoiceConfigInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('clientId', () => {
    it.each([undefined, null, ''])(
      'should throw an error if clientId is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ clientId: value as number });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          const message = error.getResponse().message;
          const msgStr = Array.isArray(message) ? message.join(' ') : message;
          expect(msgStr).toMatch(/clientId/);
        });
      },
    );

    it('should transform string clientId to number', async() => {
      const data = { ...makeValidData(), clientId: '42' };

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(42);
    });
  });

  describe('generateNf', () => {
    it.each([undefined, null])(
      'should throw an error if generateNf is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ generateNf: value as boolean });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('generateNf é obrigatório');
        });
      },
    );

    it('should accept generateNf as true', async() => {
      const data = makeValidData({ generateNf: true });

      const result = await target.transform(data, metadata);

      expect(result.generateNf).toBe(true);
    });

    it('should accept generateNf as false', async() => {
      const data = makeValidData({ generateNf: false });

      const result = await target.transform(data, metadata);

      expect(result.generateNf).toBe(false);
    });
  });

  describe('type', () => {
    it.each([undefined, null, ''])(
      'should throw an error if type is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ type: value as ClientInvoiceConfigType });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('type deve ser MONTHLY ou ANNUAL');
        });
      },
    );

    it('should accept MONTHLY type', async() => {
      const data = makeValidData({ type: ClientInvoiceConfigType.MONTHLY });

      const result = await target.transform(data, metadata);

      expect(result.type).toBe(ClientInvoiceConfigType.MONTHLY);
    });

    it('should accept ANNUAL type', async() => {
      const data = makeValidData({ type: ClientInvoiceConfigType.ANNUAL });

      const result = await target.transform(data, metadata);

      expect(result.type).toBe(ClientInvoiceConfigType.ANNUAL);
    });
  });

  describe('emissionDay', () => {
    it.each([undefined, null, '', '   '])(
      'should throw an error if emissionDay is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ emissionDay: value as number });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('emissionDay deve ser entre 1 e 31');
        });
      },
    );

    it('should throw an error if emissionDay is less than 1', async() => {
      const data = makeValidData({ emissionDay: 0 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('emissionDay deve ser entre 1 e 31');
      });
    });

    it('should throw an error if emissionDay is greater than 31', async() => {
      const data = makeValidData({ emissionDay: 32 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('emissionDay deve ser entre 1 e 31');
      });
    });

    it('should accept emissionDay between 1 and 31', async() => {
      const data = makeValidData({ emissionDay: 15 });

      const result = await target.transform(data, metadata);

      expect(result.emissionDay).toBe(15);
    });
  });

  describe('dueDateType', () => {
    it.each([undefined, null, ''])(
      'should throw an error if dueDateType is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ dueDateType: value as ClientInvoiceConfigDueDateType });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('dueDateType deve ser DUE_DATE ou DEADLINE');
        });
      },
    );

    it('should accept DUE_DATE', async() => {
      const data = makeValidData({ dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE });

      const result = await target.transform(data, metadata);

      expect(result.dueDateType).toBe(ClientInvoiceConfigDueDateType.DUE_DATE);
    });

    it('should accept DEADLINE', async() => {
      const data = makeValidData({ dueDateType: ClientInvoiceConfigDueDateType.DEADLINE });

      const result = await target.transform(data, metadata);

      expect(result.dueDateType).toBe(ClientInvoiceConfigDueDateType.DEADLINE);
    });
  });

  describe('dueDateDay (optional)', () => {
    it('should accept valid dueDateDay', async() => {
      const data = makeValidData({ dueDateDay: 20 });

      const result = await target.transform(data, metadata);

      expect(result.dueDateDay).toBe(20);
    });

    it('should accept undefined dueDateDay', async() => {
      const data = makeValidData({ dueDateDay: undefined });
      delete (data as Record<string, unknown>).dueDateDay;

      const result = await target.transform(data, metadata);

      expect(result.dueDateDay).toBeUndefined();
    });

    it('should throw an error if dueDateDay is out of range', async() => {
      const data = makeValidData({ dueDateDay: 32 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('dueDateDay deve ser entre 1 e 31');
      });
    });
  });

  describe('deadlineDays (optional)', () => {
    it('should accept valid deadlineDays', async() => {
      const data = makeValidData({ deadlineDays: 10 });

      const result = await target.transform(data, metadata);

      expect(result.deadlineDays).toBe(10);
    });

    it('should throw an error if deadlineDays is less than 1', async() => {
      const data = makeValidData({ deadlineDays: 0 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('deadlineDays deve ser positivo');
      });
    });
  });

  describe('months (optional)', () => {
    it('should accept valid months array', async() => {
      const data = makeValidData({ months: [1, 5, 9] });

      const result = await target.transform(data, metadata);

      expect(result.months).toEqual([1, 5, 9]);
    });

    it('should accept empty months array', async() => {
      const data = makeValidData({ months: [] });

      const result = await target.transform(data, metadata);

      expect(result.months).toEqual([]);
    });

    it('should throw an error if month is out of range', async() => {
      const data = makeValidData({ months: [0, 13] });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        const message = error.getResponse().message;
        const msgStr = Array.isArray(message) ? message.join(' ') : message;
        expect(msgStr).toContain('mês deve ser entre 1 e 12');
      });
    });
  });

  describe('billingAddressId', () => {
    it.each([undefined, null, ''])(
      'should throw an error if billingAddressId is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ billingAddressId: value as number });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          const message = error.getResponse().message;
          const msgStr = Array.isArray(message) ? message.join(' ') : message;
          expect(msgStr).toMatch(/billingAddressId/);
        });
      },
    );

    it('should transform string billingAddressId to number', async() => {
      const data = { ...makeValidData(), billingAddressId: '10' };

      const result = await target.transform(data, metadata);

      expect(result.billingAddressId).toBe(10);
    });
  });

  describe('bankId', () => {
    it.each([undefined, null, ''])(
      'should throw an error if bankId is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ bankId: value as number });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          const message = error.getResponse().message;
          const msgStr = Array.isArray(message) ? message.join(' ') : message;
          expect(msgStr).toMatch(/bankId/);
        });
      },
    );

    it('should transform string bankId to number', async() => {
      const data = { ...makeValidData(), bankId: '5' };

      const result = await target.transform(data, metadata);

      expect(result.bankId).toBe(5);
    });
  });

  describe('autoProtestBoleto', () => {
    it.each([undefined, null])(
      'should throw an error if autoProtestBoleto is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ autoProtestBoleto: value as boolean });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('autoProtestBoleto é obrigatório');
        });
      },
    );

    it('should accept autoProtestBoleto as true', async() => {
      const data = makeValidData({ autoProtestBoleto: true });

      const result = await target.transform(data, metadata);

      expect(result.autoProtestBoleto).toBe(true);
    });
  });

  describe('message (optional)', () => {
    it('should accept null message', async() => {
      const data = makeValidData({ message: null });

      const result = await target.transform(data, metadata);

      expect(result.message).toBeNull();
    });

    it('should trim message', async() => {
      const data = makeValidData({ message: '  Mensagem  ' });

      const result = await target.transform(data, metadata);

      expect(result.message).toBe('Mensagem');
    });
  });

  it('should pass if all required fields are valid', async() => {
    const data = makeValidData();

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(CreateClientInvoiceConfigInputDto);
    expect(result.clientId).toBe(1);
    expect(result.generateNf).toBe(true);
    expect(result.type).toBe(ClientInvoiceConfigType.MONTHLY);
    expect(result.emissionDay).toBe(5);
    expect(result.dueDateType).toBe(ClientInvoiceConfigDueDateType.DUE_DATE);
    expect(result.dueDateDay).toBe(15);
    expect(result.billingAddressId).toBe(1);
    expect(result.bankId).toBe(1);
    expect(result.autoProtestBoleto).toBe(false);
  });
});

describe('CreateClientInvoiceConfigOutputDto', () => {
  it('should have id property', () => {
    const dto: CreateClientInvoiceConfigOutputDto = { id: 1 };

    expect(dto.id).toBe(1);
  });
});
