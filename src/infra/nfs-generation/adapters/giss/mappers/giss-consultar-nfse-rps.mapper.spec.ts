import { NfsBatchErrorKind } from '../../../dtos/nfs-batch-status.dto';
import { FindNfsByRpsInputDto } from '../../../dtos/find-nfs-by-rps.dto';
import { NfsProviderEnvironment } from '../../../dtos/nfs-provider-credentials.dto';
import { GissConsultarNfseRpsMapper } from './giss-consultar-nfse-rps.mapper';

function makeInput(overrides: Partial<FindNfsByRpsInputDto> = {}): FindNfsByRpsInputDto {
  return {
    nfseId: 1,
    rpsNumber: 41,
    rpsSeries: 'A',
    providerDocument: '02.099.923/0001-78',
    providerMunicipalRegistration: '16895',
    provider: {
      certFilePath: '/tmp/cert.pfx',
      certPasswordEnvVar: 'GISS_CERT_PASSWORD',
      environment: NfsProviderEnvironment.Production,
      vendorConfig: { municipioSlug: 'maua' },
    },
    ...overrides,
  };
}

function makeCompNfse(): string {
  return `<CompNfse><Nfse><InfNfse>
      <Numero>12345</Numero>
      <CodigoVerificacao>ABC123</CodigoVerificacao>
      <DataEmissao>2026-07-20T10:00:00</DataEmissao>
      <DeclaracaoPrestacaoServico><InfDeclaracaoPrestacaoServico><Rps>
        <IdentificacaoRps><Numero>41</Numero><Serie>A</Serie><Tipo>1</Tipo></IdentificacaoRps>
      </Rps></InfDeclaracaoPrestacaoServico></DeclaracaoPrestacaoServico>
    </InfNfse></Nfse></CompNfse>`;
}

describe('GissConsultarNfseRpsMapper - Unit tests', () => {
  describe('buildConsultarNfsePorRpsXml', () => {
    it('should emit IdentificacaoRps before Prestador, as the XSD sequence requires', () => {
      // Act
      const xml = GissConsultarNfseRpsMapper.buildConsultarNfsePorRpsXml(makeInput());

      // Assert
      expect(xml.indexOf('<p:IdentificacaoRps>')).toBeLessThan(xml.indexOf('<p:Prestador>'));
    });

    it('should use the operation namespace on p and tipos on p1', () => {
      // Act
      const xml = GissConsultarNfseRpsMapper.buildConsultarNfsePorRpsXml(makeInput());

      // Assert
      expect(xml).toContain('xmlns:p="http://www.giss.com.br/consultar-nfse-rps-envio-v2_04.xsd"');
      expect(xml).toContain('xmlns:p1="http://www.giss.com.br/tipos-v2_04.xsd"');
      expect(xml).toContain('<p1:Numero>41</p1:Numero>');
      expect(xml).toContain('<p1:Serie>A</p1:Serie>');
    });

    it('should default Tipo to 1 (RPS)', () => {
      // Act
      const xml = GissConsultarNfseRpsMapper.buildConsultarNfsePorRpsXml(makeInput());

      // Assert
      expect(xml).toContain('<p1:Tipo>1</p1:Tipo>');
    });

    it('should strip non-digits from the provider document and pick Cnpj by length', () => {
      // Act
      const xml = GissConsultarNfseRpsMapper.buildConsultarNfsePorRpsXml(makeInput());

      // Assert
      expect(xml).toContain('<p1:CpfCnpj><p1:Cnpj>02099923000178</p1:Cnpj></p1:CpfCnpj>');
    });

    it('should use Cpf for an 11-digit provider document', () => {
      // Act
      const xml = GissConsultarNfseRpsMapper.buildConsultarNfsePorRpsXml(
        makeInput({ providerDocument: '123.456.789-09' }),
      );

      // Assert
      expect(xml).toContain('<p1:Cpf>12345678909</p1:Cpf>');
    });

    it('should omit InscricaoMunicipal when the provider config has none', () => {
      // Act
      const xml = GissConsultarNfseRpsMapper.buildConsultarNfsePorRpsXml(
        makeInput({ providerMunicipalRegistration: undefined }),
      );

      // Assert
      expect(xml).not.toContain('InscricaoMunicipal');
    });
  });

  describe('parseConsultarNfsePorRpsResponse', () => {
    it('should return the note when the provider knows the RPS', () => {
      // Arrange
      const xml = `<ConsultarNfseRpsResposta>${makeCompNfse()}</ConsultarNfseRpsResposta>`;

      // Act
      const result = GissConsultarNfseRpsMapper.parseConsultarNfsePorRpsResponse(xml);

      // Assert
      expect(result).toEqual({
        found: true,
        note: {
          rpsNumber: 41,
          rpsSeries: 'A',
          nfseNumber: '12345',
          verificationCode: 'ABC123',
          issueDate: '2026-07-20T10:00:00',
        },
      });
    });

    it('should read the response wrapped in a SOAP envelope', () => {
      // Arrange
      const xml = `<Envelope><Body><ConsultarNfseRpsResposta>${makeCompNfse()}</ConsultarNfseRpsResposta></Body></Envelope>`;

      // Act
      const result = GissConsultarNfseRpsMapper.parseConsultarNfsePorRpsResponse(xml);

      // Assert
      expect(result.found).toBe(true);
    });

    it('should return found=false with a NotFound error when the provider does not know the RPS', () => {
      // Arrange — E212 é resposta, não falha: é assim que o Giss diz "não existe".
      const xml = `<ConsultarNfseRpsResposta><ListaMensagemRetorno><MensagemRetorno>
        <Codigo>E212</Codigo><Mensagem>NFS-e não encontrada</Mensagem>
      </MensagemRetorno></ListaMensagemRetorno></ConsultarNfseRpsResposta>`;

      // Act
      const result = GissConsultarNfseRpsMapper.parseConsultarNfsePorRpsResponse(xml);

      // Assert
      expect(result.found).toBe(false);
      expect(result.errors).toEqual([
        { code: 'E212', message: 'NFS-e não encontrada', kind: NfsBatchErrorKind.NotFound, rpsNumber: undefined, rpsSeries: undefined },
      ]);
      expect(GissConsultarNfseRpsMapper.isNotFound(result.errors)).toBe(true);
    });

    it('should return found=false with a NotFound error for E89, the real answer in production', () => {
      // Arrange — capturado contra `ws-maua.giss.com.br`: RPS desconhecido volta E89, não E212.
      const xml = `<ConsultarNfseRpsResposta><ListaMensagemRetorno><MensagemRetorno>
        <Codigo>E89</Codigo><Mensagem>E89</Mensagem>
      </MensagemRetorno></ListaMensagemRetorno></ConsultarNfseRpsResposta>`;

      // Act
      const result = GissConsultarNfseRpsMapper.parseConsultarNfsePorRpsResponse(xml);

      // Assert
      expect(result.found).toBe(false);
      expect(result.errors?.[0].kind).toBe(NfsBatchErrorKind.NotFound);
      expect(GissConsultarNfseRpsMapper.isNotFound(result.errors)).toBe(true);
    });

    it('should recognise E212 even when Codigo carries the generic V999', () => {
      // Arrange — medido em produção: o código real chega dentro de `Mensagem`.
      const xml = `<ConsultarNfseRpsResposta><ListaMensagemRetorno><MensagemRetorno>
        <Codigo>V999</Codigo><Mensagem>E212 - NFS-e não encontrada</Mensagem>
      </MensagemRetorno></ListaMensagemRetorno></ConsultarNfseRpsResposta>`;

      // Act
      const result = GissConsultarNfseRpsMapper.parseConsultarNfsePorRpsResponse(xml);

      // Assert
      expect(result.errors?.[0].code).toBe('E212');
      expect(result.errors?.[0].kind).toBe(NfsBatchErrorKind.NotFound);
    });

    it('should classify a business rejection as such, not as NotFound', () => {
      // Arrange
      const xml = `<ConsultarNfseRpsResposta><ListaMensagemRetorno><MensagemRetorno>
        <Codigo>E163</Codigo><Mensagem>CNPJ do tomador inválido</Mensagem>
      </MensagemRetorno></ListaMensagemRetorno></ConsultarNfseRpsResposta>`;

      // Act
      const result = GissConsultarNfseRpsMapper.parseConsultarNfsePorRpsResponse(xml);

      // Assert
      expect(result.errors?.[0].kind).toBe(NfsBatchErrorKind.BusinessRejection);
      expect(GissConsultarNfseRpsMapper.isNotFound(result.errors)).toBe(false);
    });

    it('should throw when the response element is missing', () => {
      // Act & Assert
      expect(() => GissConsultarNfseRpsMapper.parseConsultarNfsePorRpsResponse('<Outra/>'))
        .toThrow('ConsultarNfseRpsResposta não encontrado');
    });

    it('should throw when the response has neither CompNfse nor ListaMensagemRetorno', () => {
      // Act & Assert
      expect(() => GissConsultarNfseRpsMapper.parseConsultarNfsePorRpsResponse(
        '<ConsultarNfseRpsResposta><ElementoDesconhecido/></ConsultarNfseRpsResposta>',
      )).toThrow('nem CompNfse nem ListaMensagemRetorno');
    });
  });

  describe('isNotFound', () => {
    it('should return false for an empty or undefined error list', () => {
      // Act & Assert
      expect(GissConsultarNfseRpsMapper.isNotFound(undefined)).toBe(false);
      expect(GissConsultarNfseRpsMapper.isNotFound([])).toBe(false);
    });
  });
});
