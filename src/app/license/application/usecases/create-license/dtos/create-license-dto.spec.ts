import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateLicenseInputDto } from './create-license.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateLicenseInputDto,
};

describe('CreateLicenseInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each([
    { field: 'paymentDay', type: 'número inteiro', positive: true, min: 1 },
    { field: 'bonusInCents', type: 'número inteiro', positive: false, min: undefined }, // Pode ser 0
    { field: 'billingStartDate', type: 'data válida (YYYY-MM-DD)', positive: false, min: undefined },
    { field: 'license', type: 'texto', positive: false, min: undefined },
  ])('$field field', ({ field, type, positive, min }) => {
    it.each([undefined, null])(`should throw an error if ${field} is empty (%s)`, async(value: any) => {
      // Arrange
      const data = { [field]: value };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} é obrigatório`);
      });
    });

    if (type === 'número inteiro' || type === 'número') {
      it.each(['abc', true, false, {}, []])(`should throw an error if ${field} is not a number (%s)`, async(value: any) => {
        const data = { [field]: value };
        expect.assertions(1);
        await target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain(`${field} deve ser um ${type}`);
        });
      });
      if (positive) {
        it.each([-1, 0, '-5'])(`should throw an error if ${field} is not positive (%s)`, async(value: any) => {
          const data = { [field]: value };
          expect.assertions(1);
          await target.transform(data, metadata).catch((error) => {
            expect(error.getResponse().message).toContain(`${field} deve ser um número positivo`);
          });
        });
      }
      if (min !== undefined) {
        it(`should throw an error if ${field} is less than ${min}`, async() => {
          const data = { [field]: min - 1 };
          expect.assertions(1);
          await target.transform(data, metadata).catch((error) => {
            expect(error.getResponse().message).toContain(`${field} deve ser no mínimo ${min}`);
          });
        });
      }

    } else if (type === 'data válida (YYYY-MM-DD)') {
      it.each([123, 'not-a-date', '2023/01/01', {}])(`should throw an error if ${field} is not a valid date string (%s)`, async(value: any) => {
        const data = { [field]: value };
        expect.assertions(1);
        await target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain(`${field} deve ser uma ${type}`);
        });
      });
    } else { // type === 'texto'
      it.each([123, true, false, {}, []])(`should throw an error if ${field} is not a string (%s)`, async(value: any) => {
        const data = { [field]: value };
        expect.assertions(1);
        await target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain(`${field} deve ser um ${type}`);
        });
      });
    }
  });


  it('should pass if all fields are valid', async() => {
    // Arrange
    const data: CreateLicenseInputDto = {
      paymentDay: 15,
      bonusInCents: 1000,
      billingStartDate: new Date('2024-01-01'), // Prisma espera Date, mas a validação checa DateString
      license: '{"feature": true}',
      ownerId: 'uuid-do-usuario',
    };
    const plainData = {
      ...data,
      billingStartDate: '2024-01-01', // Enviamos como string
    };

    // Act
    const result = await target.transform(plainData, metadata);

    // Assert
    expect(result).toBeInstanceOf(CreateLicenseInputDto);
  });

  it('should trim string fields', async() => {
    const data = {
      paymentDay: '10',
      bonusInCents: '0',
      billingStartDate: '2024-05-20',
      license: '  Conteúdo da licença com espaços  ',
      ownerId: '  uuid-do-usuario ',
    };
    const expected = {
      paymentDay: 10,
      bonusInCents: 0,
      billingStartDate: '2024-05-20',
      license: 'Conteúdo da licença com espaços',
      ownerId: 'uuid-do-usuario',
    };

    const result = await target.transform(data, metadata);
    expect(result).toEqual(expected);
  });

  it('should convert numeric string fields to numbers', async() => {
    const data = {
      paymentDay: '5',
      bonusInCents: '5000',
      billingStartDate: '2024-12-01',
      license: '{}',
      ownerId: 'uuid-do-usuario',
    };
    const expected = {
      paymentDay: 5,
      bonusInCents: 5000,
      billingStartDate: '2024-12-01',
      license: '{}',
      ownerId: 'uuid-do-usuario',
    };

    const result = await target.transform(data, metadata);
    expect(result).toEqual(expected);
  });

});
