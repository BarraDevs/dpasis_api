const TOKENS = {
  CacheGateway: Symbol.for('CacheGateway'),
  CepLookupGateway: Symbol.for('CepLookupGateway'),
  CnpjLookupGateway: Symbol.for('CnpjLookupGateway'),
  LoggerGateway: Symbol.for('LoggerGateway'),
  UploadFileGateway: Symbol.for('UploadFileGateway'),

  AccountDao: Symbol.for('AccountDao'),
  FaqDao: Symbol.for('FaqDao'),

  ClientDao: Symbol.for('ClientDao'),
  ClientRepository: Symbol.for('ClientRepository'),
  ClientGroupDao: Symbol.for('ClientGroupDao'),
  ClientDepartmentDao: Symbol.for('ClientDepartmentDao'),
  ClientContactDao: Symbol.for('ClientContactDao'),
  ClientContactRepository: Symbol.for('ClientContactRepository'),
  ClientOwnerDao: Symbol.for('ClientOwnerDao'),
  ClientAddressDao: Symbol.for('ClientAddressDao'),
  ClientAddressRepository: Symbol.for('ClientAddressRepository'),
  ClientItemDao: Symbol.for('ClientItemDao'),
  ClientItemRepository: Symbol.for('ClientItemRepository'),
  ClientInvoiceConfigDao: Symbol.for('ClientInvoiceConfigDao'),
  ClientInvoiceConfigRepository: Symbol.for('ClientInvoiceConfigRepository'),

  CompanyDao: Symbol.for('CompanyDao'),
  CompanyRepository: Symbol.for('CompanyRepository'),

  CnaeDao: Symbol.for('CnaeDao'),
  NbsDao: Symbol.for('NbsDao'),
  IndopDao: Symbol.for('IndopDao'),
  CnaeNbsIndopDao: Symbol.for('CnaeNbsIndopDao'),

  BankDao: Symbol.for('BankDao'),
};

export { TOKENS };
