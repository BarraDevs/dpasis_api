import { Supplier } from './supplier.entity';

describe('Supplier Entity', () => {
  const validProps = {
    cnpj: '11.222.333/0001-44',
    ie: '123.456.789.110',
    group: 'Matéria Prima',
    type: 'Nacional',
    companyName: 'Fornecedor XYZ Ltda.',
    fantasyName: 'Fornecedor XYZ',
    representative: 'Carlos Silva',
  };

  it('should create a new supplier with active=true and timestamps', () => {
    // Act
    const supplier = Supplier.create(validProps);

    // Assert
    expect(supplier).toBeInstanceOf(Supplier);
    expect(supplier.props.id).toBeDefined();
    expect(supplier.props.cnpj).toBe(validProps.cnpj);
    expect(supplier.props.ie).toBe(validProps.ie);
    expect(supplier.props.group).toBe(validProps.group);
    expect(supplier.props.type).toBe(validProps.type);
    expect(supplier.props.companyName).toBe(validProps.companyName);
    expect(supplier.props.fantasyName).toBe(validProps.fantasyName);
    expect(supplier.props.representative).toBe(validProps.representative);
    expect(supplier.props.active).toBe(true);
    expect(supplier.props.createdAt).toBeInstanceOf(Date);
    expect(supplier.props.updatedAt).toBeInstanceOf(Date);
  });

  it('should load an existing supplier', () => {
    // Arrange
    const existingProps = {
      ...validProps,
      id: 'existing-uuid',
      active: false,
      createdAt: new Date('2023-01-01T10:00:00Z'),
      updatedAt: new Date('2023-01-02T10:00:00Z'),
    };

    // Act
    const supplier = Supplier.load(existingProps);

    // Assert
    expect(supplier).toBeInstanceOf(Supplier);
    expect(supplier.props).toEqual(existingProps);
  });
});
