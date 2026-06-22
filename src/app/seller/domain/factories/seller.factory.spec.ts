import { InvalidCommissionError } from 'src/shared/value-objects/commission/commision.vo.error';
import { InvalidEmailError } from 'src/shared/value-objects/email/email.error';
import { SellerFactory } from './seller.factory';

function makeValidCreateProps() {
  return {
    name: 'João Silva',
    phone: '1133334444',
    nickname: 'João',
    whatsapp: '11999998888',
    email: 'joao@vendedor.com',
    commission: 10.5,
    profilePictureUrl: null,
    observation: null,
    zipCode: '01310100',
    street: 'Av Paulista',
    number: '1000',
    complement: null,
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  };
}

describe('SellerFactory - Unit tests', () => {
  describe('create', () => {
    it('should create seller with active true and id 0', () => {
      const seller = SellerFactory.create(makeValidCreateProps());

      expect(seller.props.id).toBe(0);
      expect(seller.props.active).toBe(true);
      expect(seller.props.email).toBe('joao@vendedor.com');
      expect(seller.props.commission).toBe(10.5);
    });

    it('should normalize email to lowercase', () => {
      const seller = SellerFactory.create({
        ...makeValidCreateProps(),
        email: 'JOAO@Vendedor.COM',
      });

      expect(seller.props.email).toBe('joao@vendedor.com');
    });

    it('should throw InvalidEmailError for invalid email', () => {
      expect(() => SellerFactory.create({
        ...makeValidCreateProps(),
        email: 'invalid',
      })).toThrow(InvalidEmailError);
    });

    it('should throw InvalidCommissionError when commission is below 0', () => {
      expect(() => SellerFactory.create({
        ...makeValidCreateProps(),
        commission: -1,
      })).toThrow(InvalidCommissionError);
    });

    it('should throw InvalidCommissionError when commission is above 100', () => {
      expect(() => SellerFactory.create({
        ...makeValidCreateProps(),
        commission: 101,
      })).toThrow(InvalidCommissionError);
    });

    it('should throw when name is empty', () => {
      expect(() => SellerFactory.create({
        ...makeValidCreateProps(),
        name: '',
      })).toThrow('O campo name não pode ser vazio');
    });
  });

  describe('edit', () => {
    it('should preserve id and active', () => {
      const seller = SellerFactory.edit({
        ...makeValidCreateProps(),
        id: 5,
        active: false,
      });

      expect(seller.props.id).toBe(5);
      expect(seller.props.active).toBe(false);
    });
  });

  describe('load', () => {
    it('should load seller without re-validating', () => {
      const seller = SellerFactory.load({
        ...makeValidCreateProps(),
        id: 1,
        active: true,
      });

      expect(seller.props.id).toBe(1);
    });
  });
});
