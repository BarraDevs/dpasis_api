export enum NfsProviderEnvironment {
  Production = 'PRODUCTION',
  Demonstration = 'DEMONSTRATION',
  Fictitious = 'FICTITIOUS',
}

export class NfsProviderCredentialsDto {
  certFilePath: string;
  certPasswordEnvVar: string;
  environment: NfsProviderEnvironment;
  // Campos livres específicos do vendor (ex.: { municipioSlug: 'maua' } pro Giss).
  // Mantém o gateway agnóstico — cada adapter lê só as chaves que reconhece.
  vendorConfig: Record<string, unknown>;
}
