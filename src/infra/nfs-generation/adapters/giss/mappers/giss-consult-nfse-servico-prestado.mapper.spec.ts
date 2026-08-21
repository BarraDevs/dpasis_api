import { NfsProviderEnvironment } from '../../../dtos/nfs-provider-credentials.dto';
import {
  NfsNoteDto,
  NfsNotePartyDto,
  NfsNoteServiceDto,
  NfsNoteStatus,
  NfsNoteValuesDto,
} from '../../../dtos/find-nfs-servico-prestado.dto';
import { GissConsultNfseServicoPrestadoMapper } from './giss-consult-nfse-servico-prestado.mapper';

const emptyParty: NfsNotePartyDto = {
  document: null,
  name: null,
  municipalRegistration: null,
  email: null,
  phone: null,
  address: null,
};

const emptyValues: NfsNoteValuesDto = {
  serviceAmount: null,
  liquidAmount: null,
  calculationBase: null,
  issRate: null,
  issAmount: null,
  deductionsAmount: null,
  inssAmount: null,
  irAmount: null,
  csllAmount: null,
  otherWithholdingsAmount: null,
  unconditionalDiscount: null,
  conditionalDiscount: null,
};

const emptyService: NfsNoteServiceDto = {
  description: null,
  serviceListItemCode: null,
  municipalTaxCode: null,
  municipalTaxCodeDescription: null,
  nbsCode: null,
  municipalityCode: null,
  countryCode: null,
  incidenceMunicipalityCode: null,
  issWithheld: null,
  issExigibility: null,
};

function makeNote(overrides: Partial<NfsNoteDto> = {}): NfsNoteDto {
  return {
    nfseNumber: '',
    verificationCode: '',
    issueDate: '',
    competence: null,
    rpsNumber: 0,
    rpsSeries: '',
    rpsType: null,
    rpsIssueDate: null,
    takerDocument: null,
    takerName: null,
    serviceAmount: null,
    liquidAmount: null,
    status: NfsNoteStatus.Normal,
    simpleNationalOptant: null,
    fiscalIncentive: null,
    generatorMunicipalityCode: null,
    generatorUf: null,
    provider: emptyParty,
    taker: emptyParty,
    values: emptyValues,
    service: emptyService,
    ...overrides,
  };
}

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
                      <TomadorServico>
                        <IdentificacaoTomador>
                          <CpfCnpj><Cnpj>98765432000111</Cnpj></CpfCnpj>
                        </IdentificacaoTomador>
                        <RazaoSocial>Cliente Teste</RazaoSocial>
                      </TomadorServico>
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
    expect(result).toEqual([makeNote({
      nfseNumber: '1000',
      verificationCode: 'ABC123',
      issueDate: '2026-08-10T10:00:00',
      rpsNumber: 7,
      rpsSeries: 'NFSE',
      takerDocument: '98765432000111',
      takerName: 'Cliente Teste',
      serviceAmount: '200',
      liquidAmount: '150.5',
      status: NfsNoteStatus.Normal,
      taker: {
        ...emptyParty,
        document: '98765432000111',
        name: 'Cliente Teste',
      },
      values: {
        ...emptyValues,
        serviceAmount: '200',
        liquidAmount: '150.5',
      },
    })]);
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

  it('should map visualization fields from a full CompNfse', () => {
    // Arrange
    const xml = `<ConsultarNfseServicoPrestadoResposta>
      <ListaNfse>
        <CompNfse>
          <Nfse>
            <InfNfse>
              <Numero>55267</Numero>
              <CodigoVerificacao>OUPFLTII4</CodigoVerificacao>
              <DataEmissao>2026-07-16T10:08:02.297-03:00</DataEmissao>
              <ValoresNfse>
                <BaseCalculo>202.09</BaseCalculo>
                <Aliquota>3</Aliquota>
                <ValorIss>0</ValorIss>
                <ValorLiquidoNfse>202.09</ValorLiquidoNfse>
              </ValoresNfse>
              <DescricaoCodigoTributacaoMunicipio>Revisao,Manut.,Cons.E Rest.De Equips. Informatica</DescricaoCodigoTributacaoMunicipio>
              <PrestadorServico>
                <RazaoSocial>DPA TEC EQUIPAMENTOS DE PONTO LTDA</RazaoSocial>
                <Endereco>
                  <Endereco>Distrito Vice-Presidente Francisco Silviano Alves Brandão</Endereco>
                  <Numero>615</Numero>
                  <Complemento>CASA 01</Complemento>
                  <Bairro>Parque São Vicente</Bairro>
                  <CodigoMunicipio>3529401</CodigoMunicipio>
                  <Uf>SP</Uf>
                  <Cep>9371160</Cep>
                </Endereco>
                <Contato>
                  <Telefone>1145143522</Telefone>
                  <Email>nfe@dpatec.com.br</Email>
                </Contato>
              </PrestadorServico>
              <OrgaoGerador>
                <CodigoMunicipio>3529401</CodigoMunicipio>
                <Uf>SP</Uf>
              </OrgaoGerador>
              <DeclaracaoPrestacaoServico>
                <InfDeclaracaoPrestacaoServico>
                  <Rps>
                    <IdentificacaoRps>
                      <Numero>73046</Numero>
                      <Serie>1</Serie>
                      <Tipo>1</Tipo>
                    </IdentificacaoRps>
                    <DataEmissao>2026-07-15-03:00</DataEmissao>
                    <Status>1</Status>
                  </Rps>
                  <Competencia>2026-07-15-03:00</Competencia>
                  <Servico>
                    <Valores>
                      <ValorServicos>202.09</ValorServicos>
                      <ValorDeducoes>0</ValorDeducoes>
                      <ValorInss>0</ValorInss>
                      <ValorIr>0</ValorIr>
                      <ValorCsll>0</ValorCsll>
                      <OutrasRetencoes>0</OutrasRetencoes>
                      <ValorIss>0</ValorIss>
                      <Aliquota>3</Aliquota>
                      <DescontoIncondicionado>0</DescontoIncondicionado>
                      <DescontoCondicionado>0</DescontoCondicionado>
                    </Valores>
                    <IssRetido>2</IssRetido>
                    <ItemListaServico>1.07</ItemListaServico>
                    <CodigoTributacaoMunicipio>2250</CodigoTributacaoMunicipio>
                    <CodigoNbs>1.1501.30.00</CodigoNbs>
                    <Discriminacao>01039 - SUP.TEC.MAN.OUTROS SERV TI WEB-100</Discriminacao>
                    <CodigoMunicipio>3529401</CodigoMunicipio>
                    <CodigoPais>76</CodigoPais>
                    <ExigibilidadeISS>1</ExigibilidadeISS>
                    <MunicipioIncidencia>3529401</MunicipioIncidencia>
                  </Servico>
                  <Prestador>
                    <CpfCnpj>
                      <Cnpj>2099923000178</Cnpj>
                    </CpfCnpj>
                    <InscricaoMunicipal>16895</InscricaoMunicipal>
                  </Prestador>
                  <TomadorServico>
                    <IdentificacaoTomador>
                      <CpfCnpj>
                        <Cnpj>35083999000164</Cnpj>
                      </CpfCnpj>
                    </IdentificacaoTomador>
                    <RazaoSocial>ALL IS LOVE IND E COM DE ROUPAS E ACES LTDA</RazaoSocial>
                    <Endereco>
                      <Endereco>RUA DA GRACA, 856</Endereco>
                      <Numero>856</Numero>
                      <Bairro>BOM RETIRO</Bairro>
                      <CodigoMunicipio>3550308</CodigoMunicipio>
                      <Uf>SP</Uf>
                      <Cep>5016081</Cep>
                    </Endereco>
                    <Contato>
                      <Telefone>1133370230</Telefone>
                      <Email>faturamento@alls.com.br</Email>
                    </Contato>
                  </TomadorServico>
                  <OptanteSimplesNacional>1</OptanteSimplesNacional>
                  <IncentivoFiscal>2</IncentivoFiscal>
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
    expect(result).toEqual([makeNote({
      nfseNumber: '55267',
      verificationCode: 'OUPFLTII4',
      issueDate: '2026-07-16T10:08:02.297-03:00',
      competence: '2026-07-15-03:00',
      rpsNumber: 73046,
      rpsSeries: '1',
      rpsType: 1,
      rpsIssueDate: '2026-07-15-03:00',
      takerDocument: '35083999000164',
      takerName: 'ALL IS LOVE IND E COM DE ROUPAS E ACES LTDA',
      serviceAmount: '202.09',
      liquidAmount: '202.09',
      status: NfsNoteStatus.Normal,
      simpleNationalOptant: true,
      fiscalIncentive: false,
      generatorMunicipalityCode: '3529401',
      generatorUf: 'SP',
      provider: {
        document: '02099923000178',
        name: 'DPA TEC EQUIPAMENTOS DE PONTO LTDA',
        municipalRegistration: '16895',
        email: 'nfe@dpatec.com.br',
        phone: '1145143522',
        address: {
          street: 'Distrito Vice-Presidente Francisco Silviano Alves Brandão',
          number: '615',
          complement: 'CASA 01',
          neighborhood: 'Parque São Vicente',
          cityCodeIbge: '3529401',
          state: 'SP',
          zipCode: '09371160',
        },
      },
      taker: {
        document: '35083999000164',
        name: 'ALL IS LOVE IND E COM DE ROUPAS E ACES LTDA',
        municipalRegistration: null,
        email: 'faturamento@alls.com.br',
        phone: '1133370230',
        address: {
          street: 'RUA DA GRACA, 856',
          number: '856',
          complement: null,
          neighborhood: 'BOM RETIRO',
          cityCodeIbge: '3550308',
          state: 'SP',
          zipCode: '05016081',
        },
      },
      values: {
        serviceAmount: '202.09',
        liquidAmount: '202.09',
        calculationBase: '202.09',
        issRate: '3',
        issAmount: '0',
        deductionsAmount: '0',
        inssAmount: '0',
        irAmount: '0',
        csllAmount: '0',
        otherWithholdingsAmount: '0',
        unconditionalDiscount: '0',
        conditionalDiscount: '0',
      },
      service: {
        description: '01039 - SUP.TEC.MAN.OUTROS SERV TI WEB-100',
        serviceListItemCode: '1.07',
        municipalTaxCode: '2250',
        municipalTaxCodeDescription: 'Revisao,Manut.,Cons.E Rest.De Equips. Informatica',
        nbsCode: '1.1501.30.00',
        municipalityCode: '3529401',
        countryCode: '0076',
        incidenceMunicipalityCode: '3529401',
        issWithheld: false,
        issExigibility: 1,
      },
    })]);
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
