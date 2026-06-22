import { Seller, SellerProps } from './seller.entity';

function makeSellerProps(overrides?: Partial<SellerProps>): SellerProps {
  return {
    id: 1,
    name: 'João Silva',
    phone: '1133334444',
    nickname: 'João',
    whatsapp: '11999998888',
    email: 'joao@vendedor.com',
    commission: 10,
    profilePictureUrl: null,
    observation: null,
    zipCode: '01310100',
    street: 'Av Paulista',
    number: '1000',
    complement: null,
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    active: true,
    ...overrides,
  };
}

describe('Seller - Unit tests', () => {
  describe('_instantiate', () => {
    it('should create a Seller instance with the provided props', () => {
      const props = makeSellerProps();

      const seller = Seller._instantiate(props);

      expect(seller).toBeInstanceOf(Seller);
    });
  });

  describe('props', () => {
    it('should return all props correctly', () => {
      const props = makeSellerProps({ id: 42, name: 'Maria Santos' });

      const seller = Seller._instantiate(props);

      expect(seller.props).toEqual<SellerProps>(props);
    });

    it('should return a copy of props (immutability)', () => {
      const props = makeSellerProps();
      const seller = Seller._instantiate(props);

      const returnedProps = seller.props;
      (returnedProps as Record<string, unknown>).name = 'Modified Name';

      expect(seller.props.name).toBe('João Silva');
    });
  });

  describe('isActive', () => {
    it('should return true when active', () => {
      const seller = Seller._instantiate(makeSellerProps({ active: true }));

      expect(seller.isActive()).toBe(true);
    });

    it('should return false when inactive', () => {
      const seller = Seller._instantiate(makeSellerProps({ active: false }));

      expect(seller.isActive()).toBe(false);
    });
  });

  describe('activate and deactivate', () => {
    it('should activate the seller', () => {
      const seller = Seller._instantiate(makeSellerProps({ active: false }));

      seller.activate();

      expect(seller.isActive()).toBe(true);
    });

    it('should deactivate the seller', () => {
      const seller = Seller._instantiate(makeSellerProps({ active: true }));

      seller.deactivate();

      expect(seller.isActive()).toBe(false);
    });
  });
});
