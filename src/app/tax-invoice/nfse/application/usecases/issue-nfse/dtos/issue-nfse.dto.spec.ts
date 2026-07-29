import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { IssueNfseInputDto } from './issue-nfse.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: IssueNfseInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some(m => m.includes(substring))).toBe(true);
}

function makeValidService() {
  return {
    serviceListItemCode: '01.07',
    nbsCode: '1.1501.30.00',
    indopCode: '050101',
    description: 'Desenvolvimento de sistema',
    serviceMunicipalCodeIbge: '3529401',
    issExigibility: 1,
    issWithheld: false,
    servicesValue: 1000,
  };
}

function makeValidInputDto(overrides: Partial<IssueNfseInputDto> = {}): IssueNfseInputDto {
  return {
    companyId: 1,
    clientId: 1,
    simpleNationalOptant: false,
    fiscalIncentive: false,
    service: makeValidService(),
    ...overrides,
  };
}

describe('IssueNfseInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should accept a valid input', async() => {
    const result = await target.transform(makeValidInputDto(), metadata);

    expect(result.companyId).toBe(1);
    expect(result.clientId).toBe(1);
    expect(result.service.serviceListItemCode).toBe('01.07');
  });

  describe('companyId', () => {
    it.each([undefined, null, 0, -1])('should reject invalid companyId (%s)', async(value: unknown) => {
      expect.assertions(1);
      return target.transform(makeValidInputDto({ companyId: value as number }), metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'companyId');
      });
    });
  });

  describe('clientId', () => {
    it.each([undefined, null, 0, -1])('should reject invalid clientId (%s)', async(value: unknown) => {
      expect.assertions(1);
      return target.transform(makeValidInputDto({ clientId: value as number }), metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'clientId');
      });
    });
  });

  describe('service', () => {
    it('should reject when service fields are missing', async() => {
      expect.assertions(1);
      return target.transform(makeValidInputDto({ service: {} as IssueNfseInputDto['service'] }), metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'service');
      });
    });

    it('should trim serviceListItemCode', async() => {
      const result = await target.transform(makeValidInputDto({
        service: {
          ...makeValidService(),
          serviceListItemCode: '  01.07  ',
        },
      }), metadata);

      expect(result.service.serviceListItemCode).toBe('01.07');
    });

    it('should reject description longer than 2000 characters', async() => {
      expect.assertions(1);
      return target.transform(makeValidInputDto({
        service: {
          ...makeValidService(),
          description: 'a'.repeat(2001),
        },
      }), metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'description deve ter no máximo 2000 caracteres');
      });
    });

    it('should reject invalid issExigibility', async() => {
      expect.assertions(1);
      return target.transform(makeValidInputDto({
        service: {
          ...makeValidService(),
          issExigibility: 99,
        },
      }), metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'issExigibility deve ser um código válido de exigibilidade do ISS');
      });
    });

    it('should reject non-positive servicesValue', async() => {
      expect.assertions(1);
      return target.transform(makeValidInputDto({
        service: {
          ...makeValidService(),
          servicesValue: 0,
        },
      }), metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'servicesValue');
      });
    });
  });
});
