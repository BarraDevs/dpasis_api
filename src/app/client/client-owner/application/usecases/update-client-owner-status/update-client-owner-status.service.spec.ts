import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientOwnerNotFoundError } from '../../../domain/errors/client-owner-not-found.error';
import { ClientOwnerDto } from '../../dtos/client-owner.dto';
import type { IClientOwnerDao } from '../../persistence/dao/client-owner-dao.interface';
import { UpdateClientOwnerStatus } from './update-client-owner-status.service';

describe('UpdateClientOwnerStatus - Unit tests', () => {
  let sut: UpdateClientOwnerStatus;
  let clientOwnerDao: IClientOwnerDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        UpdateClientOwnerStatus,
        {
          provide: TOKENS.ClientOwnerDao,
          useValue: createMock<IClientOwnerDao>(),
        },
      ],
    }).compile();

    sut = module.get(UpdateClientOwnerStatus);
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
  });

  it('should call clientOwnerDao.findById to get current status', async() => {
    // Arrange
    const id = 1;
    const clientOwner = createMock<ClientOwnerDto>({ id, active: true });
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(clientOwner);
    const findByIdSpy = jest.spyOn(clientOwnerDao, 'findById');

    // Act
    await sut.execute(id);

    // Assert
    expect(findByIdSpy).toHaveBeenCalledWith(id);
    expect(findByIdSpy).toHaveBeenCalledTimes(1);
  });

  it('should call clientOwnerDao.updateStatus with inverted active when current is true', async() => {
    // Arrange
    const id = 1;
    const clientOwner = createMock<ClientOwnerDto>({ id, active: true });
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(clientOwner);
    const updateStatusSpy = jest.spyOn(clientOwnerDao, 'updateStatus');

    // Act
    await sut.execute(id);

    // Assert
    expect(updateStatusSpy).toHaveBeenCalledWith(id, false);
    expect(updateStatusSpy).toHaveBeenCalledTimes(1);
  });

  it('should call clientOwnerDao.updateStatus with inverted active when current is false', async() => {
    // Arrange
    const id = 1;
    const clientOwner = createMock<ClientOwnerDto>({ id, active: false });
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(clientOwner);
    const updateStatusSpy = jest.spyOn(clientOwnerDao, 'updateStatus');

    // Act
    await sut.execute(id);

    // Assert
    expect(updateStatusSpy).toHaveBeenCalledWith(id, true);
    expect(updateStatusSpy).toHaveBeenCalledTimes(1);
  });

  it('should return success message', async() => {
    // Arrange
    const id = 1;
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(createMock<ClientOwnerDto>({ active: true }));

    // Act
    const result = await sut.execute(id);

    // Assert
    expect(result).toEqual<SuccessMessage>({
      message: 'Status do proprietário de clientes atualizado com sucesso',
    });
  });

  it('should not call updateStatus when client owner does not exist', async() => {
    // Arrange
    const id = 0;
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(null);
    const updateStatusSpy = jest.spyOn(clientOwnerDao, 'updateStatus');

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(ClientOwnerNotFoundError);
    expect(updateStatusSpy).not.toHaveBeenCalled();
  });
});
