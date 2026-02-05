const TOKENS = {
  CacheGateway: Symbol.for('CacheGateway'),
  LoggerGateway: Symbol.for('LoggerGateway'),
  UploadGateway: Symbol.for('UploadGateway'),

  AccountDao: Symbol.for('AccountDao'),

  AddressDao: Symbol.for('AddressDao'),
  AttachmentDao: Symbol.for('AttachmentDao'),
  ContactDao: Symbol.for('ContactDao'),
  LicenseDao: Symbol.for('LicenseDao'),
  OwnerDao: Symbol.for('OwnerDao'),
  ServiceCategoryDao: Symbol.for('ServiceCategoryDao'),

  BudgetDao: Symbol.for('BudgetDao'),
  BudgetRepository: Symbol.for('BudgetRepository'),

  CompanyDao: Symbol.for('CompanyDao'),
  CompanyRepository: Symbol.for('CompanyRepository'),

  ClientDao: Symbol.for('ClientDao'),
  ClientRepository: Symbol.for('ClientRepository'),

  ItemDao: Symbol.for('ItemDao'),
  ItemRepository: Symbol.for('ItemRepository'),

  OrderDao: Symbol.for('OrderDao'),
  OrderRepository: Symbol.for('OrderRepository'),

  ProductDao: Symbol.for('ProductDao'),
  ProductRepository: Symbol.for('ProductRepository'),
  ProductStockMovementRepository: Symbol.for('ProductStockMovementRepository'),

  ProviderDao: Symbol.for('ProviderDao'),
  ProviderRepository: Symbol.for('ProviderRepository'),

  SellerDao: Symbol.for('SellerDao'),
  SellerRepository: Symbol.for('SellerRepository'),

  ShipperDao: Symbol.for('ShipperDao'),
  ShipperRepository: Symbol.for('ShipperRepository'),

  SupplierDao: Symbol.for('SupplierDao'),
  SupplierRepository: Symbol.for('SupplierRepository'),

  ServiceDao: Symbol.for('ServiceDao'),
  ServiceRepository: Symbol.for('ServiceRepository'),
};

export { TOKENS };
