import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ClientOwnerNotFoundError } from 'src/app/client-owner/domain/errors/client-owner-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientOwnerDto } from '../../dtos/client-owner.dto';
import type { IClientOwnerDao } from '../../persistence/dao/client-owner-dao.interface';
import { DeleteClientOwner } from './delete-client-owner.service';

describe('DeleteClientOwner - Unit tests', () => {
  let sut: DeleteClientOwner;
  let clientOwnerDao: IClientOwnerDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        DeleteClientOwner,
        {
          provide: TOKENS.ClientOwnerDao,
          useValue: createMock<IClientOwnerDao>(),
        },
      ],
    }).compile();

    sut = module.get(DeleteClientOwner);
    clientOwnerDao = module.get(TOKENS.ClientOwnerDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ClientOwnerNotFoundError when client owner does not exist', async() => {
    // Arrange
    const id = 0;
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(ClientOwnerNotFoundError);
    await expect(sut.execute(id)).rejects.toThrow('Proprietário de clientes não encontrado na base de dados.');
  });

  it('should call clientOwnerDao.findById to validate existence', async() => {
    // Arrange
    const id = 1;
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(createMock<ClientOwnerDto>());
    const findByIdSpy = jest.spyOn(clientOwnerDao, 'findById');

    // Act
    await sut.execute(id);

    // Assert
    expect(findByIdSpy).toHaveBeenCalledWith(id);
    expect(findByIdSpy).toHaveBeenCalledTimes(1);
  });

  it('should call clientOwnerDao.delete with correct id', async() => {
    // Arrange
    const id = 1;
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(createMock<ClientOwnerDto>());
    const deleteSpy = jest.spyOn(clientOwnerDao, 'delete');

    // Act
    await sut.execute(id);

    // Assert
    expect(deleteSpy).toHaveBeenCalledWith(id);
    expect(deleteSpy).toHaveBeenCalledTimes(1);
  });

  it('should return success message', async() => {
    // Arrange
    const id = 1;
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(createMock<ClientOwnerDto>());

    // Act
    const result = await sut.execute(id);

    // Assert
    expect(result).toEqual<SuccessMessage>({
      message: 'Proprietário de clientes excluído com sucesso',
    });
  });

  it('should not call delete when client owner does not exist', async() => {
    // Arrange
    const id = 0;
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(null);
    const deleteSpy = jest.spyOn(clientOwnerDao, 'delete');

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(ClientOwnerNotFoundError);
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});
