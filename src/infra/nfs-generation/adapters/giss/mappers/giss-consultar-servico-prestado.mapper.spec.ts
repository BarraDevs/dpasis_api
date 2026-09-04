import { ListIssuedNfsInputDto } from '../../../dtos/list-issued-nfs.dto';
import { NfsBatchErrorKind } from '../../../dtos/nfs-batch-status.dto';
import { NfsProviderEnvironment } from '../../../dtos/nfs-provider-credentials.dto';
import { GISS_NOTES_PER_PAGE, GissConsultarServicoPrestadoMapper } from './giss-consultar-servico-prestado.mapper';

function makeInput(overrides: Partial<ListIssuedNfsInputDto> = {}): ListIssuedNfsInputDto {
  return {
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    page: 1,
    providerDocument: '02099923000178',
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

function makeCompNfse(rpsNumber: number): string {
  return `<CompNfse><Nfse><InfNfse>
      <Numero>${9000 + rpsNumber}</Numero>
      <CodigoVerificacao>V${rpsNumber}</CodigoVerificacao>
      <DataEmissao>2026-07-20T10:00:00</DataEmissao>
      <DeclaracaoPrestacaoServico><InfDeclaracaoPrestacaoServico><Rps>
        <IdentificacaoRps><Numero>${rpsNumber}</Numero><Serie>A</Serie></IdentificacaoRps>
      </Rps></InfDeclaracaoPrestacaoServico></DeclaracaoPrestacaoServico>
    </InfNfse></Nfse></CompNfse>`;
}

function makePage(count: number, firstRps = 1): string {
  const comps = Array.from({ length: count }, (_, i) => makeCompNfse(firstRps + i)).join('');
  return `<ConsultarNfseServicoPrestadoResposta><ListaNfse>${comps}<Pagina>1</Pagina></ListaNfse></ConsultarNfseServicoPrestadoResposta>`;
}

describe('GissConsultarServicoPrestadoMapper - Unit tests', () => {
  describe('buildConsultarNfseServicoPrestadoXml', () => {
    it('should emit Prestador, PeriodoEmissao and Pagina in the XSD order', () => {
      // Act
      const xml = GissConsultarServicoPrestadoMapper.buildConsultarNfseServicoPrestadoXml(makeInput());

      // Assert
      expect(xml.indexOf('<p:Prestador>')).toBeLessThan(xml.indexOf('<p:PeriodoEmissao>'));
      expect(xml.indexOf('<p:PeriodoEmissao>')).toBeLessThan(xml.indexOf('<p:Pagina>'));
    });

    it('should send CNPJ and inscrição municipal inside Prestador', () => {
      // Act
      const xml = GissConsultarServicoPrestadoMapper.buildConsultarNfseServicoPrestadoXml(makeInput());

      // Assert
      expect(xml).toContain('<p1:CpfCnpj><p1:Cnpj>02099923000178</p1:Cnpj></p1:CpfCnpj>');
      expect(xml).toContain('<p1:InscricaoMunicipal>16895</p1:InscricaoMunicipal>');
    });

    it('should send the period and the page', () => {
      // Act
      const xml = GissConsultarServicoPrestadoMapper.buildConsultarNfseServicoPrestadoXml(makeInput({ page: 3 }));

      // Assert
      expect(xml).toContain('<p:DataInicial>2026-07-01</p:DataInicial>');
      expect(xml).toContain('<p:DataFinal>2026-07-31</p:DataFinal>');
      expect(xml).toContain('<p:Pagina>3</p:Pagina>');
    });

    it('should use the operation namespace on p and tipos on p1', () => {
      // Act
      const xml = GissConsultarServicoPrestadoMapper.buildConsultarNfseServicoPrestadoXml(makeInput());

      // Assert
      expect(xml).toContain('xmlns:p="http://www.giss.com.br/consultar-nfse-servico-prestado-envio-v2_04.xsd"');
      expect(xml).toContain('xmlns:p1="http://www.giss.com.br/tipos-v2_04.xsd"');
    });
  });

  describe('parseConsultarNfseServicoPrestadoResponse', () => {
    it('should map every CompNfse of the page', () => {
      // Act
      const result = GissConsultarServicoPrestadoMapper.parseConsultarNfseServicoPrestadoResponse(makePage(3));

      // Assert
      expect(result.notes).toHaveLength(3);
      expect(result.notes[0]).toEqual({
        rpsNumber: 1,
        rpsSeries: 'A',
        nfseNumber: '9001',
        verificationCode: 'V1',
        issueDate: '2026-07-20T10:00:00',
      });
    });

    it('should report endOfPages when the page is not full', () => {
      // Act
      const result = GissConsultarServicoPrestadoMapper.parseConsultarNfseServicoPrestadoResponse(makePage(3));

      // Assert
      expect(result.endOfPages).toBe(true);
    });

    it('should not report endOfPages on a full page of 50', () => {
      // Act
      const result = GissConsultarServicoPrestadoMapper.parseConsultarNfseServicoPrestadoResponse(
        makePage(GISS_NOTES_PER_PAGE),
      );

      // Assert
      expect(result.notes).toHaveLength(GISS_NOTES_PER_PAGE);
      expect(result.endOfPages).toBe(false);
    });

    it('should treat E212 as end of pagination, not as an error', () => {
      // Arrange — a página seguinte à última devolve erro, nunca lista vazia.
      const xml = `<ConsultarNfseServicoPrestadoResposta><ListaMensagemRetorno><MensagemRetorno>
        <Codigo>E212</Codigo><Mensagem>NFS-e não encontrada</Mensagem>
      </MensagemRetorno></ListaMensagemRetorno></ConsultarNfseServicoPrestadoResposta>`;

      // Act
      const result = GissConsultarServicoPrestadoMapper.parseConsultarNfseServicoPrestadoResponse(xml);

      // Assert
      expect(result).toEqual({ notes: [], endOfPages: true, errors: undefined });
    });

    it('should treat E212 hidden behind a generic V999 as end of pagination too', () => {
      // Arrange
      const xml = `<ConsultarNfseServicoPrestadoResposta><ListaMensagemRetorno><MensagemRetorno>
        <Codigo>V999</Codigo><Mensagem>E212 - NFS-e não encontrada</Mensagem>
      </MensagemRetorno></ListaMensagemRetorno></ConsultarNfseServicoPrestadoResposta>`;

      // Act
      const result = GissConsultarServicoPrestadoMapper.parseConsultarNfseServicoPrestadoResponse(xml);

      // Assert
      expect(result.errors).toBeUndefined();
      expect(result.endOfPages).toBe(true);
    });

    it('should surface a real error without treating it as the end of pagination', () => {
      // Arrange — só E212 encerra a página. Qualquer outro código é falha da consulta (RRR2).
      const xml = `<ConsultarNfseServicoPrestadoResposta><ListaMensagemRetorno><MensagemRetorno>
        <Codigo>E135</Codigo><Mensagem>Período consultado superior ao permitido</Mensagem>
      </MensagemRetorno></ListaMensagemRetorno></ConsultarNfseServicoPrestadoResposta>`;

      // Act
      const result = GissConsultarServicoPrestadoMapper.parseConsultarNfseServicoPrestadoResponse(xml);

      // Assert
      expect(result.endOfPages).toBe(false);
      expect(result.errors).toEqual([
        {
          code: 'E135',
          message: 'Período consultado superior ao permitido',
          kind: NfsBatchErrorKind.BusinessRejection,
          rpsNumber: undefined,
          rpsSeries: undefined,
        },
      ]);
    });

    it('should read the response wrapped in a SOAP envelope', () => {
      // Arrange
      const xml = `<Envelope><Body>${makePage(1)}</Body></Envelope>`;

      // Act
      const result = GissConsultarServicoPrestadoMapper.parseConsultarNfseServicoPrestadoResponse(xml);

      // Assert
      expect(result.notes).toHaveLength(1);
    });

    it('should throw when the response element is missing', () => {
      // Act & Assert
      expect(() => GissConsultarServicoPrestadoMapper.parseConsultarNfseServicoPrestadoResponse('<Outra/>'))
        .toThrow('ConsultarNfseServicoPrestadoResposta não encontrado');
    });

    it('should throw when the response has neither ListaNfse nor ListaMensagemRetorno', () => {
      // Act & Assert
      expect(() => GissConsultarServicoPrestadoMapper.parseConsultarNfseServicoPrestadoResponse(
        '<ConsultarNfseServicoPrestadoResposta><ElementoDesconhecido/></ConsultarNfseServicoPrestadoResposta>',
      )).toThrow('nem ListaNfse nem ListaMensagemRetorno');
    });
  });
});
