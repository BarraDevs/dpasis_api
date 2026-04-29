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
      nickname: 'Nick',
      validityDate: new Date('2026-06-01T00:00:00.000Z'),
      accessEmail: null,
      accessPassword: null,
      paymentDay: 5,
      bonus: null,
      billingStartDay: 1,
      receivesSupportEmail: false,
      servedByRoot: true,
      manufacturerResale: false,
      indicatorResale: true,
      recurringResale: false,
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
