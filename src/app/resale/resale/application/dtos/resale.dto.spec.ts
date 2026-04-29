import { plainToInstance } from 'class-transformer';
import { ResaleDto } from './resale.dto';

describe('ResaleDto', () => {
  it('should map plain object to instance with all fields', () => {
    const plain = {
      id: 1,
      name: 'R',
      identifier: 'I',
      zipCode: 'Z',
      street: 'S',
      neighborhood: 'N',
      city: 'C',
      state: 'ST',
      licenseType: 'L',
      document: '09748165000110',
      ie: null,
      phone01: 'P1',
      phone02: null,
      voucher: null,
      email: null,
      website: null,
      receivesSupportEmail: false,
      servedByDpa: true,
      manufacturerReseller: false,
      profilePictureUrl: null,
      active: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
    };

    const dto = plainToInstance(ResaleDto, plain);

    expect(dto).toBeInstanceOf(ResaleDto);
    expect(dto).toMatchObject(plain);
  });
});
