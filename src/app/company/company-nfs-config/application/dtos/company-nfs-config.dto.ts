export class CompanyNfsConfigDto {
  id: number;
  companyId: number;
  vendor: string;
  municipalRegistration: string;
  municipalCodeIbge: string;
  serieRps: string;
  environment: string;
  certFilePath: string;
  certPasswordEnvVar: string;
  vendorConfig: Record<string, unknown>;
}
