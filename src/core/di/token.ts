const TOKENS = {
  CacheGateway: Symbol.for('CacheGateway'),
  LoggerGateway: Symbol.for('LoggerGateway'),

  AccountDao: Symbol.for('AccountDao'),

  AddressDao: Symbol.for('AddressDao'),
  AttachmentDao: Symbol.for('AttachmentDao'),
  ContactDao: Symbol.for('ContactDao'),
  LicenseDao: Symbol.for('LicenseDao'),
  OwnerDao: Symbol.for('OwnerDao'),

  CompanyDao: Symbol.for('CompanyDao'),
  CompanyRepository: Symbol.for('CompanyRepository'),

  ClientDao: Symbol.for('ClientDao'),
  ClientRepository: Symbol.for('ClientRepository'),

  ItemDao: Symbol.for('ItemDao'),
  ItemRepository: Symbol.for('ItemRepository'),

  ProviderDao: Symbol.for('ProviderDao'),
  ProviderRepository: Symbol.for('ProviderRepository'),

  ShipperDao: Symbol.for('ShipperDao'),
  ShipperRepository: Symbol.for('ShipperRepository'),

  SupplierDao: Symbol.for('SupplierDao'),
  SupplierRepository: Symbol.for('SupplierRepository'),
};

export { TOKENS };
