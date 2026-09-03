import { IssueNfsBatchInputDto } from '../../../dtos/issue-nfs-batch.dto';
import { NfsIssExigibility } from '../../../dtos/nfs-service.dto';
import { NfsProviderEnvironment } from '../../../dtos/nfs-provider-credentials.dto';
import { NfsRpsType } from '../../../dtos/nfs-rps.dto';
import { NfsBatchRejectedError } from '../../../errors/nfs-batch-rejected.error';
import { NfsBatchErrorKind } from '../../../dtos/nfs-batch-status.dto';
import { GissIssueBatchMapper } from './giss-issue-batch.mapper';

function makeDefaultService(overrides: Record<string, unknown> = {}) {
  return {
    serviceListItemCode: '01.07',
    nbsCode: '1.1501.30.00',
    description: 'Desenvolvimento de sistema',
    serviceMunicipalCodeIbge: '3529401',
    issExigibility: NfsIssExigibility.Payable,
    issWithheld: false,
    servicesValue: 1000,
    ibsCbs: {
      indopCode: '050101',
      cst: '000',
      cClassTrib: '000001',
    },
    ...overrides,
  };
}

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
        service: makeDefaultService(),
        simpleNationalOptant: false,
        fiscalIncentive: false,
      },
    ],
    ...overrides,
  };
}

describe('GissIssueBatchMapper.buildIssueBatchXml - Unit tests', () => {
  it('should be defined', () => {
    expect(GissIssueBatchMapper).toBeDefined();
  });

  it('should build an EnviarLoteRpsEnvio XML with an Id attribute on LoteRps', () => {
    // Arrange
    const input = makeIssueNfsBatchInput();

    // Act
    const { xml, loteId, rpsIds } = GissIssueBatchMapper.buildIssueBatchXml(input);

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
    expect(xml).toContain('<p1:CodigoNbs>115013000</p1:CodigoNbs>');
    expect(xml).toContain('<p1:IBSCBS>');
    expect(xml).toContain('<p1:cIndOp>050101</p1:cIndOp>');
    expect(xml).toContain('<p1:cClassTrib>000001</p1:cClassTrib>');
    expect(xml).toContain('<p1:trib>');
    expect(xml).toContain('<p1:cLocalidadeIncid>3529401</p1:cLocalidadeIncid>');
  });

  it('should escape XML-special characters in free-text fields', () => {
    // Arrange
    const input = makeIssueNfsBatchInput();

    // Act
    const { xml } = GissIssueBatchMapper.buildIssueBatchXml(input);

    // Assert
    expect(xml).toContain('Cliente &amp; Cia LTDA');
  });

  it('should pad ItemListaServico to XSD enum format (1.05 → 01.05)', () => {
    // Arrange
    const input = makeIssueNfsBatchInput();
    input.rpsList[0].service = makeDefaultService({ serviceListItemCode: '1.05' });

    // Act
    const { xml } = GissIssueBatchMapper.buildIssueBatchXml(input);

    // Assert
    expect(xml).toContain('<p1:ItemListaServico>01.05</p1:ItemListaServico>');
  });

  it('should include ResponsavelRetencao and ValorIss when ISS is withheld', () => {
    // Arrange
    const input = makeIssueNfsBatchInput();
    input.rpsList[0].service = makeDefaultService({
      issWithheld: true,
      issRetentionResponsible: 1,
      issValue: 50,
    });

    // Act
    const { xml } = GissIssueBatchMapper.buildIssueBatchXml(input);

    // Assert
    expect(xml).toContain('<p1:IssRetido>1</p1:IssRetido>');
    expect(xml).toContain('<p1:ResponsavelRetencao>1</p1:ResponsavelRetencao>');
    expect(xml).toContain('<p1:ValorIss>50.00</p1:ValorIss>');
  });

  it('should throw when the rps list is empty', () => {
    // Arrange
    const input = makeIssueNfsBatchInput({ rpsList: [] });

    // Act & Assert
    expect(() => GissIssueBatchMapper.buildIssueBatchXml(input)).toThrow('Lote de RPS não pode ser vazio');
  });

  it('should throw when the rps list has more than 50 items', () => {
    // Arrange
    const rps = makeIssueNfsBatchInput().rpsList[0];
    const input = makeIssueNfsBatchInput({ rpsList: Array.from({ length: 51 }, () => rps) });

    // Act & Assert
    expect(() => GissIssueBatchMapper.buildIssueBatchXml(input)).toThrow('Lote de RPS não pode ter mais de 50 RPS');
  });

  it('should accept exactly 50 RPS in the batch', () => {
    // Arrange
    const rps = makeIssueNfsBatchInput().rpsList[0];
    const input = makeIssueNfsBatchInput({ rpsList: Array.from({ length: 50 }, () => rps) });

    // Act
    const { xml, rpsIds } = GissIssueBatchMapper.buildIssueBatchXml(input);

    // Assert
    expect(rpsIds).toHaveLength(50);
    expect(rpsIds[49]).toBe('rps50');
    expect(xml).toContain('<p1:QuantidadeRps>50</p1:QuantidadeRps>');
  });

  it('should assign sequential rpsIds and InfDeclaracaoPrestacaoServico Id for multiple RPS', () => {
    // Arrange
    const baseRps = makeIssueNfsBatchInput().rpsList[0];
    const input = makeIssueNfsBatchInput({
      rpsList: [
        { ...baseRps, rpsNumber: 1 },
        { ...baseRps, rpsNumber: 2 },
      ],
    });

    // Act
    const { xml, rpsIds } = GissIssueBatchMapper.buildIssueBatchXml(input);

    // Assert
    expect(rpsIds).toEqual(['rps1', 'rps2']);
    expect(xml).toContain('<p1:InfDeclaracaoPrestacaoServico Id="rps1">');
    expect(xml).toContain('<p1:InfDeclaracaoPrestacaoServico Id="rps2">');
  });

  it('should use Cpf tag for 11-digit provider document', () => {
    // Arrange
    const input = makeIssueNfsBatchInput();
    input.rpsList[0].provider.document = '12345678901';

    // Act
    const { xml } = GissIssueBatchMapper.buildIssueBatchXml(input);

    // Assert
    expect(xml).toContain('<p1:Cpf>12345678901</p1:Cpf>');
    expect(xml).not.toContain('<p1:Cnpj>12345678901</p1:Cnpj>');
  });

  it('should omit provider municipal registration when not provided', () => {
    // Arrange
    const input = makeIssueNfsBatchInput();
    input.rpsList[0].provider.municipalRegistration = undefined;

    // Act
    const { xml } = GissIssueBatchMapper.buildIssueBatchXml(input);

    // Assert
    expect(xml).not.toContain('<p1:InscricaoMunicipal>');
  });

  it('should include CodigoPais 0076 and MunicipioIncidencia matching service municipality', () => {
    // Arrange
    const input = makeIssueNfsBatchInput();

    // Act
    const { xml } = GissIssueBatchMapper.buildIssueBatchXml(input);

    // Assert
    expect(xml).toContain('<p1:CodigoPais>0076</p1:CodigoPais>');
    expect(xml).toContain('<p1:MunicipioIncidencia>3529401</p1:MunicipioIncidencia>');
  });

  it('should compute ValorIss from issRate when issValue is not provided', () => {
    // Arrange
    const input = makeIssueNfsBatchInput();
    input.rpsList[0].service = makeDefaultService({
      issRate: 0.05,
      servicesValue: 1000,
    });

    // Act
    const { xml } = GissIssueBatchMapper.buildIssueBatchXml(input);

    // Assert
    expect(xml).toContain('<p1:ValorIss>50.00</p1:ValorIss>');
    expect(xml).toContain('<p1:Aliquota>0.0500</p1:Aliquota>');
  });

  it('should emit ValorIss 0.00 when ISS is withheld without explicit issValue or issRate', () => {
    // Arrange
    const input = makeIssueNfsBatchInput();
    input.rpsList[0].service = makeDefaultService({
      issWithheld: true,
      issRetentionResponsible: 1,
    });

    // Act
    const { xml } = GissIssueBatchMapper.buildIssueBatchXml(input);

    // Assert
    expect(xml).toContain('<p1:ValorIss>0.00</p1:ValorIss>');
    expect(xml).toContain('<p1:ResponsavelRetencao>1</p1:ResponsavelRetencao>');
  });

  it('should include optional service valor fields when provided', () => {
    // Arrange
    const input = makeIssueNfsBatchInput();
    input.rpsList[0].service = makeDefaultService({
      deductionsValue: 10,
      inssValue: 20,
      irValue: 30,
      csllValue: 40,
      otherWithholdingsValue: 50,
      unconditionalDiscount: 60,
      conditionalDiscount: 70,
      cnaeCode: '6201500',
      municipalTaxCode: '6201500',
    });

    // Act
    const { xml } = GissIssueBatchMapper.buildIssueBatchXml(input);

    // Assert
    expect(xml).toContain('<p1:ValorDeducoes>10.00</p1:ValorDeducoes>');
    expect(xml).toContain('<p1:ValorInss>20.00</p1:ValorInss>');
    expect(xml).toContain('<p1:ValorIr>30.00</p1:ValorIr>');
    expect(xml).toContain('<p1:ValorCsll>40.00</p1:ValorCsll>');
    expect(xml).toContain('<p1:OutrasRetencoes>50.00</p1:OutrasRetencoes>');
    expect(xml).toContain('<p1:DescontoIncondicionado>60.00</p1:DescontoIncondicionado>');
    expect(xml).toContain('<p1:DescontoCondicionado>70.00</p1:DescontoCondicionado>');
    expect(xml).toContain('<p1:CodigoCnae>6201500</p1:CodigoCnae>');
    expect(xml).toContain('<p1:CodigoTributacaoMunicipio>6201500</p1:CodigoTributacaoMunicipio>');
  });

  it('should apply default IBS/CBS values when optional fields are omitted', () => {
    // Arrange
    const input = makeIssueNfsBatchInput();
    input.rpsList[0].service.ibsCbs = { indopCode: '050101' };

    // Act
    const { xml } = GissIssueBatchMapper.buildIssueBatchXml(input);

    // Assert
    expect(xml).toContain('<p1:finNFSe>0</p1:finNFSe>');
    expect(xml).toContain('<p1:indFinal>0</p1:indFinal>');
    expect(xml).toContain('<p1:indDest>0</p1:indDest>');
    expect(xml).toContain('<p1:CST>000</p1:CST>');
    expect(xml).toContain('<p1:cClassTrib>000001</p1:cClassTrib>');
    expect(xml).toContain('<p1:pRedutor>0.00</p1:pRedutor>');
  });

  it('should build taker with address, complement, email contact and CPF identification', () => {
    // Arrange
    const input = makeIssueNfsBatchInput();
    input.rpsList[0].taker = {
      identification: { document: '12345678901', municipalRegistration: '99999' },
      companyName: 'Tomador <Test>',
      address: {
        street: 'Rua A',
        number: '100',
        complement: 'Sala 2',
        neighborhood: 'Centro',
        cityCodeIbge: '3529401',
        state: 'SP',
        zipCode: '09300000',
      },
      email: 'tomador@email.com',
    };

    // Act
    const { xml } = GissIssueBatchMapper.buildIssueBatchXml(input);

    // Assert
    expect(xml).toContain('<p1:Cpf>12345678901</p1:Cpf>');
    expect(xml).toContain('<p1:InscricaoMunicipal>99999</p1:InscricaoMunicipal>');
    expect(xml).toContain('Tomador &lt;Test&gt;');
    expect(xml).toContain('<p1:Complemento>Sala 2</p1:Complemento>');
    expect(xml).toContain('<p1:Email>tomador@email.com</p1:Email>');
    expect(xml).not.toContain('<p1:Telefone>');
  });

  it('should use phone contact when email is not provided', () => {
    // Arrange
    const input = makeIssueNfsBatchInput();
    input.rpsList[0].taker = {
      companyName: 'Cliente',
      phone: '11999998888',
    };

    // Act
    const { xml } = GissIssueBatchMapper.buildIssueBatchXml(input);

    // Assert
    expect(xml).toContain('<p1:Telefone>11999998888</p1:Telefone>');
    expect(xml).not.toContain('<p1:Email>');
    expect(xml).not.toContain('<p1:IdentificacaoTomador>');
  });

  it('should omit taker block when taker is undefined', () => {
    // Arrange
    const input = makeIssueNfsBatchInput();
    input.rpsList[0].taker = undefined;

    // Act
    const { xml } = GissIssueBatchMapper.buildIssueBatchXml(input);

    // Assert
    expect(xml).not.toContain('<p1:TomadorServico>');
  });

  it('should include additional information when provided on RPS', () => {
    // Arrange
    const input = makeIssueNfsBatchInput();
    input.rpsList[0].additionalInformation = 'Info & complementar';

    // Act
    const { xml } = GissIssueBatchMapper.buildIssueBatchXml(input);

    // Assert
    expect(xml).toContain('<p1:InformacoesComplementares>Info &amp; complementar</p1:InformacoesComplementares>');
  });
});

describe('GissIssueBatchMapper.parseRecepcionarLoteRpsResponse - Unit tests', () => {
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
    const result = GissIssueBatchMapper.parseRecepcionarLoteRpsResponse(xml);

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

    // Act
    let thrown: NfsBatchRejectedError | undefined;
    try {
      GissIssueBatchMapper.parseRecepcionarLoteRpsResponse(xml);
    }
    catch (error) {
      thrown = error as NfsBatchRejectedError;
    }

    // Assert
    expect(thrown).toBeInstanceOf(NfsBatchRejectedError);
    expect(thrown!.message).toBe('E01: Estrutura do lote inválida');
    expect(thrown!.errors[0].kind).toBe(NfsBatchErrorKind.BusinessRejection);
    expect(thrown!.alreadySubmitted).toBe(false);
  });

  it('should throw when the expected response element is missing', () => {
    // Arrange
    const xml = '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body></soap:Body></soap:Envelope>';

    // Act & Assert
    expect(() => GissIssueBatchMapper.parseRecepcionarLoteRpsResponse(xml)).toThrow('EnviarLoteRpsResposta não encontrado');
  });

  it('should parse a direct EnviarLoteRpsResposta without SOAP envelope', () => {
    // Arrange
    const xml = '<EnviarLoteRpsResposta xmlns="http://www.abrasf.org.br/nfse.xsd"><Protocolo>PROTO-DIRECT</Protocolo></EnviarLoteRpsResposta>';

    // Act
    const result = GissIssueBatchMapper.parseRecepcionarLoteRpsResponse(xml);

    // Assert
    expect(result).toEqual({ batchProtocol: 'PROTO-DIRECT' });
  });

  it('should throw with sem detalhes when protocol is missing and no error message is present', () => {
    // Arrange
    const xml = '<EnviarLoteRpsResposta xmlns="http://www.abrasf.org.br/nfse.xsd"><Protocolo></Protocolo></EnviarLoteRpsResposta>';

    // Act & Assert
    expect(() => GissIssueBatchMapper.parseRecepcionarLoteRpsResponse(xml)).toThrow('sem detalhes na resposta');
  });

  it('should keep every rejection message and classify already-submitted codes via kind', () => {
    // Arrange
    const xml = `<EnviarLoteRpsResposta xmlns="http://www.abrasf.org.br/nfse.xsd">
      <ListaMensagemRetorno>
        <MensagemRetorno>
          <Codigo>A9</Codigo>
          <Mensagem>Inscrição municipal incorreta.</Mensagem>
        </MensagemRetorno>
        <MensagemRetorno>
          <Codigo>E10</Codigo>
          <Mensagem>RPS já informado.</Mensagem>
          <IdentificacaoRps><Numero>77</Numero><Serie>A1</Serie></IdentificacaoRps>
        </MensagemRetorno>
      </ListaMensagemRetorno>
    </EnviarLoteRpsResposta>`;

    // Act
    let thrown: NfsBatchRejectedError | undefined;
    try {
      GissIssueBatchMapper.parseRecepcionarLoteRpsResponse(xml);
    }
    catch (error) {
      thrown = error as NfsBatchRejectedError;
    }

    // Assert
    expect(thrown).toBeInstanceOf(NfsBatchRejectedError);
    expect(thrown!.errors).toEqual([
      {
        code: 'A9',
        message: 'Inscrição municipal incorreta.',
        kind: NfsBatchErrorKind.BusinessRejection,
        rpsNumber: undefined,
        rpsSeries: undefined,
      },
      {
        code: 'E10',
        message: 'RPS já informado.',
        kind: NfsBatchErrorKind.AlreadySubmitted,
        rpsNumber: 77,
        rpsSeries: 'A1',
      },
    ]);
    expect(thrown!.alreadySubmitted).toBe(true);
    expect(thrown!.message).toBe('A9: Inscrição municipal incorreta.; E10: RPS já informado.');
  });

  it.each(['E10', 'E71', 'A12'])('should classify GISS code %s as AlreadySubmitted', (code) => {
    // Arrange
    const xml = `<EnviarLoteRpsResposta>
      <ListaMensagemRetorno>
        <MensagemRetorno>
          <Codigo>${code}</Codigo>
          <Mensagem>RPS duplicado</Mensagem>
        </MensagemRetorno>
      </ListaMensagemRetorno>
    </EnviarLoteRpsResposta>`;

    // Act
    let thrown: NfsBatchRejectedError | undefined;
    try {
      GissIssueBatchMapper.parseRecepcionarLoteRpsResponse(xml);
    }
    catch (error) {
      thrown = error as NfsBatchRejectedError;
    }

    // Assert
    expect(thrown!.errors[0].kind).toBe(NfsBatchErrorKind.AlreadySubmitted);
    expect(thrown!.alreadySubmitted).toBe(true);
  });
});
