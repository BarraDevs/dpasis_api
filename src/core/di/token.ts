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

  ClientContactDao: Symbol.for('ClientContactDao'),
  ClientContactRepository: Symbol.for('ClientContactRepository'),
  ClientDepartmentDao: Symbol.for('ClientDepartmentDao'),

  ClientAttendanceTypeDao: Symbol.for('ClientAttendanceTypeDao'),
  ClientAttachmentDao: Symbol.for('ClientAttachmentDao'),
  ClientDescriptionTypeDao: Symbol.for('ClientDescriptionTypeDao'),
  ClientMaintenanceTicketTypeDao: Symbol.for('ClientMaintenanceTicketTypeDao'),
  ClientSystemTypeDao: Symbol.for('ClientSystemTypeDao'),

  ClientGroupDao: Symbol.for('ClientGroupDao'),
  ClientOwnerDao: Symbol.for('ClientOwnerDao'),

  ClientAddressDao: Symbol.for('ClientAddressDao'),
  ClientAddressRepository: Symbol.for('ClientAddressRepository'),

  ClientItemDao: Symbol.for('ClientItemDao'),
  ClientItemRepository: Symbol.for('ClientItemRepository'),

  ClientDiscountDao: Symbol.for('ClientDiscountDao'),
  ClientDiscountRepository: Symbol.for('ClientDiscountRepository'),
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
