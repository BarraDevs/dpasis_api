import { IssueNfsBatchInputDto } from '../../../dtos/issue-nfs-batch.dto';
import { NfsIssExigibility } from '../../../dtos/nfs-service.dto';
import { NfsProviderEnvironment } from '../../../dtos/nfs-provider-credentials.dto';
import { NfsRpsType } from '../../../dtos/nfs-rps.dto';
import { buildGissIssueBatchXml, parseGissRecepcionarLoteRpsResponse } from './giss-issue-batch.mapper';

function makeIssueNfsBatchInput(overrides: Partial<IssueNfsBatchInputDto> = {}): IssueNfsBatchInputDto {
  return {
    batchNumber: 7,
    provider: {
      certFilePath: '/certs/x.pfx',
      certPasswordEnvVar: 'X_PASS',
      environment: NfsProviderEnvironment.Demonstration,
      vendorConfig: { municipioSlug: 'demonstracao' },
    },
    rpsList: [
      {
        rpsNumber: 7,
        rpsSeries: 'NFSE',
        rpsType: NfsRpsType.Rps,
        issueDate: '2026-07-20',
        competence: '2026-07-20',
        provider: { document: '12345678000199', municipalRegistration: '12345' },
        taker: { identification: { document: '98765432000188' }, companyName: 'Cliente & Cia LTDA' },
        service: {
          serviceListItemCode: '01.07',
          nbsCode: '112731375',
          description: 'Desenvolvimento de sistema',
          serviceMunicipalCodeIbge: '3529401',
          issExigibility: NfsIssExigibility.Payable,
          issWithheld: false,
          servicesValue: 1000,
        },
        simpleNationalOptant: false,
        fiscalIncentive: false,
      },
    ],
    ...overrides,
  };
}

describe('buildGissIssueBatchXml - Unit tests', () => {
  it('should build an EnviarLoteRpsEnvio XML with an Id attribute on LoteRps', () => {
    // Arrange
    const input = makeIssueNfsBatchInput();

    // Act
    const { xml, loteId, rpsIds } = buildGissIssueBatchXml(input);

    // Assert
    expect(loteId).toBe('lote7');
    expect(rpsIds).toEqual(['rps1']);
    expect(xml).toContain('<p:EnviarLoteRpsEnvio xmlns:p="http://www.giss.com.br/enviar-lote-rps-envio-v2_04.xsd" xmlns:p1="http://www.giss.com.br/tipos-v2_04.xsd">');
    expect(xml).toContain('<p:LoteRps Id="lote7" versao="2.04">');
    expect(xml).toContain('<p1:NumeroLote>7</p1:NumeroLote>');
    expect(xml).toContain('<p1:QuantidadeRps>1</p1:QuantidadeRps>');
    expect(xml).toContain('<p1:Cnpj>12345678000199</p1:Cnpj>');
    expect(xml).toContain('<p1:ValorServicos>1000.00</p1:ValorServicos>');
    expect(xml).toContain('<p1:ItemListaServico>01.07</p1:ItemListaServico>');
  });

  it('should escape XML-special characters in free-text fields', () => {
    // Arrange
    const input = makeIssueNfsBatchInput();

    // Act
    const { xml } = buildGissIssueBatchXml(input);

    // Assert
    expect(xml).toContain('Cliente &amp; Cia LTDA');
  });

  it('should throw when the rps list is empty', () => {
    // Arrange
    const input = makeIssueNfsBatchInput({ rpsList: [] });

    // Act & Assert
    expect(() => buildGissIssueBatchXml(input)).toThrow('Lote de RPS não pode ser vazio');
  });

  it('should throw when the rps list has more than 50 items', () => {
    // Arrange
    const rps = makeIssueNfsBatchInput().rpsList[0];
    const input = makeIssueNfsBatchInput({ rpsList: Array.from({ length: 51 }, () => rps) });

    // Act & Assert
    expect(() => buildGissIssueBatchXml(input)).toThrow('Lote de RPS não pode ter mais de 50 RPS');
  });
});

describe('parseGissRecepcionarLoteRpsResponse - Unit tests', () => {
  it('should extract the batch protocol from a successful response', () => {
    // Arrange
    const xml = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <EnviarLoteRpsResposta xmlns="http://www.abrasf.org.br/nfse.xsd">
          <NumeroLote>7</NumeroLote>
          <DataRecebimento>2026-07-20T10:00:00</DataRecebimento>
          <Protocolo>PROTO-123</Protocolo>
        </EnviarLoteRpsResposta>
      </soap:Body>
    </soap:Envelope>`;

    // Act
    const result = parseGissRecepcionarLoteRpsResponse(xml);

    // Assert
    expect(result).toEqual({ batchProtocol: 'PROTO-123' });
  });

  it('should throw with the error detail when the response has no protocol', () => {
    // Arrange
    const xml = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <EnviarLoteRpsResposta xmlns="http://www.abrasf.org.br/nfse.xsd">
          <ListaMensagemRetorno>
            <MensagemRetorno>
              <Codigo>E01</Codigo>
              <Mensagem>Estrutura do lote inválida</Mensagem>
            </MensagemRetorno>
          </ListaMensagemRetorno>
        </EnviarLoteRpsResposta>
      </soap:Body>
    </soap:Envelope>`;

    // Act & Assert
    expect(() => parseGissRecepcionarLoteRpsResponse(xml)).toThrow('E01: Estrutura do lote inválida');
  });

  it('should throw when the expected response element is missing', () => {
    // Arrange
    const xml = '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body></soap:Body></soap:Envelope>';

    // Act & Assert
    expect(() => parseGissRecepcionarLoteRpsResponse(xml)).toThrow('EnviarLoteRpsResposta não encontrado');
  });
});
