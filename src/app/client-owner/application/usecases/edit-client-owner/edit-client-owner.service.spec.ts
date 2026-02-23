import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ClientOwnerAlreadyExistsError } from 'src/app/client-owner/domain/errors/client-owner-already-exists.error';
import { ClientOwnerNotFoundError } from 'src/app/client-owner/domain/errors/client-owner-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientOwnerDto } from '../../dtos/client-owner.dto';
import type { IClientOwnerDao } from '../../persistence/dao/client-owner-dao.interface';
import { EditClientOwnerInputDto } from './dtos/edit-client-owner.dto';
import { EditClientOwner } from './edit-client-owner.service';

function makeValidEditClientOwnerInput(overrides: Partial<EditClientOwnerInputDto> = {}): EditClientOwnerInputDto {
  return {
    name: 'Novo nome',
    ...overrides,
  };
}

function makeClientOwnerDto(overrides: Partial<ClientOwnerDto> = {}): ClientOwnerDto {
  const now = new Date();
  return {
    id: 1,
    name: 'Nome antigo',
    active: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('EditClientOwner - Unit tests', () => {
  let sut: EditClientOwner;
  let clientOwnerDao: IClientOwnerDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        EditClientOwner,
        {
          provide: TOKENS.ClientOwnerDao,
          useValue: createMock<IClientOwnerDao>(),
        },
      ],
    }).compile();

    sut = module.get(EditClientOwner);
    clientOwnerDao = module.get(TOKENS.ClientOwnerDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ClientOwnerNotFoundError when client owner does not exist', async() => {
    // Arrange
    const id = 0;
    const data = makeValidEditClientOwnerInput();
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(ClientOwnerNotFoundError);
  });

  it('should call clientOwnerDao.findById to validate existence', async() => {
    // Arrange
    const id = 1;
    const data = makeValidEditClientOwnerInput();
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(makeClientOwnerDto({ id }));
    jest.spyOn(clientOwnerDao, 'findByName').mockResolvedValue(null);
    const findByIdSpy = jest.spyOn(clientOwnerDao, 'findById');

    // Act
    await sut.execute(id, data);

    // Assert
    expect(findByIdSpy).toHaveBeenCalledWith(id);
    expect(findByIdSpy).toHaveBeenCalledTimes(1);
  });

  it('should call clientOwnerDao.findByName before edit', async() => {
    // Arrange
    const id = 1;
    const data = makeValidEditClientOwnerInput();
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(makeClientOwnerDto({ id }));
    jest.spyOn(clientOwnerDao, 'findByName').mockResolvedValue(null);
    const findByNameSpy = jest.spyOn(clientOwnerDao, 'findByName');

    // Act
    await sut.execute(id, data);

    // Assert
    expect(findByNameSpy).toHaveBeenCalledTimes(1);
    expect(findByNameSpy).toHaveBeenCalledWith(data.name.trim());
  });

  it('should call clientOwnerDao.edit with id and data', async() => {
    // Arrange
    const id = 1;
    const data = makeValidEditClientOwnerInput();
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(makeClientOwnerDto({ id }));
    jest.spyOn(clientOwnerDao, 'findByName').mockResolvedValue(null);
    const editSpy = jest.spyOn(clientOwnerDao, 'edit');

    // Act
    await sut.execute(id, data);

    // Assert
    expect(editSpy).toHaveBeenCalledWith(id, data);
    expect(editSpy).toHaveBeenCalledTimes(1);
  });

  it('should return success message', async() => {
    // Arrange
    const id = 1;
    const data = makeValidEditClientOwnerInput();
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(makeClientOwnerDto({ id }));
    jest.spyOn(clientOwnerDao, 'findByName').mockResolvedValue(null);

    // Act
    const result = await sut.execute(id, data);

    // Assert
    expect(result).toEqual<SuccessMessage>({
      message: 'Proprietário de clientes atualizado com sucesso',
    });
  });

  it('should not call edit when client owner does not exist', async() => {
    // Arrange
    const id = 0;
    const data = makeValidEditClientOwnerInput();
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(null);
    const editSpy = jest.spyOn(clientOwnerDao, 'edit');

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(ClientOwnerNotFoundError);
    expect(editSpy).not.toHaveBeenCalled();
  });

  it('should throw ClientOwnerAlreadyExistsError when name already exists for another owner', async() => {
    // Arrange
    const id = 1;
    const data = makeValidEditClientOwnerInput({ name: 'Nome Existente' });
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(makeClientOwnerDto({ id }));
    jest.spyOn(clientOwnerDao, 'findByName').mockResolvedValue(makeClientOwnerDto({ id: 2, name: data.name }));
    const editSpy = jest.spyOn(clientOwnerDao, 'edit');

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(ClientOwnerAlreadyExistsError);
    expect(editSpy).not.toHaveBeenCalled();
  });

  it('should allow edit when name belongs to the same owner being edited', async() => {
    // Arrange
    const id = 1;
    const data = makeValidEditClientOwnerInput({ name: 'Mesmo Nome' });
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(makeClientOwnerDto({ id, name: data.name }));
    jest.spyOn(clientOwnerDao, 'findByName').mockResolvedValue(makeClientOwnerDto({ id, name: data.name }));
    const editSpy = jest.spyOn(clientOwnerDao, 'edit');

    // Act
    await sut.execute(id, data);

    // Assert
    expect(editSpy).toHaveBeenCalledWith(id, data);
  });
});
