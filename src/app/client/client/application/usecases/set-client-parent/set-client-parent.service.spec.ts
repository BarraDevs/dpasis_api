import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ClientDto } from 'src/app/client/client/application/dtos/client.dto';
import { ClientCannotBeSelfParentError } from 'src/app/client/client/domain/errors/client-cannot-be-self-parent.error';
import { ClientHasSubClientsCannotSetParentError } from 'src/app/client/client/domain/errors/client-has-sub-clients-cannot-set-parent.error';
import { ClientNotFoundError } from 'src/app/client/client/domain/errors/client-not-found.error';
import { ClientParentIsSubClientError } from 'src/app/client/client/domain/errors/client-parent-is-sub-client.error';
import { TOKENS } from 'src/core/di/token';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import type { IClientRepository } from '../../persistence/repository/client-repository.interface';
import { SetClientParent } from './set-client-parent.service';

function minimalClientDto(overrides: Partial<ClientDto> = {}): ClientDto {
  return {
    id: 100,
    type: 'PJ',
    document: '09748165000110',
    ie: null,
    parentClientId: null,
    isSubClient: false,
    attendanceId: null,
    maintenanceTicketId: null,
    companyName: 'Empresa',
    fantasyName: null,
    domain: null,
    headquarters: 'SP',
    invoiceType: 'CONTRACT',
    generateInvoice: true,
    active: true,
    group: { id: 1, name: 'Grupo' },
    resale: { id: 1, name: 'Revenda' },
    companies: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('SetClientParent - Unit tests', () => {
  let sut: SetClientParent;
  let clientDao: IClientDao;
  let clientRepository: IClientRepository;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        SetClientParent,
        { provide: TOKENS.ClientDao, useValue: createMock<IClientDao>() },
        { provide: TOKENS.ClientRepository, useValue: createMock<IClientRepository>() },
      ],
    }).compile();

    sut = module.get(SetClientParent);
    clientDao = module.get(TOKENS.ClientDao);
    clientRepository = module.get(TOKENS.ClientRepository);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ClientNotFoundError when client does not exist', async() => {
    jest.spyOn(clientDao, 'findById').mockResolvedValueOnce(null);

    await expect(sut.execute(99_999, { parentClientId: 1 })).rejects.toThrow(ClientNotFoundError);
    expect(clientRepository.edit).not.toHaveBeenCalled();
  });

  it('should return idempotent message when parent unchanged', async() => {
    jest.spyOn(clientDao, 'findById').mockResolvedValueOnce(minimalClientDto({
      parentClientId: 5,
      isSubClient: true,
    }));

    const result = await sut.execute(100, { parentClientId: 5 });

    expect(result.message).toContain('Nenhuma alteração');
    expect(clientRepository.edit).not.toHaveBeenCalled();
  });

  it('should detach parent when parentClientId is null', async() => {
    jest.spyOn(clientDao, 'findById').mockResolvedValueOnce(minimalClientDto({
      parentClientId: 5,
      isSubClient: true,
    }));

    const result = await sut.execute(100, { parentClientId: null });

    expect(result.message).toContain('sucesso');
    expect(clientRepository.edit).toHaveBeenCalledTimes(1);
    const edited = jest.mocked(clientRepository.edit).mock.calls[0][0];
    expect(edited.props.parentClientId).toBeNull();
    expect(edited.props.isSubClient).toBe(false);
  });

  it('should set parent when valid', async() => {
    jest.spyOn(clientDao, 'findById')
      .mockResolvedValueOnce(minimalClientDto({ id: 10, companies: [{ id: 1, name: 'Co' }] }))
      .mockResolvedValueOnce(minimalClientDto({
        id: 20,
        parentClientId: null,
        isSubClient: false,
      }));

    jest.spyOn(clientDao, 'countSubClients').mockResolvedValueOnce(0);

    const result = await sut.execute(10, { parentClientId: 20 });

    expect(result.message).toContain('sucesso');
    expect(clientDao.countSubClients).toHaveBeenCalledWith(10);
    expect(clientRepository.edit).toHaveBeenCalledTimes(1);
    expect(jest.mocked(clientRepository.edit).mock.calls[0][0].props.parentClientId).toBe(20);
  });

  it('should throw ClientHasSubClientsCannotSetParentError when assigning parent and client has sub-clients', async() => {
    jest.spyOn(clientDao, 'findById').mockResolvedValueOnce(minimalClientDto({
      parentClientId: null,
      id: 1,
    }));

    jest.spyOn(clientDao, 'countSubClients').mockResolvedValueOnce(3);

    await expect(sut.execute(1, { parentClientId: 99 })).rejects.toThrow(
      ClientHasSubClientsCannotSetParentError,
    );
    expect(clientRepository.edit).not.toHaveBeenCalled();
  });

  it('should not count sub-clients when detaching', async() => {
    jest.spyOn(clientDao, 'findById').mockResolvedValueOnce(minimalClientDto({
      parentClientId: 5,
      isSubClient: true,
      id: 2,
      companies: [{ id: 1, name: 'X' }],
    }));

    await sut.execute(2, { parentClientId: null });

    expect(clientDao.countSubClients).not.toHaveBeenCalled();
    expect(clientRepository.edit).toHaveBeenCalled();
  });

  it('should throw ClientCannotBeSelfParentError when parent equals self', async() => {
    jest.spyOn(clientDao, 'findById').mockResolvedValueOnce(minimalClientDto({ id: 1 }));

    jest.spyOn(clientDao, 'countSubClients').mockResolvedValueOnce(0);

    await expect(sut.execute(1, { parentClientId: 1 })).rejects.toThrow(ClientCannotBeSelfParentError);
    expect(clientRepository.edit).not.toHaveBeenCalled();
  });

  it('should throw ClientNotFoundError when parent does not exist', async() => {
    jest.spyOn(clientDao, 'findById')
      .mockResolvedValueOnce(minimalClientDto({ id: 10 }))
      .mockResolvedValueOnce(null);

    jest.spyOn(clientDao, 'countSubClients').mockResolvedValueOnce(0);

    await expect(sut.execute(10, { parentClientId: 888 })).rejects.toThrow(ClientNotFoundError);
    expect(clientRepository.edit).not.toHaveBeenCalled();
  });

  it('should throw ClientParentIsSubClientError when parent is sub-client', async() => {
    jest.spyOn(clientDao, 'findById')
      .mockResolvedValueOnce(minimalClientDto({ id: 10 }))
      .mockResolvedValueOnce(minimalClientDto({
        id: 20,
        isSubClient: true,
      }));

    jest.spyOn(clientDao, 'countSubClients').mockResolvedValueOnce(0);

    await expect(sut.execute(10, { parentClientId: 20 })).rejects.toThrow(ClientParentIsSubClientError);
    expect(clientRepository.edit).not.toHaveBeenCalled();
  });
});
