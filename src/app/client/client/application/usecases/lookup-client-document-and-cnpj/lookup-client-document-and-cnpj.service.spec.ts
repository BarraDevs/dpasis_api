import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CnpjLookup } from 'src/app/external-apis/application/usecases/cnpj-lookup/cnpj-lookup.service';
import { AppException } from 'src/core/filters/app.exception';
import { CheckClientDocumentInUse } from '../check-client-document-in-use/check-client-document-in-use.service';
import { LookupClientDocumentAndCnpjInputDto } from './dtos/lookup-client-document-and-cnpj.dto';
import { LookupClientDocumentAndCnpj } from './lookup-client-document-and-cnpj.service';

function makeInput(overrides: Partial<LookupClientDocumentAndCnpjInputDto> = {}): LookupClientDocumentAndCnpjInputDto {
  return {
    document: '09.748.165/0001-10',
    ...overrides,
  };
}

const sampleCnpjPayload = {
  fantasyName: 'Fan',
  companyName: 'Co',
  address: {
    zipCode: '01310100',
    street: 'Rua',
    number: '1',
    complement: null,
    neighborhood: 'Bairro',
    city: 'São Paulo',
    cityCodeIbge: '3550308',
    state: 'SP',
  },
};

describe('LookupClientDocumentAndCnpj - Unit tests', () => {
  let sut: LookupClientDocumentAndCnpj;
  let checkClientDocumentInUse: CheckClientDocumentInUse;
  let cnpjLookup: CnpjLookup;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        LookupClientDocumentAndCnpj,
        { provide: CheckClientDocumentInUse, useValue: createMock<CheckClientDocumentInUse>() },
        { provide: CnpjLookup, useValue: createMock<CnpjLookup>() },
      ],
    }).compile();

    sut = module.get(LookupClientDocumentAndCnpj);
    checkClientDocumentInUse = module.get(CheckClientDocumentInUse);
    cnpjLookup = module.get(CnpjLookup);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should merge parallel results when both succeed', async() => {
    jest.spyOn(checkClientDocumentInUse, 'execute').mockResolvedValue({ documentInUse: true });
    jest.spyOn(cnpjLookup, 'execute').mockResolvedValue(sampleCnpjPayload);

    const result = await sut.execute(makeInput());

    expect(result.documentInUse).toBe(true);
    expect(result.cnpjErrorMessage).toBeNull();
    expect(result.cnpjLookup).toEqual({
      fantasyName: 'Fan',
      companyName: 'Co',
      address: {
        zipCode: '01310100',
        street: 'Rua',
        number: '1',
        complement: null,
        neighborhood: 'Bairro',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
      },
    });
  });

  it('should return documentInUse false and cnpj data when only document is free', async() => {
    jest.spyOn(checkClientDocumentInUse, 'execute').mockResolvedValue({ documentInUse: false });
    jest.spyOn(cnpjLookup, 'execute').mockResolvedValue(sampleCnpjPayload);

    const result = await sut.execute(makeInput());

    expect(result.documentInUse).toBe(false);
    expect(result.cnpjLookup?.companyName).toBe('Co');
    expect(result.cnpjErrorMessage).toBeNull();
  });

  it('should keep document result when CnpjLookup throws AppException', async() => {
    jest.spyOn(checkClientDocumentInUse, 'execute').mockResolvedValue({ documentInUse: false });
    jest.spyOn(cnpjLookup, 'execute').mockRejectedValue(new AppException('Serviço indisponível', 503));

    const result = await sut.execute(makeInput());

    expect(result).toEqual({
      documentInUse: false,
      cnpjLookup: null,
      cnpjErrorMessage: 'Serviço indisponível',
    });
  });

  it('should map non-AppException errors to a generic message', async() => {
    jest.spyOn(checkClientDocumentInUse, 'execute').mockResolvedValue({ documentInUse: true });
    jest.spyOn(cnpjLookup, 'execute').mockRejectedValue(new Error('network'));

    const result = await sut.execute(makeInput());

    expect(result.documentInUse).toBe(true);
    expect(result.cnpjLookup).toBeNull();
    expect(result.cnpjErrorMessage).toBe('network');
  });

  it('should call document check and CNPJ lookup with input fields', async() => {
    const checkSpy = jest.spyOn(checkClientDocumentInUse, 'execute').mockResolvedValue({ documentInUse: false });
    const cnpjSpy = jest.spyOn(cnpjLookup, 'execute').mockResolvedValue(sampleCnpjPayload);

    await sut.execute(makeInput({ document: '1' }));

    expect(checkSpy).toHaveBeenCalledWith({ document: '1' });
    expect(cnpjSpy).toHaveBeenCalledWith({ cnpj: '1' });
  });
});
