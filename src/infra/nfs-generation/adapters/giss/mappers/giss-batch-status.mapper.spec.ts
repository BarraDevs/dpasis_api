import { NfsBatchSituation } from '../../../dtos/nfs-batch-status.dto';
import { buildGissConsultarLoteRpsXml, parseGissConsultarLoteRpsResponse } from './giss-batch-status.mapper';

describe('buildGissConsultarLoteRpsXml - Unit tests', () => {
  it('should build a ConsultarLoteRpsEnvio XML with Prestador and Protocolo', () => {
    // Arrange & Act
    const xml = buildGissConsultarLoteRpsXml({
      batchProtocol: 'PROTO-123',
      providerDocument: '12345678000199',
      provider: { certFilePath: '', certPasswordEnvVar: '', environment: 'DEMONSTRATION' as any, vendorConfig: {} },
    });

    // Assert
    expect(xml).toContain('<p1:Cnpj>12345678000199</p1:Cnpj>');
    expect(xml).toContain('<p:Protocolo>PROTO-123</p:Protocolo>');
  });
});

describe('parseGissConsultarLoteRpsResponse - Unit tests', () => {
  it('should parse a PENDING (situação 2) response', () => {
    // Arrange
    const xml = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <ConsultarLoteRpsResposta xmlns="http://www.abrasf.org.br/nfse.xsd">
          <Situacao>2</Situacao>
        </ConsultarLoteRpsResposta>
      </soap:Body>
    </soap:Envelope>`;

    // Act
    const result = parseGissConsultarLoteRpsResponse(xml);

    // Assert
    expect(result).toEqual({ situation: NfsBatchSituation.Pending, issuedNotes: undefined, errors: undefined });
  });

  it('should parse a SUCCESS (situação 4) response with issued notes', () => {
    // Arrange
    const xml = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <ConsultarLoteRpsResposta xmlns="http://www.abrasf.org.br/nfse.xsd">
          <Situacao>4</Situacao>
          <ListaNfse>
            <CompNfse>
              <Nfse>
                <InfNfse>
                  <Numero>1000</Numero>
                  <CodigoVerificacao>ABC123</CodigoVerificacao>
                  <DataEmissao>2026-07-20T10:00:00</DataEmissao>
                  <DeclaracaoPrestacaoServico>
                    <InfDeclaracaoPrestacaoServico>
                      <Rps>
                        <IdentificacaoRps>
                          <Numero>7</Numero>
                          <Serie>NFSE</Serie>
                        </IdentificacaoRps>
                      </Rps>
                    </InfDeclaracaoPrestacaoServico>
                  </DeclaracaoPrestacaoServico>
                </InfNfse>
              </Nfse>
            </CompNfse>
          </ListaNfse>
        </ConsultarLoteRpsResposta>
      </soap:Body>
    </soap:Envelope>`;

    // Act
    const result = parseGissConsultarLoteRpsResponse(xml);

    // Assert
    expect(result.situation).toBe(NfsBatchSituation.Success);
    expect(result.issuedNotes).toEqual([{
      rpsNumber: 7,
      rpsSeries: 'NFSE',
      nfseNumber: '1000',
      verificationCode: 'ABC123',
      issueDate: '2026-07-20T10:00:00',
    }]);
  });

  it('should parse an ERROR (situação 3) response with lote-level messages', () => {
    // Arrange
    const xml = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <ConsultarLoteRpsResposta xmlns="http://www.abrasf.org.br/nfse.xsd">
          <Situacao>3</Situacao>
          <ListaMensagemRetornoLote>
            <MensagemRetorno>
              <IdentificacaoRps><Numero>7</Numero><Serie>NFSE</Serie></IdentificacaoRps>
              <Codigo>E02</Codigo>
              <Mensagem>Data de competência inválida</Mensagem>
            </MensagemRetorno>
          </ListaMensagemRetornoLote>
        </ConsultarLoteRpsResposta>
      </soap:Body>
    </soap:Envelope>`;

    // Act
    const result = parseGissConsultarLoteRpsResponse(xml);

    // Assert
    expect(result.situation).toBe(NfsBatchSituation.Error);
    expect(result.errors).toEqual([{
      code: 'E02',
      message: 'Data de competência inválida',
      rpsNumber: 7,
      rpsSeries: 'NFSE',
    }]);
  });

  it('should throw when the situação code is unknown', () => {
    // Arrange
    const xml = '<ConsultarLoteRpsResposta><Situacao>9</Situacao></ConsultarLoteRpsResposta>';

    // Act & Assert
    expect(() => parseGissConsultarLoteRpsResponse(xml)).toThrow('Situação de lote desconhecida');
  });

  it('should throw when the expected response element is missing', () => {
    // Arrange
    const xml = '<foo></foo>';

    // Act & Assert
    expect(() => parseGissConsultarLoteRpsResponse(xml)).toThrow('ConsultarLoteRpsResposta não encontrado');
  });
});
