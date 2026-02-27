const TOKENS = {
  CacheGateway: Symbol.for('CacheGateway'),
  CepLookupGateway: Symbol.for('CepLookupGateway'),
  CnpjLookupGateway: Symbol.for('CnpjLookupGateway'),
  LoggerGateway: Symbol.for('LoggerGateway'),
  UploadFileGateway: Symbol.for('UploadFileGateway'),

  AccountDao: Symbol.for('AccountDao'),
  ClientGroupDao: Symbol.for('ClientGroupDao'),
  ClientOwnerDao: Symbol.for('ClientOwnerDao'),
  FaqDao: Symbol.for('FaqDao'),

  ClientDao: Symbol.for('ClientDao'),
  ClientRepository: Symbol.for('ClientRepository'),
};

export { TOKENS };
