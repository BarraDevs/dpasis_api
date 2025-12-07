import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditLicenseInputDto } from './edit-license.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditLicenseInputDto,
};

describe('EditLicenseInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each([
    { field: 'paymentDay', type: 'número inteiro', positive: true, min: 1 },
    { field: 'bonusInCents', type: 'número inteiro', positive: false, min: undefined },
    { field: 'billingStartDate', type: 'data válida (YYYY-MM-DD)', positive: false, min: undefined },
    { field: 'license', type: 'texto', positive: false, min: undefined },
  ])('$field field', ({ field, type, positive, min }) => {

    it.each([undefined])(`should not throw error if ${field} is empty (%s)`, async(value: any) => {
      // Arrange
      const data = { [field]: value };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(EditLicenseInputDto);
      // Verifica se o campo está ausente ou nulo como esperado
      expect(result[field] === undefined || result[field] === null).toBe(true);
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
    const data: EditLicenseInputDto = {
      paymentDay: 20,
      bonusInCents: 2000,
      billingStartDate: new Date('2025-02-15'),
      license: '{"updated": true}',
    };
    const plainData = {
      ...data,
      billingStartDate: '2025-02-15', // Enviamos como string
    };

    // Act
    const result = await target.transform(plainData, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditLicenseInputDto);
  });

  it('should pass if only some fields are provided', async() => {
    const plainData = { paymentDay: '5' };

    const result = await target.transform(plainData, metadata);
    expect(result).toBeInstanceOf(EditLicenseInputDto);
    expect(result).toEqual({ paymentDay: 5 });
  });

  it('should trim string fields', async() => {
    const data = {
      license: '  Updated License Info  ',
    };
    const result = await target.transform(data, metadata);
    expect(result.license).toBe('Updated License Info');
  });

  it('should convert numeric string fields to numbers', async() => {
    const data = {
      paymentDay: '25',
      bonusInCents: '7500',
    };
    const result = await target.transform(data, metadata);
    expect(result.paymentDay).toBe(25);
    expect(result.bonusInCents).toBe(7500);
  });
});
