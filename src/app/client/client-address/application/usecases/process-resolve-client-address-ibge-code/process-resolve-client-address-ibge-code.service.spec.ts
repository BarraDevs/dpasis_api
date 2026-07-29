import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientAddressFactory } from 'src/app/client/client-address/domain/factories/client-address.factory';
import { TOKENS } from 'src/core/di/token';
import type { ICepLookupGateway } from 'src/infra/cep-lookup/cep-lookup.gateway';
import { CepLookupOutputDto } from 'src/infra/cep-lookup/dtos/cep-lookup.dto';
import type { IClientAddressRepository } from '../../persistence/repository/client-address-repository.interface';
import { ProcessResolveClientAddressIbgeCodeInputDto } from './dtos/process-resolve-client-address-ibge-code.dto';
import { ProcessResolveClientAddressIbgeCode } from './process-resolve-client-address-ibge-code.service';

function makeClientAddress(overrides?: Partial<Record<string, unknown>>) {
  return ClientAddressFactory.load({
    id: 1,
    clientId: 1,
    type: ClientAddressType.MAIN,
    zipCode: '12345-678',
    street: 'Rua Teste',
    number: '1',
    complement: null,
    neighborhood: 'Centro',
    city: 'São Paulo',
    cityCodeIbge: null,
    state: 'SP',
    active: true,
    ...overrides,
  });
}

describe('ProcessResolveClientAddressIbgeCode - Unit tests', () => {
  let sut: ProcessResolveClientAddressIbgeCode;
  let cepLookupGateway: ICepLookupGateway;
  let clientAddressRepository: IClientAddressRepository;

  const input: ProcessResolveClientAddressIbgeCodeInputDto = {
    clientAddressId: 1,
    zipCode: '12345-678',
  };

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ProcessResolveClientAddressIbgeCode,
        {
          provide: TOKENS.CepLookupGateway,
          useValue: createMock<ICepLookupGateway>(),
        },
        {
          provide: TOKENS.ClientAddressRepository,
          useValue: createMock<IClientAddressRepository>(),
        },
      ],
    }).compile();

    sut = module.get(ProcessResolveClientAddressIbgeCode);
    cepLookupGateway = module.get(TOKENS.CepLookupGateway);
    clientAddressRepository = module.get(TOKENS.ClientAddressRepository);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should update cityCodeIbge when gateway resolves it and zipCode still matches', async() => {
    jest.spyOn(cepLookupGateway, 'lookup').mockResolvedValue(
      createMock<CepLookupOutputDto>({ cityCodeIbge: '3550308' }),
    );
    jest.spyOn(clientAddressRepository, 'findById').mockResolvedValue(makeClientAddress());
    const editSpy = jest.spyOn(clientAddressRepository, 'edit').mockResolvedValue(undefined);

    await sut.execute(input);

    expect(editSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({ cityCodeIbge: '3550308' }),
      }),
    );
  });

  it('should propagate gateway errors so BullMQ can retry', async() => {
    const error = new Error('CEP não encontrado');
    jest.spyOn(cepLookupGateway, 'lookup').mockRejectedValue(error);
    const editSpy = jest.spyOn(clientAddressRepository, 'edit');

    await expect(sut.execute(input)).rejects.toThrow(error);

    expect(editSpy).not.toHaveBeenCalled();
  });

  it('should not update when zipCode changed since the job was enqueued (idempotency)', async() => {
    jest.spyOn(cepLookupGateway, 'lookup').mockResolvedValue(
      createMock<CepLookupOutputDto>({ cityCodeIbge: '3550308' }),
    );
    jest.spyOn(clientAddressRepository, 'findById').mockResolvedValue(
      makeClientAddress({ zipCode: '99999-999' }),
    );
    const editSpy = jest.spyOn(clientAddressRepository, 'edit');

    await sut.execute(input);

    expect(editSpy).not.toHaveBeenCalled();
  });

  it('should no-op when address no longer exists', async() => {
    jest.spyOn(cepLookupGateway, 'lookup').mockResolvedValue(
      createMock<CepLookupOutputDto>({ cityCodeIbge: '3550308' }),
    );
    jest.spyOn(clientAddressRepository, 'findById').mockResolvedValue(null);
    const editSpy = jest.spyOn(clientAddressRepository, 'edit');

    await sut.execute(input);

    expect(editSpy).not.toHaveBeenCalled();
  });

  it('should no-op silently when gateway resolves without a cityCodeIbge', async() => {
    jest.spyOn(cepLookupGateway, 'lookup').mockResolvedValue(
      createMock<CepLookupOutputDto>({ cityCodeIbge: null }),
    );
    const findByIdSpy = jest.spyOn(clientAddressRepository, 'findById');
    const editSpy = jest.spyOn(clientAddressRepository, 'edit');

    await sut.execute(input);

    expect(findByIdSpy).not.toHaveBeenCalled();
    expect(editSpy).not.toHaveBeenCalled();
  });

  it('should propagate repository edit errors so BullMQ can retry', async() => {
    const error = new Error('DB write failed');
    jest.spyOn(cepLookupGateway, 'lookup').mockResolvedValue(
      createMock<CepLookupOutputDto>({ cityCodeIbge: '3550308' }),
    );
    jest.spyOn(clientAddressRepository, 'findById').mockResolvedValue(makeClientAddress());
    jest.spyOn(clientAddressRepository, 'edit').mockRejectedValue(error);

    await expect(sut.execute(input)).rejects.toThrow(error);
  });
});
