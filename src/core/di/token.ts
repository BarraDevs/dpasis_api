const TOKENS = {
  CacheGateway: Symbol.for('CacheGateway'),
  CepLookupGateway: Symbol.for('CepLookupGateway'),
  CnpjLookupGateway: Symbol.for('CnpjLookupGateway'),
  LoggerGateway: Symbol.for('LoggerGateway'),

  UploadFileGateway: Symbol.for('UploadFileGateway'),
  UploadFileQueueProducer: Symbol.for('UploadFileQueueProducer'),

  AccountDao: Symbol.for('AccountDao'),
  FaqDao: Symbol.for('FaqDao'),

  ClientDao: Symbol.for('ClientDao'),
  ClientRepository: Symbol.for('ClientRepository'),

  ClientContactDao: Symbol.for('ClientContactDao'),
  ClientContactRepository: Symbol.for('ClientContactRepository'),

  ClientDepartmentDao: Symbol.for('ClientDepartmentDao'),

  ClientTypeDao: Symbol.for('ClientTypeDao'),
  ClientAttendanceTypeDao: Symbol.for('ClientAttendanceTypeDao'),
  ClientAttachmentDao: Symbol.for('ClientAttachmentDao'),
  ClientDescriptionTypeDao: Symbol.for('ClientDescriptionTypeDao'),
  ClientDriveTypeDao: Symbol.for('ClientDriveTypeDao'),
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

  AdminDao: Symbol.for('AdminDao'),
  AdminRepository: Symbol.for('AdminRepository'),

  CnaeDao: Symbol.for('CnaeDao'),
  NbsDao: Symbol.for('NbsDao'),
  IndopDao: Symbol.for('IndopDao'),
  CnaeNbsIndopDao: Symbol.for('CnaeNbsIndopDao'),

  BankDao: Symbol.for('BankDao'),
  BilledDao: Symbol.for('BilledDao'),
  BilledRepository: Symbol.for('BilledRepository'),
  CategoryDao: Symbol.for('CategoryDao'),
  FreightDao: Symbol.for('FreightDao'),
  DeliveryTermDao: Symbol.for('DeliveryTermDao'),
  WarrantyDao: Symbol.for('WarrantyDao'),
  ProposalValidityDao: Symbol.for('ProposalValidityDao'),

  ServiceCatalogDao: Symbol.for('ServiceCatalogDao'),
  ServiceCatalogRepository: Symbol.for('ServiceCatalogRepository'),

  ServiceAttendanceValueDao: Symbol.for('ServiceAttendanceValueDao'),
  ServiceAttendanceValueRepository: Symbol.for('ServiceAttendanceValueRepository'),
};

export { TOKENS };
