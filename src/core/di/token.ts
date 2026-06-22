const TOKENS = {
  AuditLogDao: Symbol.for('AuditLogDao'),

  CacheGateway: Symbol.for('CacheGateway'),
  CepLookupGateway: Symbol.for('CepLookupGateway'),
  CnpjLookupGateway: Symbol.for('CnpjLookupGateway'),
  TaxInvoiceGenerationGateway: Symbol.for('TaxInvoiceGenerationGateway'),
  NfGenerationGateway: Symbol.for('NfGenerationGateway'),
  LoggerGateway: Symbol.for('LoggerGateway'),

  UploadFileGateway: Symbol.for('UploadFileGateway'),
  UploadFileQueueProducer: Symbol.for('UploadFileQueueProducer'),

  AccountDao: Symbol.for('AccountDao'),
  FaqDao: Symbol.for('FaqDao'),
  HonorificDao: Symbol.for('HonorificDao'),

  ClientDao: Symbol.for('ClientDao'),
  ClientRepository: Symbol.for('ClientRepository'),
  ClientSequenceRepository: Symbol.for('ClientSequenceRepository'),

  ResaleDao: Symbol.for('ResaleDao'),
  ResaleRepository: Symbol.for('ResaleRepository'),
  ResaleSequenceRepository: Symbol.for('ResaleSequenceRepository'),

  ClientContactDao: Symbol.for('ClientContactDao'),
  ClientContactRepository: Symbol.for('ClientContactRepository'),

  ResaleContactDao: Symbol.for('ResaleContactDao'),
  ResaleContactRepository: Symbol.for('ResaleContactRepository'),

  ClientTypeDao: Symbol.for('ClientTypeDao'),
  ClientAttendanceDao: Symbol.for('ClientAttendanceDao'),
  ClientAttachmentDao: Symbol.for('ClientAttachmentDao'),
  ClientDescriptionTypeDao: Symbol.for('ClientDescriptionTypeDao'),
  ClientDriveTypeDao: Symbol.for('ClientDriveTypeDao'),
  ClientMaintenanceTicketDao: Symbol.for('ClientMaintenanceTicketDao'),
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

  CarrierDao: Symbol.for('CarrierDao'),
  CarrierRepository: Symbol.for('CarrierRepository'),

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
  DepartmentDao: Symbol.for('DepartmentDao'),
  DeliveryTermDao: Symbol.for('DeliveryTermDao'),
  FreightDao: Symbol.for('FreightDao'),
  WarrantyDao: Symbol.for('WarrantyDao'),
  ProposalValidityDao: Symbol.for('ProposalValidityDao'),

  NfmDao: Symbol.for('NfmDao'),

  ServiceCatalogDao: Symbol.for('ServiceCatalogDao'),
  ServiceCatalogRepository: Symbol.for('ServiceCatalogRepository'),

  ServiceAttendanceValueDao: Symbol.for('ServiceAttendanceValueDao'),
  ServiceAttendanceValueRepository: Symbol.for('ServiceAttendanceValueRepository'),

  VoucherDao: Symbol.for('VoucherDao'),
};

export { TOKENS };
