import { XMLParser } from 'fast-xml-parser';
import { CancelNfsInputDto, CancelNfsOutputDto } from '../../../dtos/cancel-nfs.dto';
import { GISS_CANCELAR_NFSE_ENVIO_NAMESPACE, GISS_TIPOS_NAMESPACE } from '../constants/giss-namespaces';
import { XmlEscapeUtil } from './xml-escape.util';

export class GissCancelNfseMapper {
  private static readonly RESPONSE_PARSER = new XMLParser({ removeNSPrefix: true, ignoreAttributes: false });

  // Separado, deliberadamente duplicado de GissIssueBatchMapper.buildCpfCnpj/GissBatchStatusMapper.buildCpfCnpj — não unificar.
  private static buildCpfCnpj(document: string): string {
    const digits = document.replace(/\D/g, '');
    const tag = digits.length === 11 ? 'Cpf' : 'Cnpj';
    return `<p1:CpfCnpj><p1:${tag}>${digits}</p1:${tag}></p1:CpfCnpj>`;
  }

  /**
   * Monta o XML (não assinado) de `CancelarNfseEnvio`. `InfPedidoCancelamento` carrega o atributo `Id` (igual
   * ao `LoteRps`/RPS de `EnviarLoteRpsEnvio`) e é assinado depois via `GissXmlSigner.signElementById` — não
   * `signWholeDocument` (esse é reservado a elementos sem `Id` no XSD, como `ConsultarLoteRpsEnvio`).
   *
   * NÃO CONFIRMADO: namespace do elemento raiz e a divisão exata de prefixos `p`/`p1` entre
   * `Pedido`/`InfPedidoCancelamento` (schema da operação) e `IdentificacaoNfse`/`CodigoCancelamento` (tipos
   * compartilhados) seguem por analogia com `EnviarLoteRpsEnvio`/`LoteRps`, mas não foram validados contra o
   * XSD real (ver comentário em giss-namespaces.ts).
   */
  public static buildCancelarNfseXml(input: CancelNfsInputDto): { xml: string; infId: string } {
    const infId = 'cancelamento1';

    const identificacaoNfse = '<p1:IdentificacaoNfse>'
      + `<p1:Numero>${XmlEscapeUtil.escape(input.nfseNumber)}</p1:Numero>`
      + this.buildCpfCnpj(input.providerDocument)
      + (input.providerMunicipalRegistration ? `<p1:InscricaoMunicipal>${XmlEscapeUtil.escape(input.providerMunicipalRegistration)}</p1:InscricaoMunicipal>` : '')
      + `<p1:CodigoMunicipio>${input.providerMunicipalCodeIbge}</p1:CodigoMunicipio>`
      + '</p1:IdentificacaoNfse>';

    const infPedido = `<p1:InfPedidoCancelamento Id="${infId}">`
      + identificacaoNfse
      + `<p1:CodigoCancelamento>${input.cancelReasonCode}</p1:CodigoCancelamento>`
      + '</p1:InfPedidoCancelamento>';

    const xml = `<p:CancelarNfseEnvio xmlns:p="${GISS_CANCELAR_NFSE_ENVIO_NAMESPACE}" xmlns:p1="${GISS_TIPOS_NAMESPACE}">`
      + `<p:Pedido>${infPedido}</p:Pedido>`
      + '</p:CancelarNfseEnvio>';

    return { xml, infId };
  }

  public static parseCancelarNfseResponse(xml: string): CancelNfsOutputDto {
    const parsed = this.RESPONSE_PARSER.parse(xml);
    const resposta = parsed?.Envelope?.Body?.CancelarNfseResposta ?? parsed?.CancelarNfseResposta;

    if (!resposta) {
      throw new Error('Resposta inesperada do Giss para CancelarNfse: elemento CancelarNfseResposta não encontrado');
    }

    const confirmacao = resposta.RetCancelamento?.NfseCancelamento?.Confirmacao;
    if (!confirmacao?.DataHora) {
      const mensagens = resposta.ListaMensagemRetorno?.MensagemRetorno;
      const mensagem = Array.isArray(mensagens) ? mensagens[0] : mensagens;
      const detail = mensagem ? `${mensagem.Codigo}: ${mensagem.Mensagem}` : 'sem detalhes na resposta';
      throw new Error(`Giss não confirmou o cancelamento (${detail})`);
    }

    return { confirmedAt: String(confirmacao.DataHora) };
  }
}
