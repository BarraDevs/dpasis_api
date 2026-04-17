import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateClientTypeInputDto } from './create-client-type.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateClientTypeInputDto,
};

function makeValidData(overrides?: Partial<CreateClientTypeInputDto>) {
  return {
    clientId: 1,
    clientAttendanceTypeId: 1,
    clientMaintenanceTicketTypeId: 1,
    clientSystemTypeId: 1,
    clientDescriptionTypeId: 1,
    clientDriveTypeId: 1,
    clientAddressId: 1,
    quantity: 5,
    ...overrides,
  };
}

describe('CreateClientTypeInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('clientId', () => {
    it.each([undefined, null, '', '   '])(
      'should throw an error if clientId is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ clientId: value as number });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('clientId é obrigatório');
        });
      },
    );

    it('should throw an error if clientId is not an integer', async() => {
      const data = makeValidData({ clientId: 1.5 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('clientId deve ser um número inteiro');
      });
    });

    it('should transform string clientId to number', async() => {
      const data = { ...makeValidData(), clientId: '42' };

      const result = await target.transform(data, metadata);

      expect(result.clientId).toBe(42);
    });
  });

  describe('quantity', () => {
    it.each([undefined, null, ''])(
      'should throw an error if quantity is empty (%s)',
      async(value: unknown) => {
        const data = makeValidData({ quantity: value as number });

        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain('quantity é obrigatório');
        });
      },
    );

    it('should throw an error if quantity is negative', async() => {
      const data = makeValidData({ quantity: -1 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('quantity deve ser maior ou igual a zero');
      });
    });

    it('should accept quantity zero', async() => {
      const data = makeValidData({ quantity: 0 });

      const result = await target.transform(data, metadata);

      expect(result.quantity).toBe(0);
    });

    it('should transform string quantity to number', async() => {
      const data = { ...makeValidData(), quantity: '10' };

      const result = await target.transform(data, metadata);

      expect(result.quantity).toBe(10);
    });
  });

  describe('type ids', () => {
    const typeFields = [
      'clientAttendanceTypeId',
      'clientMaintenanceTicketTypeId',
      'clientSystemTypeId',
      'clientDescriptionTypeId',
      'clientDriveTypeId',
      'clientAddressId',
    ] as const;

    it.each(typeFields)('should require %s', async(field) => {
      const data = makeValidData({ [field]: undefined });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} é obrigatório`);
      });
    });

    it('should transform string type ids to numbers', async() => {
      const data = {
        ...makeValidData(),
        clientAttendanceTypeId: '1',
        clientMaintenanceTicketTypeId: '2',
        clientSystemTypeId: '3',
        clientDescriptionTypeId: '4',
        clientDriveTypeId: '5',
        clientAddressId: '6',
      };

      const result = await target.transform(data, metadata);

      expect(result.clientAttendanceTypeId).toBe(1);
      expect(result.clientMaintenanceTicketTypeId).toBe(2);
      expect(result.clientSystemTypeId).toBe(3);
      expect(result.clientDescriptionTypeId).toBe(4);
      expect(result.clientDriveTypeId).toBe(5);
      expect(result.clientAddressId).toBe(6);
    });
  });

  it('should pass if all required fields are valid', async() => {
    const data = makeValidData();

    const result = await target.transform(data, metadata);

    expect(result).toBeInstanceOf(CreateClientTypeInputDto);
    expect(result.clientId).toBe(1);
    expect(result.quantity).toBe(5);
    expect(result.clientDriveTypeId).toBe(1);
  });
});
