import { NfsBatchSituation } from '../../../dtos/nfs-batch-status.dto';
import { GissBatchStatusMapper } from './giss-batch-status.mapper';

describe('GissBatchStatusMapper.buildConsultarLoteRpsXml - Unit tests', () => {
  it('should be defined', () => {
    expect(GissBatchStatusMapper).toBeDefined();
  });

  it('should build a ConsultarLoteRpsEnvio XML with Prestador and Protocolo', () => {
    // Arrange & Act
    const xml = GissBatchStatusMapper.buildConsultarLoteRpsXml({
      batchProtocol: 'PROTO-123',
      providerDocument: '12345678000199',
      provider: { certFilePath: '', certPasswordEnvVar: '', environment: 'DEMONSTRATION' as any, vendorConfig: {} },
    });

    // Assert
    expect(xml).toContain('<p1:Cnpj>12345678000199</p1:Cnpj>');
    expect(xml).toContain('<p:Protocolo>PROTO-123</p:Protocolo>');
  });

  it('should use Cpf tag for 11-digit provider document', () => {
    // Arrange & Act
    const xml = GissBatchStatusMapper.buildConsultarLoteRpsXml({
      batchProtocol: 'PROTO-456',
      providerDocument: '12345678901',
      provider: { certFilePath: '', certPasswordEnvVar: '', environment: 'DEMONSTRATION' as any, vendorConfig: {} },
    });

    // Assert
    expect(xml).toContain('<p1:Cpf>12345678901</p1:Cpf>');
    expect(xml).toContain('<p:Protocolo>PROTO-456</p:Protocolo>');
    expect(xml).toContain('xmlns:p="http://www.giss.com.br/consultar-lote-rps-envio-v2_04.xsd"');
    expect(xml).toContain('xmlns:p1="http://www.giss.com.br/tipos-v2_04.xsd"');
  });
});

describe('GissBatchStatusMapper.parseConsultarLoteRpsResponse - Unit tests', () => {
  it('should parse a NOT_RECEIVED (situação 1) response', () => {
    // Arrange
    const xml = '<ConsultarLoteRpsResposta><Situacao>1</Situacao></ConsultarLoteRpsResposta>';

    // Act
    const result = GissBatchStatusMapper.parseConsultarLoteRpsResponse(xml);

    // Assert
    expect(result).toEqual({ situation: NfsBatchSituation.NotReceived, issuedNotes: undefined, errors: undefined });
  });

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
    const result = GissBatchStatusMapper.parseConsultarLoteRpsResponse(xml);

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
    const result = GissBatchStatusMapper.parseConsultarLoteRpsResponse(xml);

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

  it('should parse multiple issued notes', () => {
    // Arrange
    const xml = `<ConsultarLoteRpsResposta>
      <Situacao>4</Situacao>
      <ListaNfse>
        <CompNfse>
          <Nfse>
            <InfNfse>
              <Numero>1000</Numero>
              <CodigoVerificacao>ABC</CodigoVerificacao>
              <DataEmissao>2026-07-20T10:00:00</DataEmissao>
              <DeclaracaoPrestacaoServico>
                <InfDeclaracaoPrestacaoServico>
                  <Rps><IdentificacaoRps><Numero>7</Numero><Serie>NFSE</Serie></IdentificacaoRps></Rps>
                </InfDeclaracaoPrestacaoServico>
              </DeclaracaoPrestacaoServico>
            </InfNfse>
          </Nfse>
        </CompNfse>
        <CompNfse>
          <Nfse>
            <InfNfse>
              <Numero>1001</Numero>
              <CodigoVerificacao>DEF</CodigoVerificacao>
              <DataEmissao>2026-07-20T11:00:00</DataEmissao>
              <DeclaracaoPrestacaoServico>
                <InfDeclaracaoPrestacaoServico>
                  <Rps><IdentificacaoRps><Numero>8</Numero><Serie>NFSE</Serie></IdentificacaoRps></Rps>
                </InfDeclaracaoPrestacaoServico>
              </DeclaracaoPrestacaoServico>
            </InfNfse>
          </Nfse>
        </CompNfse>
      </ListaNfse>
    </ConsultarLoteRpsResposta>`;

    // Act
    const result = GissBatchStatusMapper.parseConsultarLoteRpsResponse(xml);

    // Assert
    expect(result.issuedNotes).toEqual([
      { rpsNumber: 7, rpsSeries: 'NFSE', nfseNumber: '1000', verificationCode: 'ABC', issueDate: '2026-07-20T10:00:00' },
      { rpsNumber: 8, rpsSeries: 'NFSE', nfseNumber: '1001', verificationCode: 'DEF', issueDate: '2026-07-20T11:00:00' },
    ]);
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
    const result = GissBatchStatusMapper.parseConsultarLoteRpsResponse(xml);

    // Assert
    expect(result.situation).toBe(NfsBatchSituation.Error);
    expect(result.errors).toEqual([{
      code: 'E02',
      message: 'Data de competência inválida',
      rpsNumber: 7,
      rpsSeries: 'NFSE',
    }]);
  });

  it('should parse ListaMensagemRetorno errors without RPS identification', () => {
    // Arrange
    const xml = `<ConsultarLoteRpsResposta>
      <Situacao>3</Situacao>
      <ListaMensagemRetorno>
        <MensagemRetorno>
          <Codigo>E99</Codigo>
          <Mensagem>Erro geral do lote</Mensagem>
        </MensagemRetorno>
      </ListaMensagemRetorno>
    </ConsultarLoteRpsResposta>`;

    // Act
    const result = GissBatchStatusMapper.parseConsultarLoteRpsResponse(xml);

    // Assert
    expect(result.errors).toEqual([{
      code: 'E99',
      message: 'Erro geral do lote',
      rpsNumber: undefined,
      rpsSeries: undefined,
    }]);
  });

  it('should parse a direct ConsultarLoteRpsResposta without SOAP envelope', () => {
    // Arrange
    const xml = '<ConsultarLoteRpsResposta><Situacao>2</Situacao></ConsultarLoteRpsResposta>';

    // Act
    const result = GissBatchStatusMapper.parseConsultarLoteRpsResponse(xml);

    // Assert
    expect(result.situation).toBe(NfsBatchSituation.Pending);
  });

  it('should throw when the situação code is unknown', () => {
    // Arrange
    const xml = '<ConsultarLoteRpsResposta><Situacao>9</Situacao></ConsultarLoteRpsResposta>';

    // Act & Assert
    expect(() => GissBatchStatusMapper.parseConsultarLoteRpsResponse(xml)).toThrow('Situação de lote desconhecida');
  });

  it('should throw when situação is empty', () => {
    // Arrange
    const xml = '<ConsultarLoteRpsResposta><Situacao></Situacao></ConsultarLoteRpsResposta>';

    // Act & Assert
    expect(() => GissBatchStatusMapper.parseConsultarLoteRpsResponse(xml)).toThrow('Situação de lote desconhecida');
  });

  it('should throw when the expected response element is missing', () => {
    // Arrange
    const xml = '<foo></foo>';

    // Act & Assert
    expect(() => GissBatchStatusMapper.parseConsultarLoteRpsResponse(xml)).toThrow('ConsultarLoteRpsResposta não encontrado');
  });
});
