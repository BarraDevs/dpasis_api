const TOKENS = {
  CacheGateway: Symbol.for('CacheGateway'),
  LoggerGateway: Symbol.for('LoggerGateway'),

  AccountDao: Symbol.for('AccountDao'),

  AddressDao: Symbol.for('AddressDao'),
  AttachmentDao: Symbol.for('AttachmentDao'),
  ContactDao: Symbol.for('ContactDao'),
  LicenseDao: Symbol.for('LicenseDao'),
  OwnerDao: Symbol.for('OwnerDao'),

  ClientDao: Symbol.for('ClientDao'),
  ClientRepository: Symbol.for('ClientRepository'),

  SupplierDao: Symbol.for('SupplierDao'),
  SupplierRepository: Symbol.for('SupplierRepository'),
};

export { TOKENS };
