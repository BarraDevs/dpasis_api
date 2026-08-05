import { CancelNfsInputDto } from '../../../dtos/cancel-nfs.dto';
import { NfsProviderEnvironment } from '../../../dtos/nfs-provider-credentials.dto';
import { GissCancelNfseMapper } from './giss-cancel-nfse.mapper';

function makeCancelNfsInput(overrides: Partial<CancelNfsInputDto> = {}): CancelNfsInputDto {
  return {
    nfseNumber: '1000',
    providerDocument: '12345678000199',
    providerMunicipalCodeIbge: '3529401',
    cancelReasonCode: 2,
    provider: {
      certFilePath: '',
      certPasswordEnvVar: '',
      environment: NfsProviderEnvironment.Demonstration,
      vendorConfig: {},
    },
    ...overrides,
  };
}

describe('GissCancelNfseMapper.buildCancelarNfseXml - Unit tests', () => {
  it('should be defined', () => {
    expect(GissCancelNfseMapper).toBeDefined();
  });

  it('should build a CancelarNfseEnvio XML with IdentificacaoNfse and CodigoCancelamento', () => {
    // Arrange & Act
    const { xml, infId } = GissCancelNfseMapper.buildCancelarNfseXml(makeCancelNfsInput());

    // Assert
    expect(infId).toBe('cancelamento1');
    expect(xml).toContain(`<p1:InfPedidoCancelamento Id="${infId}">`);
    expect(xml).toContain('<p1:Numero>1000</p1:Numero>');
    expect(xml).toContain('<p1:Cnpj>12345678000199</p1:Cnpj>');
    expect(xml).toContain('<p1:CodigoMunicipio>3529401</p1:CodigoMunicipio>');
    expect(xml).toContain('<p1:CodigoCancelamento>2</p1:CodigoCancelamento>');
    expect(xml).toContain('xmlns:p="http://www.giss.com.br/cancelar-nfse-envio-v2_04.xsd"');
    expect(xml).toContain('xmlns:p1="http://www.giss.com.br/tipos-v2_04.xsd"');
    expect(xml).toContain('<p:Pedido>');
    expect(xml).not.toContain('InscricaoMunicipal');
  });

  it('should use Cpf tag for 11-digit provider document', () => {
    // Arrange & Act
    const { xml } = GissCancelNfseMapper.buildCancelarNfseXml(makeCancelNfsInput({
      nfseNumber: '1001',
      providerDocument: '12345678901',
      cancelReasonCode: 4,
    }));

    // Assert
    expect(xml).toContain('<p1:Cpf>12345678901</p1:Cpf>');
  });

  it('should strip non-digit characters from formatted CNPJ document', () => {
    // Arrange & Act
    const { xml } = GissCancelNfseMapper.buildCancelarNfseXml(makeCancelNfsInput({
      providerDocument: '12.345.678/0001-99',
    }));

    // Assert
    expect(xml).toContain('<p1:Cnpj>12345678000199</p1:Cnpj>');
  });

  it('should strip non-digit characters from formatted CPF document', () => {
    // Arrange & Act
    const { xml } = GissCancelNfseMapper.buildCancelarNfseXml(makeCancelNfsInput({
      providerDocument: '123.456.789-01',
    }));

    // Assert
    expect(xml).toContain('<p1:Cpf>12345678901</p1:Cpf>');
  });

  it('should escape XML-special characters in nfseNumber', () => {
    // Arrange & Act
    const { xml } = GissCancelNfseMapper.buildCancelarNfseXml(makeCancelNfsInput({
      nfseNumber: '1000&1',
    }));

    // Assert
    expect(xml).toContain('<p1:Numero>1000&amp;1</p1:Numero>');
  });

  it('should escape XML-special characters in InscricaoMunicipal', () => {
    // Arrange & Act
    const { xml } = GissCancelNfseMapper.buildCancelarNfseXml(makeCancelNfsInput({
      providerMunicipalRegistration: '54<321',
    }));

    // Assert
    expect(xml).toContain('<p1:InscricaoMunicipal>54&lt;321</p1:InscricaoMunicipal>');
  });

  it('should include InscricaoMunicipal when present', () => {
    // Arrange & Act
    const { xml } = GissCancelNfseMapper.buildCancelarNfseXml(makeCancelNfsInput({
      providerMunicipalRegistration: '54321',
      cancelReasonCode: 1,
    }));

    // Assert
    expect(xml).toContain('<p1:InscricaoMunicipal>54321</p1:InscricaoMunicipal>');
  });
});

describe('GissCancelNfseMapper.parseCancelarNfseResponse - Unit tests', () => {
  it('should parse a successful cancellation confirmation', () => {
    // Arrange
    const xml = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <CancelarNfseResposta xmlns="http://nfse.abrasf.org.br">
          <RetCancelamento>
            <NfseCancelamento>
              <Confirmacao>
                <DataHora>2026-07-29T12:00:00</DataHora>
              </Confirmacao>
            </NfseCancelamento>
          </RetCancelamento>
        </CancelarNfseResposta>
      </soap:Body>
    </soap:Envelope>`;

    // Act
    const result = GissCancelNfseMapper.parseCancelarNfseResponse(xml);

    // Assert
    expect(result).toEqual({ confirmedAt: '2026-07-29T12:00:00' });
  });

  it('should parse a bare (non-enveloped) response', () => {
    // Arrange
    const xml = '<CancelarNfseResposta><RetCancelamento><NfseCancelamento><Confirmacao><DataHora>2026-07-29T12:00:00</DataHora></Confirmacao></NfseCancelamento></RetCancelamento></CancelarNfseResposta>';

    // Act
    const result = GissCancelNfseMapper.parseCancelarNfseResponse(xml);

    // Assert
    expect(result).toEqual({ confirmedAt: '2026-07-29T12:00:00' });
  });

  it('should throw with error detail when Giss rejects the cancellation', () => {
    // Arrange
    const xml = `<CancelarNfseResposta>
      <ListaMensagemRetorno>
        <MensagemRetorno><Codigo>E999</Codigo><Mensagem>Nota já cancelada</Mensagem></MensagemRetorno>
      </ListaMensagemRetorno>
    </CancelarNfseResposta>`;

    // Act & Assert
    expect(() => GissCancelNfseMapper.parseCancelarNfseResponse(xml)).toThrow('E999: Nota já cancelada');
  });

  it('should throw when the response has no recognizable root element', () => {
    // Arrange
    const xml = '<Unexpected/>';

    // Act & Assert
    expect(() => GissCancelNfseMapper.parseCancelarNfseResponse(xml)).toThrow('elemento CancelarNfseResposta não encontrado');
  });

  it('should throw with "sem detalhes na resposta" when confirmation is missing and there are no error messages', () => {
    // Arrange
    const xml = '<CancelarNfseResposta><RetCancelamento><NfseCancelamento></NfseCancelamento></RetCancelamento></CancelarNfseResposta>';

    // Act & Assert
    expect(() => GissCancelNfseMapper.parseCancelarNfseResponse(xml)).toThrow('sem detalhes na resposta');
  });

  it('should use the first MensagemRetorno when multiple errors are returned', () => {
    // Arrange
    const xml = `<CancelarNfseResposta>
      <ListaMensagemRetorno>
        <MensagemRetorno><Codigo>E001</Codigo><Mensagem>Primeiro erro</Mensagem></MensagemRetorno>
        <MensagemRetorno><Codigo>E002</Codigo><Mensagem>Segundo erro</Mensagem></MensagemRetorno>
      </ListaMensagemRetorno>
    </CancelarNfseResposta>`;

    // Act & Assert
    expect(() => GissCancelNfseMapper.parseCancelarNfseResponse(xml)).toThrow('E001: Primeiro erro');
  });

  it('should coerce DataHora to string in the output', () => {
    // Arrange — fast-xml-parser may parse numeric-looking values as numbers
    const xml = '<CancelarNfseResposta><RetCancelamento><NfseCancelamento><Confirmacao><DataHora>20260729</DataHora></Confirmacao></NfseCancelamento></RetCancelamento></CancelarNfseResposta>';

    // Act
    const result = GissCancelNfseMapper.parseCancelarNfseResponse(xml);

    // Assert
    expect(result).toEqual({ confirmedAt: '20260729' });
  });
});
