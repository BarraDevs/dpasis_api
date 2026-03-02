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
  ClientOwnerDao: Symbol.for('ClientOwnerDao'),
  ClientAddressDao: Symbol.for('ClientAddressDao'),
  ClientAddressRepository: Symbol.for('ClientAddressRepository'),
};

export { TOKENS };
