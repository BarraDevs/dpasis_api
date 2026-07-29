import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { TOKENS } from 'src/core/di/token';
import { ClientAddressDto } from '../../dtos/client-address.dto';
import type { IClientAddressDao } from '../../persistence/dao/client-address-dao.interface';
import { FindClientAddressByClientIdAndType } from './find-client-address-by-client-id-and-type.service';

describe('FindClientAddressByClientIdAndType - Unit tests', () => {
  let sut: FindClientAddressByClientIdAndType;
  let clientAddressDao: IClientAddressDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindClientAddressByClientIdAndType,
        { provide: TOKENS.ClientAddressDao, useValue: createMock<IClientAddressDao>() },
      ],
    }).compile();

    sut = module.get(FindClientAddressByClientIdAndType);
    clientAddressDao = module.get(TOKENS.ClientAddressDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return the address when found', async() => {
    // Arrange
    const address = createMock<ClientAddressDto>({ id: 1, type: ClientAddressType.BILLING });
    jest.spyOn(clientAddressDao, 'findByClientIdAndType').mockResolvedValue(address);

    // Act
    const result = await sut.execute(10, ClientAddressType.BILLING);

    // Assert
    expect(clientAddressDao.findByClientIdAndType).toHaveBeenCalledWith(10, ClientAddressType.BILLING);
    expect(result).toBe(address);
  });

  it('should return null when the address does not exist', async() => {
    // Arrange
    jest.spyOn(clientAddressDao, 'findByClientIdAndType').mockResolvedValue(null);

    // Act
    const result = await sut.execute(10, ClientAddressType.MAIN);

    // Assert
    expect(result).toBeNull();
  });
});
