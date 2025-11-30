const TOKENS = {
  CacheGateway: Symbol.for('CacheGateway'),
  LoggerGateway: Symbol.for('LoggerGateway'),

  AccountDao: Symbol.for('AccountDao'),

  AddressDao: Symbol.for('AddressDao'),
  AttachmentDao: Symbol.for('AttachmentDao'),
  ContactDao: Symbol.for('ContactDao'),
  LicenseDao: Symbol.for('LicenseDao'),
  OwnerDao: Symbol.for('OwnerDao'),
  ShipperDao: Symbol.for('ShipperDao'),

  CompanyDao: Symbol.for('CompanyDao'),
  CompanyRepository: Symbol.for('CompanyRepository'),

  ClientDao: Symbol.for('ClientDao'),
  ClientRepository: Symbol.for('ClientRepository'),

  ItemDao: Symbol.for('ItemDao'),
  ItemRepository: Symbol.for('ItemRepository'),

  SupplierDao: Symbol.for('SupplierDao'),
  SupplierRepository: Symbol.for('SupplierRepository'),
};

export { TOKENS };
