import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllCompanyQueryDto } from './find-all-company.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: FindAllCompanyQueryDto,
};

describe('FindAllCompanyQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each(
    [
      'name',
      'fantasyName',
      'document',
      'ie',
      'address',
      'phone',
      'email',
    ]
  )('%s field', (field: string) => {
    it.each(
      [
        undefined,
        null,
        '',
        '  ',
      ]
    )(`should not throw an error if ${field} is empty (%s)`, async(value: any) => {
      // Arrange
      const data = { [field]: value };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllCompanyQueryDto);
    });

    it.each(
      [
        123,
        true,
        false,
        {},
        [],
      ]
    )('should throw an error if %s is not a string (%s)', async(value: any) => {
      // Arrange
      const data = { [field]: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ser um texto`);
      });
    });
  });

  describe('active field', () => {
    it.each(
      [
        undefined,
        null,
      ]
    )('should not throw an error if active is empty (%s)', async(value: any) => {
      // Arrange
      const data = { active: value };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(FindAllCompanyQueryDto);
    });

    it.each(
      [
        'true',
        'false',
        123,
        {},
        [],
      ]
    )('should throw an error if active is not a boolean (%s)', async(value: any) => {
      // Arrange
      const data = { active: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('active deve ser um valor booleano');
      });
    });
  });

  it('should pass if all fields are valid', async() => {
    // Arrange
    const data: FindAllCompanyQueryDto = {
      name: 'Company Name',
      fantasyName: 'Fantasy Name',
      document: '12345678000199',
      ie: '123456789',
      address: '123 Main St',
      phone: '123-456-7890',
      email: 'contact@company.com',
      active: true,
      page: 2,
      size: 50,
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllCompanyQueryDto);
    expect(result).toEqual(data);
  });
});
