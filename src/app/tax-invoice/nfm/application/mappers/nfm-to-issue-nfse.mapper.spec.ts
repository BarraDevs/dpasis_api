import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { ClientInvoiceConfigDto } from 'src/app/client/client-invoice-config/application/dtos/client-invoice-config.dto';
import { ClientItemDto } from 'src/app/client/client-item/application/dtos/client-item.dto';
import { ClientDto } from 'src/app/client/client/application/dtos/client.dto';
import { CnaeNbsIndopDto } from 'src/app/global/taxation/cnae-nbs-indop/application/dtos/cnae-nbs-indop.dto';
import { AppException } from 'src/core/filters/app.exception';
import { NfmWithoutServiceItemsError } from '../../domain/errors/nfm-without-service-items.error';
import { NfmDto } from '../dtos/nfm.dto';
import { NfmToIssueNfseMapper } from './nfm-to-issue-nfse.mapper';

function makeCnaeNbsIndop(overrides: Partial<CnaeNbsIndopDto> = {}): CnaeNbsIndopDto {
  return {
    id: 1,
    active: true,
    serviceListItemCode: '01.07',
    cnae: { id: 1, code: '6209-1/00', description: 'CNAE' },
    nbs: { id: 1, code: '1.1501.30.00', description: 'NBS' },
    indop: { id: 1, code: '050101', description: 'INDOP' },
    ...overrides,
  };
}

function makeClientItem(overrides: Partial<ClientItemDto> = {}): ClientItemDto {
  return {
    id: 1,
    clientId: 10,
    description: 'Serviço A',
    quantity: 1,
    unitValueInCents: 1000,
    totalValueInCents: 1000,
    active: true,
    cnaeNbsIndop: makeCnaeNbsIndop(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeNfm(overrides: {
  items?: ClientItemDto[];
  client?: Partial<ClientDto>;
  invoice?: Partial<ClientInvoiceConfigDto>;
} = {}): NfmDto {
  return {
    client: {
      id: 10,
      company: { id: 5, name: 'Empresa' },
      companyName: 'Cliente',
      document: '00000000000191',
    } as ClientDto,
    clientInvoiceConfig: {
      issWithheld: false,
    } as ClientInvoiceConfigDto,
    clientItems: overrides.items ?? [makeClientItem()],
    ...(overrides.client ? { client: { ...({ id: 10, company: { id: 5, name: 'Empresa' } } as ClientDto), ...overrides.client } } : {}),
    ...(overrides.invoice
      ? { clientInvoiceConfig: { issWithheld: false, ...overrides.invoice } as ClientInvoiceConfigDto }
      : {}),
  };
}

function makeProviderConfig(overrides: Partial<CompanyNfsConfigDto> = {}): CompanyNfsConfigDto {
  return {
    id: 1,
    companyId: 5,
    vendor: 'giss',
    municipalRegistration: '123',
    municipalCodeIbge: '3529401',
    serieRps: 'NFSE',
    environment: 'DEMONSTRATION',
    certFilePath: '/certs/a.pfx',
    certPasswordEnvVar: 'PWD',
    vendorConfig: { municipioSlug: 'demonstracao' },
    simpleNationalOptant: false,
    fiscalIncentive: false,
    issRate: 0.05,
    issExigibility: 1,
    municipalTaxCode: '010700',
    ...overrides,
  };
}

describe('NfmToIssueNfseMapper - Unit tests', () => {
  it('should be defined', () => {
    expect(NfmToIssueNfseMapper).toBeDefined();
  });

  it('should map grouped items concatenating description and summing value', () => {
    // Arrange
    const corr = makeCnaeNbsIndop({ id: 7 });
    const nfm = makeNfm({
      items: [
        makeClientItem({ description: 'xpto', totalValueInCents: 10, cnaeNbsIndop: corr }),
        makeClientItem({ id: 2, description: 'foo', totalValueInCents: 35, cnaeNbsIndop: corr }),
      ],
    });
    const provider = makeProviderConfig();

    // Act
    const result = NfmToIssueNfseMapper.toIssueNfseInput(nfm, provider);

    // Assert
    expect(result.companyId).toBe(5);
    expect(result.clientId).toBe(10);
    expect(result.service.description).toBe('xpto\nfoo');
    expect(result.service.servicesValue).toBe(0.45);
    expect(result.service.serviceListItemCode).toBe('01.07');
    expect(result.service.nbsCode).toBe('1.1501.30.00');
    expect(result.service.indopCode).toBe('050101');
    expect(result.service.cnaeCode).toBe('6209100');
    expect(result.service.issRate).toBe(0.05);
    expect(result.service.municipalTaxCode).toBe('010700');
    expect(result.service.issWithheld).toBe(false);
    expect(result.service.issRetentionResponsible).toBeUndefined();
  });

  it('should set issRetentionResponsible when issWithheld is true', () => {
    // Arrange
    const nfm = makeNfm({ invoice: { issWithheld: true } });

    // Act
    const result = NfmToIssueNfseMapper.toIssueNfseInput(nfm, makeProviderConfig());

    // Assert
    expect(result.service.issWithheld).toBe(true);
    expect(result.service.issRetentionResponsible).toBe(1);
  });

  it('should throw NfmWithoutServiceItemsError when clientItems is empty', () => {
    const nfm = makeNfm({ items: [] });

    expect(() => NfmToIssueNfseMapper.toIssueNfseInput(nfm, makeProviderConfig()))
      .toThrow(NfmWithoutServiceItemsError);
  });

  it('should throw when serviceListItemCode is missing', () => {
    // Arrange
    const nfm = makeNfm({
      items: [makeClientItem({ cnaeNbsIndop: makeCnaeNbsIndop({ serviceListItemCode: null }) })],
    });

    // Act / Assert
    expect(() => NfmToIssueNfseMapper.toIssueNfseInput(nfm, makeProviderConfig()))
      .toThrow(AppException);
    expect(() => NfmToIssueNfseMapper.toIssueNfseInput(nfm, makeProviderConfig()))
      .toThrow(/ItemListaServico/);
  });

  it('should throw when issRate is null', () => {
    // Arrange
    const nfm = makeNfm();
    const provider = makeProviderConfig({ issRate: null });

    // Act / Assert
    expect(() => NfmToIssueNfseMapper.toIssueNfseInput(nfm, provider))
      .toThrow(/alíquota de ISS/);
  });

  it('should throw when municipalTaxCode is missing', () => {
    // Arrange
    const nfm = makeNfm();
    const provider = makeProviderConfig({ municipalTaxCode: null });

    // Act / Assert
    expect(() => NfmToIssueNfseMapper.toIssueNfseInput(nfm, provider))
      .toThrow(/código de tributação municipal/);
  });
});
