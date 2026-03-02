import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientGroupAlreadyExistsError } from '../../../domain/errors/client-group-already-exists.error';
import { ClientGroupNotFoundError } from '../../../domain/errors/client-group-not-found.error';
import { ClientGroupDto } from '../../dtos/client-group.dto';
import type { IClientGroupDao } from '../../persistence/dao/client-group-dao.interface';
import { EditClientGroupInputDto } from './dtos/edit-client-group.dto';
import { EditClientGroup } from './edit-client-group.service';

function makeValidEditClientGroupInput(overrides: Partial<EditClientGroupInputDto> = {}): EditClientGroupInputDto {
  return {
    name: 'Novo nome',
    ...overrides,
  };
}

function makeClientGroupDto(overrides: Partial<ClientGroupDto> = {}): ClientGroupDto {
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

describe('EditClientGroup - Unit tests', () => {
  let sut: EditClientGroup;
  let clientGroupDao: IClientGroupDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        EditClientGroup,
        {
          provide: TOKENS.ClientGroupDao,
          useValue: createMock<IClientGroupDao>(),
        },
      ],
    }).compile();

    sut = module.get(EditClientGroup);
    clientGroupDao = module.get(TOKENS.ClientGroupDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ClientGroupNotFoundError when client group does not exist', async() => {
    // Arrange
    const id = 0;
    const data = makeValidEditClientGroupInput();
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(ClientGroupNotFoundError);
  });

  it('should call clientGroupDao.findById to validate existence', async() => {
    // Arrange
    const id = 1;
    const data = makeValidEditClientGroupInput();
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(makeClientGroupDto({ id }));
    jest.spyOn(clientGroupDao, 'findByName').mockResolvedValue(null);
    const findByIdSpy = jest.spyOn(clientGroupDao, 'findById');

    // Act
    await sut.execute(id, data);

    // Assert
    expect(findByIdSpy).toHaveBeenCalledWith(id);
    expect(findByIdSpy).toHaveBeenCalledTimes(1);
  });

  it('should call clientGroupDao.findByName before edit', async() => {
    // Arrange
    const id = 1;
    const data = makeValidEditClientGroupInput();
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(makeClientGroupDto({ id }));
    jest.spyOn(clientGroupDao, 'findByName').mockResolvedValue(null);
    const findByNameSpy = jest.spyOn(clientGroupDao, 'findByName');

    // Act
    await sut.execute(id, data);

    // Assert
    expect(findByNameSpy).toHaveBeenCalledTimes(1);
    expect(findByNameSpy).toHaveBeenCalledWith(data.name.trim());
  });

  it('should call clientGroupDao.edit with id and data', async() => {
    // Arrange
    const id = 1;
    const data = makeValidEditClientGroupInput();
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(makeClientGroupDto({ id }));
    jest.spyOn(clientGroupDao, 'findByName').mockResolvedValue(null);
    const editSpy = jest.spyOn(clientGroupDao, 'edit');

    // Act
    await sut.execute(id, data);

    // Assert
    expect(editSpy).toHaveBeenCalledWith(id, data);
    expect(editSpy).toHaveBeenCalledTimes(1);
  });

  it('should return success message', async() => {
    // Arrange
    const id = 1;
    const data = makeValidEditClientGroupInput();
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(makeClientGroupDto({ id }));
    jest.spyOn(clientGroupDao, 'findByName').mockResolvedValue(null);

    // Act
    const result = await sut.execute(id, data);

    // Assert
    expect(result).toEqual<SuccessMessage>({
      message: 'Grupo de clientes atualizado com sucesso',
    });
  });

  it('should not call edit when client group does not exist', async() => {
    // Arrange
    const id = 0;
    const data = makeValidEditClientGroupInput();
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(null);
    const editSpy = jest.spyOn(clientGroupDao, 'edit');

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(ClientGroupNotFoundError);
    expect(editSpy).not.toHaveBeenCalled();
  });

  it('should throw ClientGroupAlreadyExistsError when name already exists for another group', async() => {
    // Arrange
    const id = 1;
    const data = makeValidEditClientGroupInput({ name: 'Nome Existente' });
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(makeClientGroupDto({ id }));
    jest.spyOn(clientGroupDao, 'findByName').mockResolvedValue(makeClientGroupDto({ id: 2, name: data.name }));
    const editSpy = jest.spyOn(clientGroupDao, 'edit');

    // Act & Assert
    await expect(sut.execute(id, data)).rejects.toThrow(ClientGroupAlreadyExistsError);
    expect(editSpy).not.toHaveBeenCalled();
  });

  it('should allow edit when name belongs to the same group being edited', async() => {
    // Arrange
    const id = 1;
    const data = makeValidEditClientGroupInput({ name: 'Mesmo Nome' });
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(makeClientGroupDto({ id, name: data.name }));
    jest.spyOn(clientGroupDao, 'findByName').mockResolvedValue(makeClientGroupDto({ id, name: data.name }));
    const editSpy = jest.spyOn(clientGroupDao, 'edit');

    // Act
    await sut.execute(id, data);

    // Assert
    expect(editSpy).toHaveBeenCalledWith(id, data);
  });
});
