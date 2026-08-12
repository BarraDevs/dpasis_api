import { NfsProviderEnvironment } from '../../../dtos/nfs-provider-credentials.dto';
import { NfsNoteStatus } from '../../../dtos/find-nfs-servico-prestado.dto';
import { GissConsultNfseServicoPrestadoMapper } from './giss-consult-nfse-servico-prestado.mapper';

const baseInput = {
  provider: {
    certFilePath: '',
    certPasswordEnvVar: '',
    environment: NfsProviderEnvironment.Demonstration,
    vendorConfig: {},
  },
  providerDocument: '12345678000199',
  page: 1,
};

describe('GissConsultNfseServicoPrestadoMapper.buildConsultarNfseServicoPrestadoXml - Unit tests', () => {
  it('should be defined', () => {
    expect(GissConsultNfseServicoPrestadoMapper).toBeDefined();
  });

  it('should build XML with PeriodoEmissao', () => {
    // Arrange & Act
    const xml = GissConsultNfseServicoPrestadoMapper.buildConsultarNfseServicoPrestadoXml({
      ...baseInput,
      periodFrom: '2026-08-01',
      periodTo: '2026-08-31',
    });

    // Assert
    expect(xml).toContain('xmlns:p="http://www.giss.com.br/consultar-nfse-servico-prestado-envio-v2_04.xsd"');
    expect(xml).toContain('<p1:Cnpj>12345678000199</p1:Cnpj>');
    expect(xml).toContain('<p:PeriodoEmissao>');
    expect(xml).toContain('<p:DataInicial>2026-08-01</p:DataInicial>');
    expect(xml).toContain('<p:DataFinal>2026-08-31</p:DataFinal>');
    expect(xml).toContain('<p:Pagina>1</p:Pagina>');
    expect(xml).not.toContain('NumeroNfse');
  });

  it('should build XML with NumeroNfse', () => {
    // Arrange & Act
    const xml = GissConsultNfseServicoPrestadoMapper.buildConsultarNfseServicoPrestadoXml({
      ...baseInput,
      nfseNumber: '1000',
    });

    // Assert
    expect(xml).toContain('<p:NumeroNfse>1000</p:NumeroNfse>');
    expect(xml).not.toContain('PeriodoEmissao');
  });

  it('should include InscricaoMunicipal and Tomador when provided', () => {
    // Arrange & Act
    const xml = GissConsultNfseServicoPrestadoMapper.buildConsultarNfseServicoPrestadoXml({
      ...baseInput,
      providerMunicipalRegistration: '54321',
      nfseNumber: '10',
      takerDocument: '98765432000111',
    });

    // Assert
    expect(xml).toContain('<p1:InscricaoMunicipal>54321</p1:InscricaoMunicipal>');
    expect(xml).toContain('<p:Tomador>');
    expect(xml).toContain('<p1:Cnpj>98765432000111</p1:Cnpj>');
  });

  it('should escape XML-special characters in municipal registration', () => {
    // Arrange & Act
    const xml = GissConsultNfseServicoPrestadoMapper.buildConsultarNfseServicoPrestadoXml({
      ...baseInput,
      providerMunicipalRegistration: '54<321',
      nfseNumber: '1',
    });

    // Assert
    expect(xml).toContain('<p1:InscricaoMunicipal>54&lt;321</p1:InscricaoMunicipal>');
  });

  it('should use Cpf tag for 11-digit documents', () => {
    // Arrange & Act
    const xml = GissConsultNfseServicoPrestadoMapper.buildConsultarNfseServicoPrestadoXml({
      ...baseInput,
      providerDocument: '12345678901',
      nfseNumber: '1',
    });

    // Assert
    expect(xml).toContain('<p1:Cpf>12345678901</p1:Cpf>');
  });

  it('should throw when both period and nfseNumber are provided', () => {
    // Act & Assert
    expect(() => GissConsultNfseServicoPrestadoMapper.buildConsultarNfseServicoPrestadoXml({
      ...baseInput,
      periodFrom: '2026-08-01',
      periodTo: '2026-08-31',
      nfseNumber: '1000',
    })).toThrow('exclusivamente');
  });

  it('should throw when neither period nor nfseNumber is provided', () => {
    // Act & Assert
    expect(() => GissConsultNfseServicoPrestadoMapper.buildConsultarNfseServicoPrestadoXml(baseInput))
      .toThrow('exclusivamente');
  });
});

describe('GissConsultNfseServicoPrestadoMapper.parseConsultarNfseServicoPrestadoResponse - Unit tests', () => {
  it('should parse ListaNfse with CompNfse notes', () => {
    // Arrange
    const xml = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <ConsultarNfseServicoPrestadoResposta>
          <ListaNfse>
            <CompNfse>
              <Nfse>
                <InfNfse>
                  <Numero>1000</Numero>
                  <CodigoVerificacao>ABC123</CodigoVerificacao>
                  <DataEmissao>2026-08-10T10:00:00</DataEmissao>
                  <ValoresNfse>
                    <ValorLiquidoNfse>150.50</ValorLiquidoNfse>
                  </ValoresNfse>
                  <DeclaracaoPrestacaoServico>
                    <InfDeclaracaoPrestacaoServico>
                      <Rps>
                        <IdentificacaoRps>
                          <Numero>7</Numero>
                          <Serie>NFSE</Serie>
                        </IdentificacaoRps>
                      </Rps>
                      <Tomador>
                        <IdentificacaoTomador>
                          <CpfCnpj><Cnpj>98765432000111</Cnpj></CpfCnpj>
                        </IdentificacaoTomador>
                        <RazaoSocial>Cliente Teste</RazaoSocial>
                      </Tomador>
                      <Servico>
                        <Valores>
                          <ValorServicos>200.00</ValorServicos>
                        </Valores>
                      </Servico>
                    </InfDeclaracaoPrestacaoServico>
                  </DeclaracaoPrestacaoServico>
                </InfNfse>
              </Nfse>
            </CompNfse>
            <Pagina>1</Pagina>
          </ListaNfse>
        </ConsultarNfseServicoPrestadoResposta>
      </soap:Body>
    </soap:Envelope>`;

    // Act
    const result = GissConsultNfseServicoPrestadoMapper.parseConsultarNfseServicoPrestadoResponse(xml);

    // Assert
    expect(result).toEqual([{
      nfseNumber: '1000',
      verificationCode: 'ABC123',
      issueDate: '2026-08-10T10:00:00',
      rpsNumber: 7,
      rpsSeries: 'NFSE',
      takerDocument: '98765432000111',
      takerName: 'Cliente Teste',
      serviceAmount: '200',
      status: NfsNoteStatus.Normal,
    }]);
  });

  it('should mark status as Cancelada when NfseCancelamento is present', () => {
    // Arrange
    const xml = `<ConsultarNfseServicoPrestadoResposta>
      <ListaNfse>
        <CompNfse>
          <Nfse>
            <InfNfse>
              <Numero>2</Numero>
              <CodigoVerificacao>XYZ</CodigoVerificacao>
              <DataEmissao>2026-01-01T00:00:00</DataEmissao>
            </InfNfse>
          </Nfse>
          <NfseCancelamento><Confirmacao/></NfseCancelamento>
        </CompNfse>
        <Pagina>1</Pagina>
      </ListaNfse>
    </ConsultarNfseServicoPrestadoResposta>`;

    // Act
    const result = GissConsultNfseServicoPrestadoMapper.parseConsultarNfseServicoPrestadoResponse(xml);

    // Assert
    expect(result[0].status).toBe(NfsNoteStatus.Cancelada);
  });

  it('should throw when ListaMensagemRetorno is returned without ListaNfse', () => {
    // Arrange
    const xml = `<ConsultarNfseServicoPrestadoResposta>
      <ListaMensagemRetorno>
        <MensagemRetorno>
          <Codigo>E1</Codigo>
          <Mensagem>Erro qualquer</Mensagem>
        </MensagemRetorno>
      </ListaMensagemRetorno>
    </ConsultarNfseServicoPrestadoResposta>`;

    // Act & Assert
    expect(() => GissConsultNfseServicoPrestadoMapper.parseConsultarNfseServicoPrestadoResponse(xml))
      .toThrow('Giss rejeitou a consulta (E1: Erro qualquer)');
  });

  it('should throw when response element is missing', () => {
    // Act & Assert
    expect(() => GissConsultNfseServicoPrestadoMapper.parseConsultarNfseServicoPrestadoResponse('<Root/>'))
      .toThrow('ConsultarNfseServicoPrestadoResposta não encontrado');
  });

  it('should fallback serviceAmount to ValorLiquidoNfse when ValorServicos is missing', () => {
    // Arrange
    const xml = `<ConsultarNfseServicoPrestadoResposta>
      <ListaNfse>
        <CompNfse>
          <Nfse>
            <InfNfse>
              <Numero>3</Numero>
              <CodigoVerificacao>LQD</CodigoVerificacao>
              <DataEmissao>2026-02-01T00:00:00</DataEmissao>
              <ValoresNfse>
                <ValorLiquidoNfse>99.90</ValorLiquidoNfse>
              </ValoresNfse>
            </InfNfse>
          </Nfse>
        </CompNfse>
      </ListaNfse>
    </ConsultarNfseServicoPrestadoResposta>`;

    // Act
    const result = GissConsultNfseServicoPrestadoMapper.parseConsultarNfseServicoPrestadoResponse(xml);

    // Assert
    expect(result[0].serviceAmount).toBe('99.9');
  });

  it('should extract takerDocument from Cpf', () => {
    // Arrange
    const xml = `<ConsultarNfseServicoPrestadoResposta>
      <ListaNfse>
        <CompNfse>
          <Nfse>
            <InfNfse>
              <Numero>4</Numero>
              <CodigoVerificacao>CPF</CodigoVerificacao>
              <DataEmissao>2026-03-01T00:00:00</DataEmissao>
              <DeclaracaoPrestacaoServico>
                <InfDeclaracaoPrestacaoServico>
                  <Tomador>
                    <IdentificacaoTomador>
                      <CpfCnpj><Cpf>12345678901</Cpf></CpfCnpj>
                    </IdentificacaoTomador>
                  </Tomador>
                </InfDeclaracaoPrestacaoServico>
              </DeclaracaoPrestacaoServico>
            </InfNfse>
          </Nfse>
        </CompNfse>
      </ListaNfse>
    </ConsultarNfseServicoPrestadoResposta>`;

    // Act
    const result = GissConsultNfseServicoPrestadoMapper.parseConsultarNfseServicoPrestadoResponse(xml);

    // Assert
    expect(result[0].takerDocument).toBe('12345678901');
  });

  it('should return empty array when ListaNfse has no CompNfse', () => {
    // Arrange
    const xml = `<ConsultarNfseServicoPrestadoResposta>
      <ListaNfse>
        <Pagina>1</Pagina>
      </ListaNfse>
    </ConsultarNfseServicoPrestadoResposta>`;

    // Act
    const result = GissConsultNfseServicoPrestadoMapper.parseConsultarNfseServicoPrestadoResponse(xml);

    // Assert
    expect(result).toEqual([]);
  });
});
